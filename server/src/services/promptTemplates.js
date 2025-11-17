/**
 * Prompt Templates for Parsons Puzzle Generation
 * Includes few-shot examples and robust response parsing
 */

// Explicit few-shot examples for LLM prompt generation
const EXPLICIT_FEW_SHOT_EXAMPLES = `Example 1 (Python - Simple function):
Correct Code:
def square(n):
    result = n * n
    return result
Expected JSON:
{
  "lines": ["def square(n):", "    result = n * n", "    return result"],
  "distractors": ["result = n * 2", "return n"],
  "solutionOrder": [0, 1, 2],
  "problem": "Calculate square of a number",
  "hint": "Multiply the number by itself"
}

Example 2 (Python - Off-by-one error distractor):
Correct Code:
def sum_first_n(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total
Expected JSON:
{
  "lines": ["def sum_first_n(n):", "    total = 0", "    for i in range(1, n + 1):", "        total += i", "    return total"],
  "distractors": ["for i in range(1, n):", "total = n"],
  "solutionOrder": [0, 1, 2, 3, 4],
  "problem": "Sum integers from 1 to n",
  "hint": "Include n in the range"
}

Example 3 (JavaScript - Wrong condition distractor):
Correct Code:
function isEven(num) {
    if (num % 2 === 0) {
        return true;
    }
    return false;
}
Expected JSON:
{
  "lines": ["function isEven(num) {", "    if (num % 2 === 0) {", "        return true;", "    }", "    return false;", "}"],
  "distractors": ["if (num % 2 === 1) {", "return num;"],
  "solutionOrder": [0, 1, 2, 3, 4, 5],
  "problem": "Check if number is even",
  "hint": "Check remainder when divided by 2"
}

Example 4 (Python - Variable name swap distractor):
Correct Code:
def swap(a, b):
    temp = a
    a = b
    b = temp
    return a, b
Expected JSON:
{
  "lines": ["def swap(a, b):", "    temp = a", "    a = b", "    b = temp", "    return a, b"],
  "distractors": ["b = a", "temp = b"],
  "solutionOrder": [0, 1, 2, 3, 4],
  "problem": "Swap two variables",
  "hint": "Use temporary variable"
}

Example 5 (JavaScript - Loop condition error):
Correct Code:
function factorial(n) {
    let result = 1;
    for (let i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}
Expected JSON:
{
  "lines": ["function factorial(n) {", "    let result = 1;", "    for (let i = 1; i <= n; i++) {", "        result *= i;", "    }", "    return result;", "}"],
  "distractors": ["for (let i = 0; i < n; i++) {", "result = n;"],
  "solutionOrder": [0, 1, 2, 3, 4, 5, 6],
  "problem": "Calculate factorial of n",
  "hint": "Multiply from 1 to n"
}

Example 6 (Python - Index off-by-one):
Correct Code:
def get_last(arr):
    if len(arr) == 0:
        return None
    return arr[len(arr) - 1]
Expected JSON:
{
  "lines": ["def get_last(arr):", "    if len(arr) == 0:", "        return None", "    return arr[len(arr) - 1]"],
  "distractors": ["return arr[len(arr)]", "if len(arr) == 1:"],
  "solutionOrder": [0, 1, 2, 3],
  "problem": "Get last element of array",
  "hint": "Last index is length minus 1"
}

Example 7 (JavaScript - Comparison operator error):
Correct Code:
function findMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}
Expected JSON:
{
  "lines": ["function findMax(arr) {", "    let max = arr[0];", "    for (let i = 1; i < arr.length; i++) {", "        if (arr[i] > max) {", "            max = arr[i];", "        }", "    }", "    return max;", "}"],
  "distractors": ["if (arr[i] < max) {", "max = arr[0];"],
  "solutionOrder": [0, 1, 2, 3, 4, 5, 6, 7, 8],
  "problem": "Find maximum value in array",
  "hint": "Compare with greater than operator"
}

Example 8 (Python - Wrong loop range):
Correct Code:
def count_down(n):
    for i in range(n, 0, -1):
        print(i)
    print("Blast off!")
Expected JSON:
{
  "lines": ["def count_down(n):", "    for i in range(n, 0, -1):", "        print(i)", "    print(\"Blast off!\")"],
  "distractors": ["for i in range(n, -1, -1):", "print(n)"],
  "solutionOrder": [0, 1, 2, 3],
  "problem": "Countdown from n to 1",
  "hint": "Range stops before 0"
}`;

