-- PostgreSQL Schema for Adaptive Parsons
-- Database: adaptive_parsons

-- Drop existing tables if needed (in reverse dependency order)
-- DROP TABLE IF EXISTS logs CASCADE;
-- DROP TABLE IF EXISTS attempts CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS puzzles CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor')),
    skill_level DECIMAL(5,2) DEFAULT 0.0 CHECK (skill_level >= 0.0 AND skill_level <= 100.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_skill_level ON users(skill_level);

-- ============================================================================
-- PUZZLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS puzzles (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(255) NOT NULL,
    language VARCHAR(50) DEFAULT 'python',
    segments JSONB NOT NULL,
    correct_order JSONB NOT NULL,
    distractors JSONB DEFAULT '[]'::jsonb,
    estimated_difficulty DECIMAL(5,2),
    created_by VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for puzzles
CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty ON puzzles(difficulty);
CREATE INDEX IF NOT EXISTS idx_puzzles_category ON puzzles(category);
CREATE INDEX IF NOT EXISTS idx_puzzles_language ON puzzles(language);
CREATE INDEX IF NOT EXISTS idx_puzzles_created_by ON puzzles(created_by);
CREATE INDEX IF NOT EXISTS idx_puzzles_created_at ON puzzles(created_at DESC);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

-- ============================================================================
-- ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    puzzle_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    steps_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    attempts_count INTEGER NOT NULL DEFAULT 1 CHECK (attempts_count > 0),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    skill_before DECIMAL(5,2) CHECK (skill_before >= 0.0 AND skill_before <= 100.0),
    skill_after DECIMAL(5,2) CHECK (skill_after >= 0.0 AND skill_after <= 100.0),
    time_spent_seconds INTEGER,
    hints_used INTEGER DEFAULT 0 CHECK (hints_used >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Indexes for attempts (as requested)
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_puzzle_id ON attempts(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session_id ON attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_start_time ON attempts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_is_correct ON attempts(is_correct);
CREATE INDEX IF NOT EXISTS idx_attempts_user_puzzle ON attempts(user_id, puzzle_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at DESC);

-- ============================================================================
-- LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    session_id VARCHAR(36),
    attempt_id VARCHAR(36),
    puzzle_id VARCHAR(36),
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
    event_type VARCHAR(100) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY(attempt_id) REFERENCES attempts(id) ON DELETE SET NULL,
    FOREIGN KEY(puzzle_id) REFERENCES puzzles(id) ON DELETE SET NULL
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_session_id ON logs(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_attempt_id ON logs(attempt_id);
CREATE INDEX IF NOT EXISTS idx_logs_puzzle_id ON logs(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_logs_event_type ON logs(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_log_level ON logs(log_level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to puzzles table
DROP TRIGGER IF EXISTS update_puzzles_updated_at ON puzzles;
CREATE TRIGGER update_puzzles_updated_at
    BEFORE UPDATE ON puzzles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate time_spent_seconds in attempts
CREATE OR REPLACE FUNCTION calculate_time_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.time_spent_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply time calculation trigger to attempts table
DROP TRIGGER IF EXISTS calculate_attempts_time_spent ON attempts;
CREATE TRIGGER calculate_attempts_time_spent
    BEFORE INSERT OR UPDATE ON attempts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_time_spent();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts for students and instructors';
COMMENT ON TABLE puzzles IS 'Parsons puzzle definitions';
COMMENT ON TABLE sessions IS 'User session tracking';
COMMENT ON TABLE attempts IS 'Individual puzzle solving attempts with detailed tracking';
COMMENT ON TABLE logs IS 'Application event and error logging';

COMMENT ON COLUMN attempts.steps_log IS 'JSON array of move events: [{timestamp, action, from, to, item}, ...]';
COMMENT ON COLUMN attempts.skill_before IS 'User skill level before attempting puzzle (0-100)';
COMMENT ON COLUMN attempts.skill_after IS 'User skill level after attempting puzzle (0-100)';
COMMENT ON COLUMN attempts.attempts_count IS 'Number of attempts made for this puzzle by this user';
COMMENT ON COLUMN logs.metadata IS 'Additional structured data for the log event';

