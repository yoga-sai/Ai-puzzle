import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import puzzleRoutes from './routes/puzzles.js';
import v1PuzzleRoutes from './routes/v1/puzzles.js';
import { getDb } from './models/db.js';
import { rateLimit } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json()); // bodyParser for JSON
app.use(express.urlencoded({ extended: true })); // bodyParser for URL-encoded
app.disable('x-powered-by');
app.use(rateLimit());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/v1/puzzle', v1PuzzleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Adaptive Parsons API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', async (req, res, next) => {
  try {
    const db = await getDb()
    const weeklyActiveResult = await db.query(
      `SELECT COUNT(DISTINCT user_id) AS count
       FROM attempts
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    )
    const avgSkillGainResult = await db.query(
      `SELECT AVG(skill_after - skill_before) AS avg_gain
       FROM attempts
       WHERE created_at >= NOW() - INTERVAL '7 days'
         AND skill_before IS NOT NULL
         AND skill_after IS NOT NULL`
    )
    res.json({
      weekly_active_learners: parseInt(weeklyActiveResult.rows[0]?.count || 0, 10),
      average_skill_gain_7d: parseFloat(avgSkillGainResult.rows[0]?.avg_gain || 0)
    })
  } catch (err) {
    next(err)
  }
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Adaptive Parsons API',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