/**
 * Generate prompt for LLM to create Parsons puzzle
 * 
 * @param {Object} options - Generation options
 * @param {string} options.language - Programming language (default: 'python')
 * @param {string} options.difficulty - Difficulty level: 'easy', 'medium', 'hard'
 * @param {number} options.lines - Number of lines in the puzzle (optional)
 * @param {number} options.distractors - Number of distractors (optional)
 * @param {boolean} options.examples - Include few-shot examples (default: true)
 * @returns {string} Formatted prompt for LLM
 */
export function generatePuzzlePrompt({ 
  language = 'python', 
  difficulty, 
  lines, 
  distractors, 
  examples = true 
}) {
  let prompt = `Generate a Parsons puzzle for ${language} programming.

A Parsons puzzle consists of:
1. Lines of code from a working program (scrambled)
2. Distractor lines that look similar but don't belong
3. The correct order of lines to solve the problem

`;

  // Add few-shot examples if requested
  if (examples) {
    prompt += `Few-shot examples showing correct code, plausible distractors, and expected JSON format:

${EXPLICIT_FEW_SHOT_EXAMPLES}

`;
  }

  // Add requirements
  prompt += `Requirements:
- Difficulty: ${difficulty}
- Language: ${language}
${lines ? `- Number of code lines: ${lines}` : `- For ${difficulty} difficulty: ${getLineRange(difficulty)}`}
${distractors ? `- Number of distractors: ${distractors}` : `- Number of distractors: ${getDistractorCount(difficulty)}`}
- All lines should be syntactically valid ${language}
- Distractors should be plausible but incorrect
- Code should solve a clear, educational problem
- Include proper indentation markers for ${language}

`;
  
  // Add format specification
  prompt += `IMPORTANT: Return ONLY valid JSON matching this exact schema:
{
  "lines": ["line1", "line2", ...],
  "distractors": ["distractor1", "distractor2", ...],
  "solutionOrder": [0, 1, 2, ...],
  "problem": "Brief description of what the code does",
  "hint": "Optional hint for students"
}

Schema requirements:
- "lines": Array of strings containing valid ${language} code lines (scrambled order)
- "distractors": Array of strings with plausible but incorrect lines (common errors: off-by-one, wrong operators, variable swaps)
- "solutionOrder": Array of integers indicating correct order of indices from "lines" array
- "problem": String describing what the code accomplishes
- "hint": Optional string with helpful guidance

The solutionOrder array contains indices of lines in the "lines" array, in the correct execution order.
Example: if lines=["print(x)", "x=5"], then solutionOrder=[1,0] means: first execute x=5, then print(x).

Return ONLY JSON matching schema or the assistant will be asked again.
Do not include explanations, markdown formatting, or any text outside the JSON object.`;

  return prompt;
}

/**
 * Get suggested line range for difficulty
 */
function getLineRange(difficulty) {
  const ranges = {
    easy: '4-6 lines',
    medium: '7-10 lines',
    hard: '11-15 lines'
  };
  return ranges[difficulty] || ranges.medium;
}

/**
 * Get suggested distractor count for difficulty
 */
function getDistractorCount(difficulty) {
  const counts = {
    easy: 2,
    medium: 3,
    hard: 4
  };
  return counts[difficulty] || counts.medium;
}

/**
 * Validate and parse LLM response
 * Tries JSON parsing first, falls back to regex extraction
 * 
 * @param {string} rawText - Raw text response from LLM
 * @returns {Object} Parsed puzzle data: {lines: [], distractors: [], solutionOrder: []}
 * @throws {Error} If parsing fails
 */
export function validateAndParseLLMResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Invalid input: rawText must be a non-empty string');
  }

  // Try JSON parsing first (most reliable)
  try {
    const jsonData = parseJSONResponse(rawText);
    return validateParsedData(jsonData);
  } catch (jsonError) {
    // Fall back to regex parsing
    try {
      const regexData = parseRegexResponse(rawText);
      return validateParsedData(regexData);
    } catch (regexError) {
      throw new Error(
        `Failed to parse LLM response. JSON error: ${jsonError.message}. ` +
        `Regex error: ${regexError.message}. ` +
        `Content preview: ${rawText.substring(0, 500)}`
      );
    }
  }
}

/**
 * Parse JSON from response (handles code blocks and extra text)
 */
function parseJSONResponse(text) {
  // Try direct JSON parse first
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim());
      } catch (e2) {
        // Continue to try other methods
      }
    }

    // Try to find JSON object in text
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch (e3) {
        throw new Error(`JSON parse failed: ${e3.message}`);
      }
    }

    throw new Error('No valid JSON structure found');
  }
}

/**
 * Parse response using regex (fallback method)
 */
