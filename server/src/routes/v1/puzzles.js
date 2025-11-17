import express from 'express';
import { Puzzle } from '../../models/Puzzle.js';
import { Attempt } from '../../models/Attempt.js';
import { User } from '../../models/User.js';
import { updateSkill, recommendNextDifficulty } from '../../services/learnerModel.js';
import { Event } from '../../models/Event.js';
import { validateAttemptStartPayload, validateSubmitPayload } from '../../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/v1/puzzle/:id
 * Get a specific puzzle by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const puzzle = await Puzzle.findById(id);

    if (!puzzle) {
      return res.status(404).json({ 
        error: 'Puzzle not found' 
      });
    }

    // Transform to expected format
    res.json({
      puzzle: {
        id: puzzle.id,
        title: puzzle.title,
        description: puzzle.description,
        difficulty: puzzle.difficulty,
        category: puzzle.category,
        language: puzzle.language || 'python',
        segments: puzzle.segments,
        lines: puzzle.segments, // Alias for frontend compatibility
        correct_order: puzzle.correct_order,
        distractors: puzzle.distractors || []
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/start', validateAttemptStartPayload, async (req, res, next) => {
  try {
    const { id: puzzleId } = req.params
    const userId = req.headers['x-user-id'] || req.body.user_id
    const sessionId = req.headers['x-session-id'] || req.body.session_id || null
    const startedAt = req.body.start_time || new Date().toISOString()

    if (!userId) {
      return res.status(400).json({ error: 'Missing user_id' })
    }

    await Event.create({
      user_id: userId,
      puzzle_id: puzzleId,
      session_id: sessionId,
      event_type: 'puzzle_attempt_started',
      metadata: { start_time: startedAt }
    })

    res.status(201).json({ status: 'ok' })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/puzzle/:id/submit
 * Submit a solution for a puzzle
 */
router.post('/:id/submit', validateSubmitPayload, async (req, res, next) => {
  try {
    const { id: puzzleId } = req.params;
    const { 
      solution_order, 
      steps_log, 
      start_time, 
      end_time, 
      attempts_count: submittedAttemptsCount,
      hints_used = 0
    } = req.body;
    
    // Get user_id from header or body (in production, use JWT)
    const userId = req.headers['x-user-id'] || req.body.user_id;
    const sessionId = req.headers['x-session-id'] || req.body.session_id || null;

    // Validate payload
    if (!solution_order || !Array.isArray(solution_order)) {
      return res.status(400).json({ 
        error: 'Missing or invalid solution_order (must be an array)' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing user_id (provide in header x-user-id or body)' 
      });
    }

    if (!start_time) {
      return res.status(400).json({ 
        error: 'Missing start_time' 
      });
    }

    // Load puzzle
    const puzzle = await Puzzle.findById(puzzleId);
    if (!puzzle) {
      return res.status(404).json({ 
        error: 'Puzzle not found' 
      });
    }

    // Load user to get current skill
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Compute correctness by comparing submitted order with stored solution
    const isCorrect = JSON.stringify(solution_order) === JSON.stringify(puzzle.correct_order);
    
    // Compute score (0-100)
    let score = 0;
    if (isCorrect) {
      score = 100;
      // Optional: reduce score based on attempts or time
      // For now, binary scoring
    } else {
      // Partial credit could be implemented here
      score = 0;
    }

    // Compute attempts_count
    let attemptsCount = submittedAttemptsCount || 1;
    if (!submittedAttemptsCount) {
      // Count existing attempts for this user+puzzle
      const existingCount = await Attempt.countAttempts(userId, puzzleId);
      attemptsCount = existingCount + 1;
    }

    // Compute timeTaken
    let timeTaken = null;
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      timeTaken = Math.floor((end - start) / 1000); // seconds
    } else if (start_time) {
      // Use current time if end_time not provided
      const start = new Date(start_time);
      const now = new Date();
      timeTaken = Math.floor((now - start) / 1000);
    }

    // Get current skill level
    const skillBefore = parseFloat(user.skill_level || 0);

    // Update skill using learner model
    const skillAfter = updateSkill({
      currentSkill: skillBefore,
      puzzleDifficulty: puzzle.difficulty,
      isCorrect,
      timeSpent: timeTaken,
      attemptsCount,
      maxTime: null // Could be puzzle-specific expected time
    });

    // Update user's skill in DB
    await User.update(userId, { skill_level: skillAfter });
    await Event.create({
      user_id: userId,
      puzzle_id: puzzleId,
      session_id: sessionId,
      event_type: 'skill_updated',
      metadata: { before: skillBefore, after: skillAfter }
    })

    // Insert attempt record
    const attempt = await Attempt.create({
      user_id: userId,
      puzzle_id: puzzleId,
      session_id: sessionId,
      start_time: start_time,
      end_time: end_time || new Date().toISOString(),
      steps_log: steps_log || [],
      attempts_count: attemptsCount,
      is_correct: isCorrect,
      score,
      skill_before: skillBefore,
      skill_after: skillAfter,
      hints_used
    });

    await Event.create({
      user_id: userId,
      puzzle_id: puzzleId,
      session_id: sessionId,
      event_type: 'puzzle_attempt_submitted',
      metadata: { attempts_count: attemptsCount, is_correct: isCorrect, score, time_taken: timeTaken }
    })

    // Recommend next difficulty
    const recommendedDifficulty = recommendNextDifficulty({
      currentSkill: skillAfter,
      currentDifficulty: puzzle.difficulty,
      isCorrect,
      attemptsCount
    });

    // Prepare response
    const response = {
      correct: isCorrect,
      is_correct: isCorrect, // Alias for compatibility
      score,
      skill_before: skillBefore,
      skill_after: skillAfter,
      updated_skill: skillAfter, // Alias
      recommended_difficulty: recommendedDifficulty,
      attempts_count: attemptsCount,
      time_taken: timeTaken,
      attempt_id: attempt.id,
      feedback: isCorrect 
        ? 'Great job! Your solution is correct.' 
        : 'Not quite right. Keep trying!'
    };

    // If correct, suggest slightly harder; if incorrect, suggest same/easier
    if (isCorrect) {
      response.message = `Excellent! Your skill has improved. Try a ${recommendedDifficulty} puzzle next.`;
    } else {
      response.message = `Good effort! Try the same difficulty or an easier puzzle to build your skills.`;
    }

    res.json(response);
  } catch (error) {
    console.error('Error submitting puzzle:', error);
    next(error);
  }
});

export default router;

