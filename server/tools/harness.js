/**
 * Puzzle Generation Test Harness
 * Auto-generates puzzles, validates them, and tests solvability
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callLLM } from '../src/services/llmAdapter.js';
import { generatePuzzlePrompt, validateAndParseLLMResponse } from '../src/services/promptTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - can be overridden via command line
const args = process.argv.slice(2);
let FINAL_TOTAL_PUZZLES = 200;

// Parse --puzzles argument (supports both --puzzles=20 and --puzzles 20)
const puzzlesArg = args.find(arg => arg.startsWith('--puzzles='));
if (puzzlesArg) {
  FINAL_TOTAL_PUZZLES = parseInt(puzzlesArg.split('=')[1], 10) || 200;
} else {
  const puzzlesIndex = args.indexOf('--puzzles');
  if (puzzlesIndex !== -1 && args[puzzlesIndex + 1]) {
    FINAL_TOTAL_PUZZLES = parseInt(args[puzzlesIndex + 1], 10) || 200;
  }
}

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const PUZZLES_PER_DIFFICULTY = Math.floor(FINAL_TOTAL_PUZZLES / DIFFICULTIES.length);
const LANGUAGES = ['python', 'javascript'];
const OUTPUT_DIR = path.join(__dirname, '../harness-output');
const LOGS_DIR = path.join(OUTPUT_DIR, 'logs');
const FAILURES_DIR = path.join(OUTPUT_DIR, 'failures');

// Statistics tracking
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  byDifficulty: {
    easy: { total: 0, passed: 0, failed: 0 },
    medium: { total: 0, passed: 0, failed: 0 },
    hard: { total: 0, passed: 0, failed: 0 }
  },
  byLanguage: {
    python: { total: 0, passed: 0, failed: 0 },
    javascript: { total: 0, passed: 0, failed: 0 }
  },
  failureReasons: {
    parseError: 0,
    schemaValidation: 0,
    unsolvable: 0,
    invalidSolutionOrder: 0,
    other: 0
  }
};

// Create output directories
function setupDirectories() {
  [OUTPUT_DIR, LOGS_DIR, FAILURES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Generate a single puzzle using LLM
 */
