/**
 * Learner Model Service
 * Handles adaptive skill tracking and difficulty recommendations
 */

const DIFFICULTY_LEVELS = {
  easy: 1,
  medium: 2,
  hard: 3
};

const DIFFICULTY_NAMES = {
  1: 'easy',
  2: 'medium',
  3: 'hard'
};

/**
 * Update user skill based on attempt result
 * Uses Elo-like rating system adapted for puzzle solving
 * 
 * @param {Object} params - Update parameters
 * @param {number} params.currentSkill - Current user skill level (0-100)
 * @param {number} params.puzzleDifficulty - Puzzle difficulty level (1-3)
 * @param {boolean} params.isCorrect - Whether the attempt was correct
 * @param {number} params.timeSpent - Time spent in seconds
 * @param {number} params.attemptsCount - Number of attempts for this puzzle
 * @param {number} params.maxTime - Expected maximum time for puzzle (optional)
 * @returns {number} Updated skill level (0-100)
 */
export function updateSkill({
  currentSkill,
  puzzleDifficulty,
  isCorrect,
  timeSpent,
  attemptsCount = 1,
  maxTime = null
}) {
  // Clamp current skill to valid range
  let skill = Math.max(0, Math.min(100, currentSkill || 0));
  
  // Convert difficulty to numeric level
  const difficultyLevel = typeof puzzleDifficulty === 'string' 
    ? DIFFICULTY_LEVELS[puzzleDifficulty] || 2
    : puzzleDifficulty;

  // Base skill change depends on correctness
  let skillChange = 0;

  if (isCorrect) {
    // Reward for correct solution
    const baseReward = 2.0;
    
    // Bonus for getting it right on first attempt
    const firstAttemptBonus = attemptsCount === 1 ? 1.5 : 1.0 - (attemptsCount - 1) * 0.2;
    
    // Time bonus (faster = better, if maxTime provided)
    let timeBonus = 1.0;
    if (maxTime && timeSpent) {
      const timeRatio = timeSpent / maxTime;
      // Bonus if completed faster than expected
      timeBonus = timeRatio < 1.0 ? 1.0 + (1.0 - timeRatio) * 0.5 : 1.0;
      timeBonus = Math.max(0.5, Math.min(1.5, timeBonus));
    }
    
    // Difficulty multiplier (harder puzzles give more skill increase)
    const difficultyMultiplier = difficultyLevel / 2.0; // 0.5 for easy, 1.0 for medium, 1.5 for hard
    
    // Adjust based on current skill vs puzzle difficulty
    // If puzzle is harder than current skill, reward more
    const skillLevel = Math.floor(skill / 33.33); // 0, 1, 2, or 3
    const challengeBonus = difficultyLevel > skillLevel ? 1.2 : 1.0;
    
    skillChange = baseReward * firstAttemptBonus * timeBonus * difficultyMultiplier * challengeBonus;
    
  } else {
    // Penalty for incorrect solution (smaller penalty)
    const basePenalty = -0.5;
    
    // Less penalty if puzzle is harder than skill level
    const skillLevel = Math.floor(skill / 33.33);
    const difficultyAdjustment = difficultyLevel > skillLevel ? 0.7 : 1.0;
    
    // More penalty for multiple failed attempts
    const attemptsPenalty = 1.0 + (attemptsCount - 1) * 0.3;
    
    skillChange = basePenalty * difficultyAdjustment * attemptsPenalty;
  }

  // Apply skill change
  skill += skillChange;

  // Clamp to valid range
  skill = Math.max(0, Math.min(100, skill));

  return Math.round(skill * 100) / 100; // Round to 2 decimal places
}

/**
 * Recommend next puzzle difficulty based on user skill and attempt result
 * 
 * @param {Object} params - Recommendation parameters
 * @param {number} params.currentSkill - Current user skill level (0-100)
 * @param {string} params.currentDifficulty - Current puzzle difficulty
 * @param {boolean} params.isCorrect - Whether the attempt was correct
 * @param {number} params.attemptsCount - Number of attempts taken
 * @returns {string} Recommended difficulty: 'easy', 'medium', or 'hard'
 */
export function recommendNextDifficulty({
  currentSkill,
  currentDifficulty,
  isCorrect,
  attemptsCount = 1
}) {
  // Get numeric levels
  const currentLevel = typeof currentDifficulty === 'string'
    ? DIFFICULTY_LEVELS[currentDifficulty] || 2
    : currentDifficulty;

  let recommendedLevel;

  if (isCorrect) {
    // User got it right - suggest slightly harder
    if (attemptsCount === 1) {
      // Perfect on first try - move up a level
      recommendedLevel = Math.min(3, currentLevel + 1);
    } else if (attemptsCount === 2) {
      // Got it on second try - stay at same level
      recommendedLevel = currentLevel;
    } else {
      // Multiple attempts - maybe slightly easier
      recommendedLevel = Math.max(1, currentLevel);
    }

    // Also consider skill level
    const skillLevel = Math.floor(currentSkill / 33.33); // 0-3
    if (skillLevel > recommendedLevel) {
      recommendedLevel = Math.min(3, recommendedLevel + 1);
    }
  } else {
    // User got it wrong - suggest same or easier
    if (attemptsCount === 1) {
      // First attempt wrong - stay at same level (might have been close)
      recommendedLevel = currentLevel;
    } else {
      // Multiple failed attempts - go easier
      recommendedLevel = Math.max(1, currentLevel - 1);
    }

    // If skill is low, cap at easy
    if (currentSkill < 33 && recommendedLevel > 1) {
      recommendedLevel = 1;
    }
  }

  return DIFFICULTY_NAMES[recommendedLevel] || 'medium';
}

/**
 * Get difficulty level from name
 */
export function getDifficultyLevel(difficulty) {
  return DIFFICULTY_LEVELS[difficulty] || 2;
}

/**
 * Get difficulty name from level
 */
export function getDifficultyName(level) {
  return DIFFICULTY_NAMES[level] || 'medium';
}

