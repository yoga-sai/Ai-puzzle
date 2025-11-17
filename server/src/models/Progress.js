import crypto from 'crypto';
import { getDb } from './db.js';

/**
 * Progress model for tracking user puzzle progress
 */
export class Progress {
  /**
   * Find all progress records with optional filters
   */
  static async findAll({ userId, puzzleId } = {}) {
    const db = await getDb();
    let query = 'SELECT * FROM progress WHERE 1=1';
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

    query += ' ORDER BY updated_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Find progress by user and puzzle
   */
  static async findByUserAndPuzzle(userId, puzzleId) {
    const db = await getDb();
    const result = await db.query(
      'SELECT * FROM progress WHERE user_id = $1 AND puzzle_id = $2',
      [userId, puzzleId]
    );
    return result.rows[0] || null;
  }

  /**
   * Upsert progress (create or update)
   */
  static async upsert({ user_id, puzzle_id, status, attempts, best_score, best_time }) {
    const db = await getDb();
    
    // Check if progress exists
    const existing = await this.findByUserAndPuzzle(user_id, puzzle_id);

    if (existing) {
      // Update existing progress
      const updates = [];
      const params = [user_id, puzzle_id];
      let paramIndex = 3;

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (attempts !== undefined) {
        updates.push(`attempts = attempts + 1`);
      }

      if (best_score !== undefined) {
        updates.push(`best_score = GREATEST(best_score, $${paramIndex})`);
        params.push(best_score);
        paramIndex++;
      }

      if (best_time !== undefined) {
        updates.push(`best_time = CASE 
          WHEN best_time = 0 OR best_time > $${paramIndex} THEN $${paramIndex}
          ELSE best_time
        END`);
        params.push(best_time);
        paramIndex++;
        params.push(best_time); // Used twice in CASE
      }

      updates.push('last_attempt = CURRENT_TIMESTAMP');
      updates.push('updated_at = CURRENT_TIMESTAMP');

      const result = await db.query(
        `UPDATE progress 
         SET ${updates.join(', ')}
         WHERE user_id = $1 AND puzzle_id = $2
         RETURNING *`,
        params
      );

      return result.rows[0];
    } else {
      // Create new progress
      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();

      const result = await db.query(
        `INSERT INTO progress (id, user_id, puzzle_id, status, attempts, best_score, best_time, last_attempt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          id,
          user_id,
          puzzle_id,
          status || 'in_progress',
          attempts || 1,
          best_score || 0,
          best_time || 0,
          created_at
        ]
      );

      return result.rows[0];
    }
  }

  /**
   * Update progress status
   */
  static async updateStatus(userId, puzzleId, status) {
    const db = await getDb();
    const result = await db.query(
      `UPDATE progress 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND puzzle_id = $3
       RETURNING *`,
      [status, userId, puzzleId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId) {
    const db = await getDb();
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_puzzles,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_puzzles,
        AVG(best_score) as average_score,
        SUM(attempts) as total_attempts
       FROM progress
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || {
      total_puzzles: 0,
      completed_puzzles: 0,
      average_score: 0,
      total_attempts: 0
    };
  }
}

