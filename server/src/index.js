import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool, redis } from './db.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', async (req,res) => {
  try {
    const pg = await pool.query('select 1')
    const pong = await redis.ping()
    res.json({ ok: true, pg: pg.rows[0]['?column?'] === 1, redis: pong === 'PONG' })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

app.post('/api/llm', async (req,res) => {
  const { url, body, headers } = req.body || {}
  if (!url) {
    res.status(400).json({ error: 'url required' })
    return
  }
  try {
    const r = await fetch(url, { method: 'POST', headers: headers || { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const data = await r.json().catch(async () => ({ text: await r.text() }))
    res.status(r.status).json(data)
  } catch (e) {
    res.status(500).json({ error: 'fetch_failed' })
  }
})

const port = process.env.PORT || 3001
app.listen(port, () => {})
