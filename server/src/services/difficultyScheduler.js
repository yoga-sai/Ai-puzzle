/**
 * Difficulty Scheduler Service
 * Maps user skill levels to puzzle difficulty parameters
 * Includes guardrails and smoothing for adaptive difficulty adjustment
 */

// Skill bands and their corresponding difficulty parameters
// Each band maps to: { difficultyScore, lines, distractors, semanticTraps }
const SKILL_BAND_MAPPING = {
  // Beginner: 0-20 skill
  0: {
    difficultyScore: 1.0, // Easy
    lines: { min: 4, max: 6, optimal: 5 },
    distractors: { min: 1, max: 2, optimal: 1 },
    semanticTraps: { min: 0, max: 1, optimal: 0 },
    difficulty: 'easy'
  },
  // Novice: 21-35 skill
  1: {
    difficultyScore: 1.5, // Easy-Medium
    lines: { min: 5, max: 7, optimal: 6 },
    distractors: { min: 1, max: 2, optimal: 2 },
    semanticTraps: { min: 0, max: 1, optimal: 0 },
    difficulty: 'easy'
  },
  // Intermediate: 36-50 skill
  2: {
    difficultyScore: 2.0, // Medium
    lines: { min: 6, max: 9, optimal: 7 },
    distractors: { min: 2, max: 3, optimal: 2 },
    semanticTraps: { min: 0, max: 2, optimal: 1 },
    difficulty: 'medium'
  },
  // Advanced: 51-70 skill
  3: {
    difficultyScore: 2.5, // Medium-Hard
    lines: { min: 8, max: 12, optimal: 10 },
    distractors: { min: 2, max: 4, optimal: 3 },
    semanticTraps: { min: 1, max: 3, optimal: 2 },
    difficulty: 'medium'
  },
  // Expert: 71-85 skill
  4: {
    difficultyScore: 3.0, // Hard
    lines: { min: 10, max: 15, optimal: 12 },
    distractors: { min: 3, max: 5, optimal: 4 },
    semanticTraps: { min: 2, max: 4, optimal: 3 },
    difficulty: 'hard'
  },
  // Master: 86-100 skill
  5: {
    difficultyScore: 3.5, // Very Hard
    lines: { min: 12, max: 20, optimal: 15 },
    distractors: { min: 4, max: 6, optimal: 5 },
    semanticTraps: { min: 3, max: 5, optimal: 4 },
    difficulty: 'hard'
  }
};

// Guardrails configuration
const GUARDRAILS = {
  MAX_JUMP_PER_ATTEMPT: 1, // Maximum skill band jump allowed per attempt
  MIN_LINES: 4, // Absolute minimum lines in a puzzle
  MAX_LINES: 20, // Absolute maximum lines in a puzzle
  MIN_DISTRACTORS: 1, // Absolute minimum distractors
  MAX_DISTRACTORS: 6, // Absolute maximum distractors
  MIN_SEMANTIC_TRAPS: 0, // Absolute minimum semantic traps
  MAX_SEMANTIC_TRAPS: 5, // Absolute maximum semantic traps
  SMOOTHING_WINDOW_SIZE: 5 // Number of recent skill updates for moving average
};

/**
 * Get skill band index from skill level (0-100)
 * @param {number} skill - Skill level (0-100)
 * @returns {number} Skill band index (0-5)
 */
function getSkillBand(skill) {
  if (skill <= 20) return 0; // 0-20
  if (skill <= 35) return 1; // 21-35
  if (skill <= 50) return 2; // 36-50
  if (skill <= 70) return 3; // 51-70
  if (skill <= 85) return 4; // 71-85
  return 5; // 86-100
}

/**
 * Calculate moving average of skill updates
 * @param {number[]} recentSkills - Array of recent skill values
 * @returns {number} Smoothed skill level
 */
function calculateMovingAverage(recentSkills) {
  if (!recentSkills || recentSkills.length === 0) {
    return 0;
  }

  // Use window size or available data
  const windowSize = Math.min(GUARDRAILS.SMOOTHING_WINDOW_SIZE, recentSkills.length);
  const window = recentSkills.slice(-windowSize); // Get last N values

  const sum = window.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
  return Math.round((sum / window.length) * 100) / 100; // Round to 2 decimals
}

