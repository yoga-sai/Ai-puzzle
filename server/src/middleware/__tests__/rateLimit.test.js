import { describe, it, expect, beforeEach } from '@jest/globals'
import express from 'express'
import request from 'supertest'
import { rateLimit } from '../../middleware/rateLimit.js'

describe('rateLimit middleware', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use((req, res, next) => { req.headers['x-user-id'] = 'u-test'; next() })
    app.use(rateLimit())
    app.get('/ping', (req, res) => res.json({ ok: true }))
  })

  it('limits after threshold', async () => {
    for (let i = 0; i < 100; i++) {
      const r = await request(app).get('/ping')
      expect(r.status).toBe(200)
    }
    const over = await request(app).get('/ping')
    expect(over.status).toBe(429)
  })
})

