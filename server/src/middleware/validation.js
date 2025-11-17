function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0
}

export function validateGeneratePayload(req, res, next) {
  const { topic, difficulty } = req.body || {}
  if (!isNonEmptyString(topic)) return res.status(400).json({ error: 'Topic is required' })
  if (difficulty && !['easy', 'medium', 'hard'].includes(String(difficulty))) {
    return res.status(400).json({ error: 'Difficulty must be one of: easy, medium, hard' })
  }
  next()
}

export function validateAttemptStartPayload(req, res, next) {
  const userId = req.headers['x-user-id'] || req.body?.user_id
  if (!isNonEmptyString(String(userId || ''))) return res.status(400).json({ error: 'Missing user_id' })
  next()
}

export function validateSubmitPayload(req, res, next) {
  const { solution_order, start_time, end_time, attempts_count } = req.body || {}
  if (!Array.isArray(solution_order)) return res.status(400).json({ error: 'solution_order must be an array' })
  if (!isNonEmptyString(String(start_time || ''))) return res.status(400).json({ error: 'Missing start_time' })
  if (end_time && !isNonEmptyString(String(end_time))) return res.status(400).json({ error: 'Invalid end_time' })
  if (attempts_count && typeof attempts_count !== 'number') return res.status(400).json({ error: 'attempts_count must be a number' })
  next()
}

