import { db } from "./connection.js"

export async function ensureSchema() {
  await db.exec(`PRAGMA foreign_keys = ON;`)
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student','instructor')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );`)
  await db.exec(`CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
    category TEXT NOT NULL,
    segments TEXT NOT NULL,
    correct_order TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(created_by) REFERENCES users(id)
  );`)
  await db.exec(`CREATE TABLE IF NOT EXISTS solutions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    puzzle_id TEXT,
    solution_order TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    time_taken INTEGER NOT NULL,
    feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(puzzle_id) REFERENCES puzzles(id)
  );`)
  await db.exec(`CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    puzzle_id TEXT,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
    attempts INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    best_time INTEGER DEFAULT 0,
    last_attempt TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, puzzle_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(puzzle_id) REFERENCES puzzles(id)
  );`)
  // Seed a sample puzzle for demo if none exists
  const existing = await db.get("SELECT id FROM puzzles LIMIT 1")
  if (!existing) {
    const sampleId = '1'
    const segments = JSON.stringify([
      "function greet(name) {",
      "  console.log('Hello, ' + name + '!');",
      "}",
      "greet('World');"
    ])
    const correct_order = JSON.stringify([0,1,2,3])
    await db.run(`INSERT INTO puzzles(id, title, description, difficulty, category, segments, correct_order, created_by) VALUES(?,?,?,?,?,?,?,?)`, [sampleId, 'JavaScript Function Basics', 'Arrange the lines to create a working JavaScript function', 'easy', 'javascript', segments, correct_order, null])
  }
}