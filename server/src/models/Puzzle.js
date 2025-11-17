import crypto from 'crypto';
import { getDb } from './db.js';

/**
 * Puzzle model for Parsons puzzle management
 */
export class Puzzle {
  /**
   * Find all puzzles with optional filters
   */
  static async findAll({ difficulty, category, userId } = {}) {
    const db = await getDb();
    let query = 'SELECT * FROM puzzles WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (userId) {
      query += ` AND created_by = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map(this._formatPuzzle);
  }

  /**
   * Find puzzle by ID
   */
  static async findById(id) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM puzzles WHERE id = $1', [id]);
    return result.rows[0] ? this._formatPuzzle(result.rows[0]) : null;
  }

  /**
   * Create a new puzzle
   */
  static async create({ title, description, difficulty, category, segments, correct_order, created_by }) {
    const db = await getDb();
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // PostgreSQL JSONB accepts objects directly, pg driver handles conversion
    const segmentsData = typeof segments === 'string' ? JSON.parse(segments) : segments;
    const correctOrderData = typeof correct_order === 'string' 
      ? JSON.parse(correct_order) 
      : correct_order;

    const result = await db.query(
      `INSERT INTO puzzles (id, title, description, difficulty, category, segments, correct_order, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, title, description, difficulty, category, segmentsData, correctOrderData, created_by, created_at]
    );

    return this._formatPuzzle(result.rows[0]);
  }

  /**
   * Update puzzle
   */
  static async update(id, updates) {
    const db = await getDb();
    const allowedFields = ['title', 'description', 'difficulty', 'category', 'segments', 'correct_order'];
    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((f, i) => {
      const paramIndex = i + 2;
      return `${f} = $${paramIndex}`;
    }).join(', ');

    const values = [id, ...fields.map(f => {
      // PostgreSQL JSONB accepts objects directly
      if (f === 'segments' || f === 'correct_order') {
        return typeof updates[f] === 'string' ? JSON.parse(updates[f]) : updates[f];
      }
      return updates[f];
    })];

    const result = await db.query(
      `UPDATE puzzles SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0] ? this._formatPuzzle(result.rows[0]) : null;
  }

  /**
   * Delete puzzle
   */
  static async delete(id) {
    const db = await getDb();
    const result = await db.query('DELETE FROM puzzles WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] ? this._formatPuzzle(result.rows[0]) : null;
  }

  /**
   * Format puzzle data (JSONB fields are already parsed by pg driver)
   */
  static _formatPuzzle(row) {
    return {
      ...row,
      segments: row.segments, // Already an object from JSONB
      correct_order: row.correct_order // Already an array from JSONB
    };
  }
}

