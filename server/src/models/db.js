import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;

/**
 * Get database connection pool
 */
export async function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'adaptive_parsons'}`;

    pool = new Pool({
      connectionString,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  return pool;
}

/**
 * Initialize database schema
 */
export async function initDb() {
  const db = await getDb();
  
  // Create users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create puzzles table
  await db.query(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
      category VARCHAR(255) NOT NULL,
      segments JSONB NOT NULL,
      correct_order JSONB NOT NULL,
      created_by VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Create solutions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS solutions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      puzzle_id VARCHAR(36),
      solution_order JSONB NOT NULL,
      is_correct BOOLEAN NOT NULL,
      score INTEGER CHECK (score >= 0 AND score <= 100),
      time_taken INTEGER NOT NULL,
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
    )
  `);

  // Create progress table
  await db.query(`
    CREATE TABLE IF NOT EXISTS progress (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      puzzle_id VARCHAR(36),
      status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
      attempts INTEGER DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      best_time INTEGER DEFAULT 0,
      last_attempt TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, puzzle_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      puzzle_id VARCHAR(36),
      session_id VARCHAR(36),
      event_type VARCHAR(100) NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(puzzle_id) REFERENCES puzzles(id) ON DELETE SET NULL
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id)`);

  console.log('Database schema initialized');
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

