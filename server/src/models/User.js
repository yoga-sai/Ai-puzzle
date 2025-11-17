import crypto from 'crypto';
import { getDb } from './db.js';

/**
 * User model for authentication and user management
 */
export class User {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const db = await getDb();
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  static async create({ email, password, name, role }) {
    const db = await getDb();
    const id = crypto.randomUUID();
    const password_hash = await this.hashPassword(password);
    const created_at = new Date().toISOString();

    const result = await db.query(
      `INSERT INTO users (id, email, password_hash, name, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, email, password_hash, name, role, created_at]
    );

    return result.rows[0];
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const db = await getDb();
    const allowedFields = ['name', 'email', 'role', 'skill_level'];
    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [id, ...fields.map(f => updates[f])];

    const result = await db.query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Update user skill level
   */
  static async updateSkill(id, skillLevel) {
    const db = await getDb();
    const result = await db.query(
      `UPDATE users SET skill_level = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [Math.max(0, Math.min(100, skillLevel)), id]
    );

    return result.rows[0] || null;
  }

  /**
   * Hash password using bcrypt-like approach (simple hash for development)
   * In production, use bcrypt library
   */
  static async hashPassword(password) {
    // Simple hash for development - use bcrypt in production
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, hash) {
    const hashed = await this.hashPassword(password);
    return hashed === hash;
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const db = await getDb();
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

