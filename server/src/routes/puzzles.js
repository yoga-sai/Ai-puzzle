import express from 'express';
import { Puzzle } from '../models/Puzzle.js';
import { Solution } from '../models/Solution.js';
import { Progress } from '../models/Progress.js';
import { generateAdaptivePuzzle } from '../services/llmAdapter.js';
import { Event } from '../models/Event.js';
import { sanitizePuzzleData } from '../services/sanitization.js';
import { validateGeneratePayload } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/puzzles
 * Get all puzzles with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { difficulty, category, userId } = req.query;
    
    const puzzles = await Puzzle.findAll({ 
      difficulty, 
      category,
      userId 
    });

    res.json({
      puzzles,
      count: puzzles.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/puzzles/:id
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

    res.json({ puzzle });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/puzzles
 * Create a new puzzle
 */
router.post('/', async (req, res, next) => {
  try {
    const { title, description, difficulty, category, segments, correct_order, created_by } = req.body;

    // Validation
    if (!title || !description || !difficulty || !category || !segments || !correct_order) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, difficulty, category, segments, correct_order' 
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ 
        error: 'Difficulty must be one of: easy, medium, hard' 
      });
    }

    const puzzle = await Puzzle.create({
      title,
      description,
      difficulty,
      category,
      segments,
      correct_order,
      created_by: created_by || req.headers['x-user-id']
    });

    res.status(201).json({
      message: 'Puzzle created successfully',
      puzzle
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/puzzles/:id/submit
 * Submit a solution for a puzzle
 */
router.post('/:id/submit', async (req, res, next) => {
  try {
    const { id: puzzleId } = req.params;
    const { solution_order, time_taken } = req.body;
    const userId = req.headers['x-user-id'] || req.body.user_id;

    if (!solution_order || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: solution_order, user_id' 
      });
    }

    // Get puzzle
    const puzzle = await Puzzle.findById(puzzleId);
    if (!puzzle) {
      return res.status(404).json({ 
        error: 'Puzzle not found' 
      });
    }

    // Check if solution is correct
    const isCorrect = JSON.stringify(solution_order) === JSON.stringify(puzzle.correct_order);
    const score = isCorrect ? 100 : 0;
    const feedback = isCorrect 
      ? 'Great job! Your solution is correct.' 
      : 'Not quite right. Keep trying!';

    // Save solution
    const solution = await Solution.create({
      user_id: userId,
      puzzle_id: puzzleId,
      solution_order,
      is_correct: isCorrect,
      score,
      time_taken: time_taken || 0,
      feedback
    });

    // Update progress
    await Progress.upsert({
      user_id: userId,
      puzzle_id: puzzleId,
      status: isCorrect ? 'completed' : 'in_progress',
      attempts: 1, // TODO: Increment existing attempts
      best_score: score,
      best_time: time_taken || 0
    });

    res.json({
      correct: isCorrect,
      feedback,
      score,
      solution_id: solution.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/puzzles/generate
 * Generate an adaptive puzzle using LLM
 */
router.post('/generate', validateGeneratePayload, async (req, res, next) => {
  try {
    const { topic, difficulty, userId } = req.body;

    if (!topic) {
      return res.status(400).json({ 
        error: 'Topic is required' 
      });
    }

    // Generate puzzle using LLM adapter
  const generatedPuzzle = await generateAdaptivePuzzle({
      topic,
      difficulty: difficulty || 'medium',
      userId
    });

    const safe = sanitizePuzzleData(generatedPuzzle)

    // Save generated puzzle
  const puzzle = await Puzzle.create({
      ...safe,
      created_by: userId || req.headers['x-user-id']
    });

    await Event.create({
      user_id: userId || req.headers['x-user-id'] || null,
      puzzle_id: puzzle.id,
      event_type: 'puzzle_generated',
      metadata: { topic, difficulty: difficulty || 'medium' }
    })

    res.status(201).json({
      message: 'Puzzle generated successfully',
      puzzle
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/puzzles/:id
 * Update a puzzle
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const puzzle = await Puzzle.update(id, updates);

    if (!puzzle) {
      return res.status(404).json({ 
        error: 'Puzzle not found' 
      });
    }

    res.json({
      message: 'Puzzle updated successfully',
      puzzle
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/puzzles/:id
 * Delete a puzzle
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Puzzle.delete(id);

    if (!deleted) {
      return res.status(404).json({ 
        error: 'Puzzle not found' 
      });
    }

    res.json({
      message: 'Puzzle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

