import crypto from 'crypto';
import { getDb } from './db.js';

/**
 * Attempt model for puzzle attempt tracking
 */
export class Attempt {
  /**
   * Find all attempts with optional filters
   */
  static async findAll({ userId, puzzleId, sessionId } = {}) {
    const db = await getDb();
    let query = 'SELECT * FROM attempts WHERE 1=1';
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

    if (sessionId) {
      query += ` AND session_id = $${paramIndex}`;
      params.push(sessionId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map(this._formatAttempt);
  }

  /**
   * Find attempt by ID
   */
  static async findById(id) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM attempts WHERE id = $1', [id]);
    return result.rows[0] ? this._formatAttempt(result.rows[0]) : null;
  }

  /**
   * Get latest attempt for user and puzzle
   */
  static async findLatestForUser(userId, puzzleId) {
    const db = await getDb();
    const result = await db.query(
      `SELECT * FROM attempts 
       WHERE user_id = $1 AND puzzle_id = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, puzzleId]
    );
    return result.rows[0] ? this._formatAttempt(result.rows[0]) : null;
  }

  /**
   * Count attempts for user and puzzle
   */
  static async countAttempts(userId, puzzleId) {
    const db = await getDb();
    const result = await db.query(
      'SELECT COUNT(*) as count FROM attempts WHERE user_id = $1 AND puzzle_id = $2',
      [userId, puzzleId]
    );
    return parseInt(result.rows[0]?.count || 0, 10);
  }

  /**
   * Create a new attempt
   */
  static async create({
    user_id,
    puzzle_id,
    session_id,
    start_time,
    end_time,
    steps_log,
    attempts_count,
    is_correct,
    score,
    skill_before,
    skill_after,
    hints_used = 0
  }) {
    const db = await getDb();
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // Ensure steps_log is JSONB
    const stepsLogData = typeof steps_log === 'string' 
      ? JSON.parse(steps_log) 
      : (Array.isArray(steps_log) ? steps_log : []);

    // Calculate time_spent_seconds
    let timeSpentSeconds = null;
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      timeSpentSeconds = Math.floor((end - start) / 1000);
    }

    const result = await db.query(
      `INSERT INTO attempts (
        id, user_id, puzzle_id, session_id, start_time, end_time, 
        steps_log, attempts_count, is_correct, score, 
        skill_before, skill_after, time_spent_seconds, hints_used, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id,
        user_id,
        puzzle_id,
        session_id || null,
        start_time,
        end_time || null,
        stepsLogData,
        attempts_count || 1,
        is_correct || false,
        score || 0,
        skill_before !== undefined ? skill_before : null,
        skill_after !== undefined ? skill_after : null,
        timeSpentSeconds,
        hints_used,
        created_at
      ]
    );

    return this._formatAttempt(result.rows[0]);
  }

  /**
   * Format attempt data (JSONB fields are already parsed by pg driver)
   */
  static _formatAttempt(row) {
    return {
      ...row,
      steps_log: row.steps_log || [],
      is_correct: Boolean(row.is_correct),
      skill_before: row.skill_before !== null ? parseFloat(row.skill_before) : null,
      skill_after: row.skill_after !== null ? parseFloat(row.skill_after) : null
    };
  }
}