async function generatePuzzle(difficulty, language, attempt = 1) {
  try {
    const prompt = generatePuzzlePrompt({
      language,
      difficulty,
      examples: true
    });

    // Call LLM with prompt (callLLM normalizes string to messages format)
    const promptObj = {
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating educational programming puzzles. Return ONLY valid JSON matching the exact schema provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    // callLLM returns parsed JSON object directly
    const llmResponse = await callLLM(promptObj, {
      reasoning: false,
      temperature: 0.7
    });

    // callLLM already returns parsed JSON, so we can validate it directly
    // But validateAndParseLLMResponse expects a string, so we stringify first if needed
    let puzzle;
    if (typeof llmResponse === 'string') {
      // If it's a string, parse it
      puzzle = validateAndParseLLMResponse(llmResponse);
    } else {
      // If it's already an object, validate it directly
      // We need to use validateAndParseLLMResponse's validation logic
      // But it expects a string, so stringify first
      puzzle = validateAndParseLLMResponse(JSON.stringify(llmResponse));
    }

    return {
      success: true,
      puzzle: {
        ...puzzle,
        difficulty,
        language,
        generated_at: new Date().toISOString(),
        id: `puzzle-${difficulty}-${language}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      error: null
    };
  } catch (error) {
    return {
      success: false,
      puzzle: null,
      error: {
        message: error.message,
        type: classifyError(error),
        stack: error.stack
      }
    };
  }
}

/**
 * Classify error type
 */
function classifyError(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('parse') || message.includes('json')) {
    return 'parseError';
  }
  if (message.includes('schema') || message.includes('validation') || message.includes('missing') || message.includes('invalid')) {
    return 'schemaValidation';
  }
  if (message.includes('solution') || message.includes('order')) {
    return 'invalidSolutionOrder';
  }
  
  return 'other';
}

/**
 * Validate puzzle schema
 */
function validatePuzzleSchema(puzzle) {
  const errors = [];

  // Required fields
  if (!puzzle.lines || !Array.isArray(puzzle.lines)) {
    errors.push('Missing or invalid "lines" array');
  }
  
  if (!puzzle.distractors || !Array.isArray(puzzle.distractors)) {
    errors.push('Missing or invalid "distractors" array');
  }
  
  if (!puzzle.solutionOrder || !Array.isArray(puzzle.solutionOrder)) {
    errors.push('Missing or invalid "solutionOrder" array');
  }

  if (puzzle.lines && puzzle.lines.length === 0) {
    errors.push('"lines" array is empty');
  }

  if (puzzle.solutionOrder && puzzle.lines) {
    // Check solutionOrder indices are valid
    const invalidIndices = puzzle.solutionOrder.filter(
      idx => !Number.isInteger(idx) || idx < 0 || idx >= puzzle.lines.length
    );
    
    if (invalidIndices.length > 0) {
      errors.push(`Invalid indices in solutionOrder: ${invalidIndices.join(', ')}`);
    }

    // Check all line indices appear in solutionOrder
    const uniqueIndices = new Set(puzzle.solutionOrder);
    if (uniqueIndices.size !== puzzle.lines.length) {
      errors.push(`solutionOrder has ${uniqueIndices.size} unique indices but lines has ${puzzle.lines.length} items`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simulate ideal solver - reorder lines to match solutionOrder
 * Returns true if puzzle is solvable (can be reordered correctly)
 */
function simulateIdealSolver(puzzle) {
  try {
    // Get the scrambled lines
    const scrambledLines = [...puzzle.lines];
    const distractors = [...puzzle.distractors];
    
    // Combine lines and distractors for simulation
    const allItems = [...scrambledLines, ...distractors];
    
    // Apply solutionOrder to reconstruct correct order
    const reconstructed = puzzle.solutionOrder.map(idx => {
      if (idx < 0 || idx >= scrambledLines.length) {
        throw new Error(`Invalid index in solutionOrder: ${idx}`);
      }
      return scrambledLines[idx];
    });

    // Verify reconstructed order makes sense
    // For now, we just check that the indices are valid and we can reconstruct
    // A more sophisticated check could verify the code is syntactically valid
    
    // Check that all indices from 0 to lines.length-1 appear exactly once
    const expectedIndices = new Set(
      Array.from({ length: puzzle.lines.length }, (_, i) => i)
    );
    const actualIndices = new Set(puzzle.solutionOrder);
    
    if (expectedIndices.size !== actualIndices.size) {
      return {
        solvable: false,
        reason: 'solutionOrder does not contain all required indices'
      };
    }

    // Check for duplicates
    if (puzzle.solutionOrder.length !== new Set(puzzle.solutionOrder).size) {
      return {
        solvable: false,
        reason: 'solutionOrder contains duplicate indices'
      };
    }

    // Puzzle is solvable if we can reconstruct it
    return {
      solvable: true,
      reconstructed,
      reason: null
    };
  } catch (error) {
    return {
      solvable: false,
      reason: error.message
    };
  }
}

/**
 * Log failure for manual review
 */
function logFailure(puzzle, error, reason) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `failure-${timestamp}-${puzzle?.id || 'unknown'}.json`;
  const filepath = path.join(FAILURES_DIR, filename);

  const failure = {
    timestamp: new Date().toISOString(),
    puzzle: puzzle || null,
    error: error || null,
    reason: reason || 'unknown',
    stats: {
      difficulty: puzzle?.difficulty || 'unknown',
      language: puzzle?.language || 'unknown'
    }
  };

  fs.writeFileSync(filepath, JSON.stringify(failure, null, 2));
  return filename;
}

/**
 * Test a single puzzle
 */
async function testPuzzle(difficulty, language, puzzleIndex) {
  const totalPuzzles = FINAL_TOTAL_PUZZLES;
  const result = {
    id: `puzzle-${difficulty}-${language}-${puzzleIndex}`,
    difficulty,
    language,
    index: puzzleIndex,
    generated: false,
    validated: false,
    solvable: false,
    passed: false,
    error: null,
    failureReason: null
  };

  try {
    // Generate puzzle
    console.log(`[${puzzleIndex}/${totalPuzzles}] Generating ${difficulty} ${language} puzzle...`);
    const generation = await generatePuzzle(difficulty, language);
    
    if (!generation.success) {
      result.error = generation.error;
      result.failureReason = generation.error.type;
      stats.failureReasons[generation.error.type] = (stats.failureReasons[generation.error.type] || 0) + 1;
      logFailure(null, generation.error, generation.error.type);
      return result;
    }

    result.generated = true;
    result.puzzle = generation.puzzle;

    // Validate schema
    const validation = validatePuzzleSchema(generation.puzzle);
    if (!validation.valid) {
      result.error = { message: validation.errors.join('; '), type: 'schemaValidation' };
      result.failureReason = 'schemaValidation';
      stats.failureReasons.schemaValidation++;
      logFailure(generation.puzzle, result.error, 'schemaValidation');
      return result;
    }

    result.validated = true;

    // Test solvability
    const solverResult = simulateIdealSolver(generation.puzzle);
    if (!solverResult.solvable) {
      result.error = { message: solverResult.reason, type: 'unsolvable' };
      result.failureReason = 'unsolvable';
      stats.failureReasons.unsolvable++;
      logFailure(generation.puzzle, result.error, 'unsolvable');
      return result;
    }

    result.solvable = true;
    result.passed = true;
    
    return result;
  } catch (error) {
    result.error = {
      message: error.message,
      type: 'other',
      stack: error.stack
    };
    result.failureReason = 'other';
    stats.failureReasons.other++;
    logFailure(result.puzzle, result.error, 'other');
    return result;
  }
}

/**
 * Generate CSV summary
 */
function generateCSVSummary(results) {
  const csvRows = [
    'ID,Difficulty,Language,Generated,Validated,Solvable,Passed,FailureReason'
  ];

  results.forEach(result => {
    csvRows.push([
      result.id,
      result.difficulty,
      result.language,
      result.generated ? 'YES' : 'NO',
      result.validated ? 'YES' : 'NO',
      result.solvable ? 'YES' : 'NO',
      result.passed ? 'YES' : 'NO',
      result.failureReason || ''
    ].join(','));
  });

  // Add summary rows
  csvRows.push('');
  csvRows.push('SUMMARY,Count');
  csvRows.push(`Total,${stats.total}`);
  csvRows.push(`Passed,${stats.passed}`);
  csvRows.push(`Failed,${stats.failed}`);
  csvRows.push('');
  
  csvRows.push('BY DIFFICULTY,Total,Passed,Failed,Pass Rate');
  Object.entries(stats.byDifficulty).forEach(([diff, s]) => {
    const passRate = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : '0.0';
    csvRows.push(`${diff},${s.total},${s.passed},${s.failed},${passRate}%`);
  });
  
  csvRows.push('');
  csvRows.push('BY LANGUAGE,Total,Passed,Failed,Pass Rate');
  Object.entries(stats.byLanguage).forEach(([lang, s]) => {
    const passRate = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : '0.0';
    csvRows.push(`${lang},${s.total},${s.passed},${s.failed},${passRate}%`);
  });
  
  csvRows.push('');
  csvRows.push('FAILURE REASONS,Count');
  Object.entries(stats.failureReasons).forEach(([reason, count]) => {
    csvRows.push(`${reason},${count}`);
  });

  const csvContent = csvRows.join('\n');
  const csvPath = path.join(OUTPUT_DIR, `summary-${Date.now()}.csv`);
  fs.writeFileSync(csvPath, csvContent);
  
  console.log(`\nCSV summary saved to: ${csvPath}`);
  return csvPath;
}

/**
 * Main harness function
 */
async function runHarness() {
  const totalPuzzles = FINAL_TOTAL_PUZZLES;
  console.log('='.repeat(60));
  console.log('Puzzle Generation Test Harness');
  console.log(`Generating ${totalPuzzles} puzzles across ${DIFFICULTIES.join(', ')} difficulties`);
  if (totalPuzzles !== 200) {
    console.log(`Running in smoke-test mode with ${totalPuzzles} puzzles`);
  }
  console.log('='.repeat(60));

  setupDirectories();

  const results = [];
  let puzzleIndex = 0;
  const totalPuzzles = FINAL_TOTAL_PUZZLES;
  const puzzlesPerDifficulty = Math.floor(totalPuzzles / DIFFICULTIES.length);

  // Generate puzzles for each difficulty
  for (const difficulty of DIFFICULTIES) {
    for (let i = 0; i < puzzlesPerDifficulty; i++) {
      const language = LANGUAGES[puzzleIndex % LANGUAGES.length];
      puzzleIndex++;

      const result = await testPuzzle(difficulty, language, puzzleIndex);
      results.push(result);

      // Update statistics
      stats.total++;
      stats.byDifficulty[difficulty].total++;
      stats.byLanguage[language].total++;

      if (result.passed) {
        stats.passed++;
        stats.byDifficulty[difficulty].passed++;
        stats.byLanguage[language].passed++;
        console.log(`  ✓ Passed: ${result.id}`);
      } else {
        stats.failed++;
        stats.byDifficulty[difficulty].failed++;
        stats.byLanguage[language].failed++;
        console.log(`  ✗ Failed: ${result.id} - ${result.failureReason || 'unknown'}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Generate remaining puzzles if totalPuzzles is not divisible by difficulty count
  const remaining = totalPuzzles - puzzleIndex;
  if (remaining > 0) {
    for (let i = 0; i < remaining; i++) {
      const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];
      const language = LANGUAGES[(puzzleIndex + i) % LANGUAGES.length];
      puzzleIndex++;

      const result = await testPuzzle(difficulty, language, puzzleIndex);
      results.push(result);

      stats.total++;
      stats.byDifficulty[difficulty].total++;
      stats.byLanguage[language].total++;

      if (result.passed) {
        stats.passed++;
        stats.byDifficulty[difficulty].passed++;
        stats.byLanguage[language].passed++;
      } else {
        stats.failed++;
        stats.byDifficulty[difficulty].failed++;
        stats.byLanguage[language].failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Generate CSV summary (only if puzzles were generated)
  let csvPath = null;
  if (results.length > 0) {
    csvPath = generateCSVSummary(results);
  }

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${stats.total}`);
  console.log(`Passed: ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
  console.log('\nBy Difficulty:');
  Object.entries(stats.byDifficulty).forEach(([diff, s]) => {
    const passRate = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : '0.0';
    console.log(`  ${diff}: ${s.passed}/${s.total} (${passRate}%)`);
  });
  console.log('\nBy Language:');
  Object.entries(stats.byLanguage).forEach(([lang, s]) => {
    const passRate = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : '0.0';
    console.log(`  ${lang}: ${s.passed}/${s.total} (${passRate}%)`);
  });
  console.log('\nFailure Reasons:');
  Object.entries(stats.failureReasons).forEach(([reason, count]) => {
    if (count > 0) {
      console.log(`  ${reason}: ${count}`);
    }
  });
  if (fs.existsSync(FAILURES_DIR)) {
    console.log(`\nFailures logged to: ${FAILURES_DIR}`);
  }
  if (csvPath) {
    console.log(`CSV summary: ${csvPath}`);
  }
  console.log('='.repeat(60));

  // Exit with error code if failures exceed threshold
  const failureRate = stats.total > 0 ? (stats.failed / stats.total) : 0;
  const exitCode = failureRate > 0.5 ? 1 : 0; // Fail if more than 50% failures

  return {
    stats,
    results,
    csvPath,
    exitCode
  };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('harness.js')) {
  runHarness()
    .then(result => {
      console.log('\nHarness completed.');
      process.exit(result.exitCode || 0);
    })
    .catch(error => {
      console.error('\nHarness failed:', error);
      process.exit(1);
    });
}

export { runHarness, testPuzzle, simulateIdealSolver, validatePuzzleSchema };

