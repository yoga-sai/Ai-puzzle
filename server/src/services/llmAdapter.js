/**
 * LLM Adapter for OpenRouter API
 * Provides fetch-based interface with retries, timeout, and error handling
 */
import { generatePuzzlePrompt, validateAndParseLLMResponse } from './promptTemplates.js'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // Start with 1 second

/**
 * Call OpenRouter LLM API with retries and error handling
 * 
 * @param {Object|string} promptObj - Prompt object or string. If object, should have structure like:
 *   { messages: [{ role: 'user', content: '...' }] }
 *   or simple string will be converted to messages format
 * @param {Object} options - Additional options
 * @param {boolean} options.reasoning - Enable reasoning mode (default: false)
 * @param {number} options.temperature - Temperature for generation (default: 0.2)
 * @returns {Promise<Object>} Parsed JSON content from LLM response
 * @throws {Error} If API key is missing, request fails, or response is invalid JSON
 */
export async function callLLM(promptObj, { reasoning = false, temperature = 0.2 } = {}) {
  // Validate API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required but not set');
  }

  // Normalize prompt to messages format
  const messages = normalizePrompt(promptObj);

  // Prepare request body
  const requestBody = {
    model: DEFAULT_MODEL,
    messages: messages,
    temperature: Math.max(0, Math.min(2, temperature)), // Clamp between 0 and 2
    ...(reasoning && { extra_body: { reasoning: true } })
  };

  // Retry logic with exponential backoff
  let lastError;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await makeRequest(apiKey, requestBody);
      const jsonContent = parseResponse(response);
      
      if (attempt > 0) {
        console.log(`[llmAdapter] Request succeeded on attempt ${attempt + 1}`);
      }
      
      return jsonContent;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        console.error(`[llmAdapter] Non-retryable error: ${error.message}`);
        throw error;
      }

      // Calculate backoff (exponential: 1s, 2s, 4s)
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      
      if (attempt < MAX_RETRIES - 1) {
        console.warn(
          `[llmAdapter] Attempt ${attempt + 1} failed: ${error.message}. ` +
          `Retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
      } else {
        console.error(`[llmAdapter] All ${MAX_RETRIES} attempts failed`);
      }
    }
  }

  // All retries exhausted
  throw new Error(
    `LLM request failed after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`
  );
}

/**
 * Generate an adaptive puzzle using prompt templates and OpenRouter
 */
export async function generateAdaptivePuzzle({ topic, difficulty = 'medium', userId, language = 'python' }) {
  const prompt = generatePuzzlePrompt({ language, difficulty, examples: true })
  const messages = [{ role: 'system', content: 'You are an expert at creating educational programming puzzles. Return ONLY valid JSON.' }, { role: 'user', content: prompt + `\nTopic: ${topic}` }]
  const raw = await callLLM({ messages }, { reasoning: false, temperature: 0.7 })
  const parsed = typeof raw === 'string' ? validateAndParseLLMResponse(raw) : validateAndParseLLMResponse(JSON.stringify(raw))
  return {
    title: `Parsons: ${topic}`,
    description: parsed.problem || `Arrange the lines to solve: ${topic}`,
    difficulty,
    category: topic,
    segments: parsed.lines,
    correct_order: parsed.solutionOrder,
    distractors: parsed.distractors || [],
    language
  }
}

/**
 * Make HTTP request to OpenRouter API with timeout
 */
async function makeRequest(apiKey, requestBody) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'http://localhost:4000',
        'X-Title': process.env.OPENROUTER_TITLE || 'Adaptive Parsons'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(`OpenRouter API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('Invalid API response: missing or empty choices array');
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid API response: missing content in message');
    }

    return content;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${DEFAULT_TIMEOUT}ms`);
    }
    
    // Re-throw if already our formatted error
    if (error.message.includes('OpenRouter API error') || 
        error.message.includes('Invalid API response') ||
        error.message.includes('Request timeout')) {
      throw error;
    }
    
    // Network or other errors
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Parse JSON content from LLM response
 * Handles cases where JSON might be wrapped in markdown code blocks
 */
function parseResponse(content) {
  try {
    // Try parsing directly first
    return JSON.parse(content);
  } catch (e) {
    // Content might be wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                     content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr.trim());
      } catch (parseError) {
        throw new Error(
          `Failed to parse JSON from LLM response: ${parseError.message}. ` +
          `Content preview: ${content.substring(0, 200)}`
        );
      }
    }
    
    throw new Error(
      `No valid JSON found in LLM response. Content preview: ${content.substring(0, 200)}`
    );
  }
}

/**
 * Normalize prompt input to messages format
 */
function normalizePrompt(promptObj) {
  // If it's already in messages format
  if (typeof promptObj === 'object' && Array.isArray(promptObj.messages)) {
    return promptObj.messages;
  }
  
  // If it's a string, convert to messages format
  if (typeof promptObj === 'string') {
    return [{ role: 'user', content: promptObj }];
  }
  
  // If it's an object with role/content structure
  if (typeof promptObj === 'object' && promptObj.content) {
    return [{ role: promptObj.role || 'user', content: promptObj.content }];
  }
  
  throw new Error(
    'Invalid prompt format. Expected string, object with messages array, or object with content property'
  );
}

/**
 * Check if error is non-retryable (e.g., authentication, validation errors)
 */
function isNonRetryableError(error) {
  const message = error.message.toLowerCase();
  
  // Don't retry on authentication errors
  if (message.includes('401') || message.includes('unauthorized') || 
      message.includes('invalid api key') || message.includes('authentication')) {
    return true;
  }
  
  // Don't retry on validation errors (4xx status codes except 429)
  if (message.includes('400') || message.includes('403') || message.includes('404') ||
      (message.includes('http 4') && !message.includes('429'))) {
    return true;
  }
  
  return false;
}

/**
 * Sleep utility for backoff delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
