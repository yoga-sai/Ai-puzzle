import crypto from 'crypto';
import { getDb } from './db.js';

/**
 * Solution model for puzzle solution tracking
 */
export class Solution {
  /**
   * Find all solutions with optional filters
   */
  static async findAll({ userId, puzzleId } = {}) {
    const db = await getDb();
    let query = 'SELECT * FROM solutions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (puzzleId) {
      query += ` AND puzzle_id = $${paramIndex}`;
      params.push(puzzleId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map(this._formatSolution);
  }

  /**
   * Find solution by ID
   */
  static async findById(id) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM solutions WHERE id = $1', [id]);
    return result.rows[0] ? this._formatSolution(result.rows[0]) : null;
  }

  /**
   * Create a new solution
   */
  static async create({ user_id, puzzle_id, solution_order, is_correct, score, time_taken, feedback }) {
    const db = await getDb();
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // PostgreSQL JSONB accepts objects directly
    const solutionOrderData = typeof solution_order === 'string' 
      ? JSON.parse(solution_order) 
      : solution_order;

    const result = await db.query(
      `INSERT INTO solutions (id, user_id, puzzle_id, solution_order, is_correct, score, time_taken, feedback, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, user_id, puzzle_id, solutionOrderData, is_correct, score || 0, time_taken || 0, feedback || null, created_at]
    );

    return this._formatSolution(result.rows[0]);
  }

  /**
   * Get user's best solution for a puzzle
   */
  static async findBestForUser(userId, puzzleId) {
    const db = await getDb();
    const result = await db.query(
      `SELECT * FROM solutions 
       WHERE user_id = $1 AND puzzle_id = $2 
       ORDER BY score DESC, time_taken ASC 
       LIMIT 1`,
      [userId, puzzleId]
    );
    return result.rows[0] ? this._formatSolution(result.rows[0]) : null;
  }

  /**
   * Format solution data (JSONB fields are already parsed by pg driver)
   */
  static _formatSolution(row) {
    return {
      ...row,
      solution_order: row.solution_order, // Already an array from JSONB
      feedback: row.feedback, // Already parsed if JSONB, or string if TEXT
      is_correct: Boolean(row.is_correct)
    };
  }
}