/**
 * Apply guardrails to difficulty parameters
 * @param {Object} params - Difficulty parameters to validate
 * @param {number} previousBand - Previous skill band index
 * @param {number} currentBand - Current skill band index
 * @returns {Object} Guarded difficulty parameters
 */
function applyGuardrails(params, previousBand, currentBand) {
  const result = { ...params };

  // Guardrail: Maximum jump per attempt
  const bandJump = Math.abs(currentBand - previousBand);
  if (bandJump > GUARDRAILS.MAX_JUMP_PER_ATTEMPT) {
    // Limit the jump
    const maxAllowedJump = GUARDRAILS.MAX_JUMP_PER_ATTEMPT;
    const direction = currentBand > previousBand ? 1 : -1;
    const limitedBand = previousBand + (direction * maxAllowedJump);
    
    // Clamp to valid band range
    const clampedBand = Math.max(0, Math.min(5, limitedBand));
    const limitedParams = SKILL_BAND_MAPPING[clampedBand];
    
    result.difficultyScore = limitedParams.difficultyScore;
    result.lines = limitedParams.lines;
    result.distractors = limitedParams.distractors;
    result.semanticTraps = limitedParams.semanticTraps;
    result.difficulty = limitedParams.difficulty;
    result.bandLimited = true; // Flag to indicate guardrail was applied
  }

  // Guardrail: Minimum/Maximum lines
  if (result.lines.optimal < GUARDRAILS.MIN_LINES) {
    result.lines.optimal = GUARDRAILS.MIN_LINES;
    result.lines.min = GUARDRAILS.MIN_LINES;
  }
  if (result.lines.optimal > GUARDRAILS.MAX_LINES) {
    result.lines.optimal = GUARDRAILS.MAX_LINES;
    result.lines.max = GUARDRAILS.MAX_LINES;
  }

  // Guardrail: Minimum/Maximum distractors
  if (result.distractors.optimal < GUARDRAILS.MIN_DISTRACTORS) {
    result.distractors.optimal = GUARDRAILS.MIN_DISTRACTORS;
    result.distractors.min = GUARDRAILS.MIN_DISTRACTORS;
  }
  if (result.distractors.optimal > GUARDRAILS.MAX_DISTRACTORS) {
    result.distractors.optimal = GUARDRAILS.MAX_DISTRACTORS;
    result.distractors.max = GUARDRAILS.MAX_DISTRACTORS;
  }

  // Guardrail: Minimum/Maximum semantic traps
  if (result.semanticTraps.optimal < GUARDRAILS.MIN_SEMANTIC_TRAPS) {
    result.semanticTraps.optimal = GUARDRAILS.MIN_SEMANTIC_TRAPS;
    result.semanticTraps.min = GUARDRAILS.MIN_SEMANTIC_TRAPS;
  }
  if (result.semanticTraps.optimal > GUARDRAILS.MAX_SEMANTIC_TRAPS) {
    result.semanticTraps.optimal = GUARDRAILS.MAX_SEMANTIC_TRAPS;
    result.semanticTraps.max = GUARDRAILS.MAX_SEMANTIC_TRAPS;
  }

  return result;
}

/**
 * Map skill level to difficulty parameters
 * 
 * @param {number|Object} skill - Skill level (0-100) or options object
 * @param {number} skill.currentSkill - Current skill level (0-100)
 * @param {number[]} skill.recentSkills - Array of recent skill updates for smoothing (optional)
 * @param {number} skill.previousBand - Previous skill band index (optional, for guardrails)
 * @returns {Object} Difficulty parameters:
 *   - difficultyScore: Numeric difficulty score (1.0-3.5)
 *   - lines: {min, max, optimal} - Number of code lines
 *   - distractors: {min, max, optimal} - Number of distractors
 *   - semanticTraps: {min, max, optimal} - Number of semantic traps
 *   - difficulty: String difficulty level ('easy', 'medium', 'hard')
 *   - band: Skill band index (0-5)
 *   - smoothedSkill: Smoothed skill level if smoothing was applied
 */