function parseRegexResponse(text) {
  const result = {
    lines: [],
    distractors: [],
    solutionOrder: []
  };

  // Extract lines array
  const linesMatch = text.match(/"lines"\s*:\s*\[(.*?)\]/s) ||
                     text.match(/lines\s*:\s*\[(.*?)\]/s) ||
                     text.match(/lines\s*=\s*\[(.*?)\]/s);
  
  if (linesMatch) {
    result.lines = extractArrayItems(linesMatch[1]);
  }

  // Extract distractors array
  const distractorsMatch = text.match(/"distractors"\s*:\s*\[(.*?)\]/s) ||
                           text.match(/distractors\s*:\s*\[(.*?)\]/s) ||
                           text.match(/distractors\s*=\s*\[(.*?)\]/s);
  
  if (distractorsMatch) {
    result.distractors = extractArrayItems(distractorsMatch[1]);
  }

  // Extract solutionOrder array
  const orderMatch = text.match(/"solutionOrder"\s*:\s*\[(.*?)\]/s) ||
                     text.match(/solutionOrder\s*:\s*\[(.*?)\]/s) ||
                     text.match(/solutionOrder\s*=\s*\[(.*?)\]/s) ||
                     text.match(/solution.*?order\s*:\s*\[(.*?)\]/is);
  
  if (orderMatch) {
    const orderStr = orderMatch[1].trim();
    // Extract numbers from order string
    const numbers = orderStr.match(/\d+/g);
    if (numbers) {
      result.solutionOrder = numbers.map(Number);
    }
  }

  // If we have some data, return it (validation will catch issues)
  if (result.lines.length > 0 || result.distractors.length > 0 || result.solutionOrder.length > 0) {
    return result;
  }

  throw new Error('Could not extract puzzle data using regex patterns');
}

/**
 * Extract array items from string representation
 * Handles quoted strings, numbers, and nested structures
 */
function extractArrayItems(arrayStr) {
  const items = [];
  const trimmed = arrayStr.trim();
  
  if (!trimmed) {
    return items;
  }

  // Try to parse as JSON array first
  try {
    const parsed = JSON.parse(`[${trimmed}]`);
    return parsed;
  } catch (e) {
    // Fall back to regex extraction
  }

  // Extract quoted strings or numbers
  const itemPattern = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'|(\d+)/g;
  let match;
  
  while ((match = itemPattern.exec(trimmed)) !== null) {
    if (match[1] !== undefined) {
      // Double-quoted string
      items.push(match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\'));
    } else if (match[3] !== undefined) {
      // Single-quoted string
      items.push(match[3].replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\'));
    } else if (match[5] !== undefined) {
      // Number
      items.push(Number(match[5]));
    }
  }

  return items;
}

/**
 * Validate parsed data structure
 */
function validateParsedData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Parsed data is not an object');
  }

  // Validate and normalize lines
  if (!Array.isArray(data.lines)) {
    throw new Error('Missing or invalid "lines" array');
  }
  const lines = data.lines.filter(line => line !== null && line !== undefined)
    .map(line => String(line).trim())
    .filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('"lines" array is empty');
  }

  // Validate and normalize distractors
  const distractors = Array.isArray(data.distractors)
    ? data.distractors
      .filter(d => d !== null && d !== undefined)
      .map(d => String(d).trim())
      .filter(d => d.length > 0)
    : [];

  // Validate and normalize solutionOrder
  if (!Array.isArray(data.solutionOrder)) {
    throw new Error('Missing or invalid "solutionOrder" array');
  }
  const solutionOrder = data.solutionOrder
    .map(n => Number(n))
    .filter(n => !isNaN(n) && n >= 0 && n < lines.length);

  if (solutionOrder.length === 0) {
    throw new Error('"solutionOrder" array is empty or invalid');
  }

  // Check that all solutionOrder indices are valid
  const invalidIndices = solutionOrder.filter(idx => idx < 0 || idx >= lines.length);
  if (invalidIndices.length > 0) {
    throw new Error(
      `Invalid indices in solutionOrder: ${invalidIndices.join(', ')}. ` +
      `Valid range: 0-${lines.length - 1}`
    );
  }

  // Check that all indices appear exactly once (or allow duplicates if that's the puzzle design)
  const uniqueIndices = new Set(solutionOrder);
  if (uniqueIndices.size !== solutionOrder.length && lines.length === solutionOrder.length) {
    console.warn('Warning: solutionOrder contains duplicate indices');
  }

  return {
    lines,
    distractors,
    solutionOrder,
    problem: data.problem || '',
    hint: data.hint || ''
  };
}