export function mapSkillToDifficulty(skill) {
  // Handle both number and object inputs
  let currentSkill, recentSkills, previousBand;

  if (typeof skill === 'number') {
    currentSkill = skill;
    recentSkills = [];
    previousBand = getSkillBand(skill);
  } else if (typeof skill === 'object') {
    currentSkill = skill.currentSkill || skill.skill || 0;
    recentSkills = skill.recentSkills || [];
    previousBand = skill.previousBand !== undefined 
      ? skill.previousBand 
      : (recentSkills.length > 0 
          ? getSkillBand(recentSkills[recentSkills.length - 1] || currentSkill)
          : getSkillBand(currentSkill));
  } else {
    throw new Error('Invalid skill parameter. Expected number or object.');
  }

  // Clamp skill to valid range
  currentSkill = Math.max(0, Math.min(100, currentSkill));

  // Apply smoothing if recent skills are provided
  let smoothedSkill = currentSkill;
  if (recentSkills && recentSkills.length > 0) {
    const skillsForSmoothing = [...recentSkills, currentSkill];
    smoothedSkill = calculateMovingAverage(skillsForSmoothing);
  }

  // Get skill band from smoothed skill
  const currentBand = getSkillBand(smoothedSkill);
  const bandParams = SKILL_BAND_MAPPING[currentBand];

  // Create result with band parameters
  const result = {
    difficultyScore: bandParams.difficultyScore,
    lines: { ...bandParams.lines },
    distractors: { ...bandParams.distractors },
    semanticTraps: { ...bandParams.semanticTraps },
    difficulty: bandParams.difficulty,
    band: currentBand,
    skill: currentSkill,
    smoothedSkill: smoothedSkill !== currentSkill ? smoothedSkill : undefined
  };

  // Apply guardrails
  const guardedResult = applyGuardrails(result, previousBand, currentBand);

  return guardedResult;
}

/**
 * Get difficulty parameters for a specific skill band
 * @param {number} bandIndex - Skill band index (0-5)
 * @returns {Object} Difficulty parameters for the band
 */
export function getBandParameters(bandIndex) {
  if (bandIndex < 0 || bandIndex > 5) {
    throw new Error(`Invalid band index: ${bandIndex}. Must be between 0 and 5.`);
  }
  return { ...SKILL_BAND_MAPPING[bandIndex], band: bandIndex };
}

/**
 * Get all skill bands mapping table
 * @returns {Object} Complete mapping table
 */
export function getSkillBandMapping() {
  return JSON.parse(JSON.stringify(SKILL_BAND_MAPPING)); // Deep copy
}

/**
 * Get guardrails configuration
 * @returns {Object} Guardrails configuration
 */
export function getGuardrails() {
  return { ...GUARDRAILS };
}

/**
 * Calculate next difficulty after an attempt
 * @param {Object} params - Attempt parameters
 * @param {number} params.currentSkill - Current skill level
 * @param {number[]} params.recentSkills - Recent skill updates
 * @param {boolean} params.isCorrect - Whether attempt was correct
 * @param {number} params.previousBand - Previous skill band
 * @returns {Object} Recommended difficulty parameters
 */
export function getNextDifficulty(params) {
  const { currentSkill, recentSkills = [], isCorrect, previousBand } = params;

  // Adjust skill prediction based on correctness
  let predictedSkill = currentSkill;
  if (isCorrect) {
    // If correct, skill might increase slightly
    predictedSkill = Math.min(100, currentSkill + 2);
  } else {
    // If incorrect, skill might decrease slightly
    predictedSkill = Math.max(0, currentSkill - 1);
  }

  return mapSkillToDifficulty({
    currentSkill: predictedSkill,
    recentSkills,
    previousBand
  });
}

// Export internal functions for testing
export { getSkillBand, calculateMovingAverage, applyGuardrails };

