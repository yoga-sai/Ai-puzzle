import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'

jest.unstable_mockModule('../../../models/Puzzle.js', () => ({
  Puzzle: {
    findById: jest.fn().mockResolvedValue({
      id: 'p1',
      difficulty: 'medium',
      correct_order: [0, 1]
    })
  }
}))

jest.unstable_mockModule('../../../models/User.js', () => ({
  User: {
    findById: jest.fn().mockResolvedValue({ id: 'u1', skill_level: 50 }),
    update: jest.fn().mockResolvedValue({ id: 'u1', skill_level: 55 })
  }
}))

jest.unstable_mockModule('../../../models/Attempt.js', () => ({
  Attempt: {
    countAttempts: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({ id: 'a1' })
  }
}))

jest.unstable_mockModule('../../../models/Event.js', () => ({
  Event: { create: jest.fn().mockResolvedValue({ id: 'e1' }) }
}))

jest.unstable_mockModule('../../../services/learnerModel.js', () => ({
  updateSkill: jest.fn().mockReturnValue(55),
  recommendNextDifficulty: jest.fn().mockReturnValue('medium')
}))

let router

beforeEach(async () => {
  router = (await import('../puzzles.js')).default
})

describe('v1 puzzle submit flow', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/v1/puzzle', router)
  })

  it('submits correct solution and updates skill', async () => {
    const res = await request(app)
      .post('/api/v1/puzzle/p1/submit')
      .set('x-user-id', 'u1')
      .send({ solution_order: [0, 1], start_time: new Date().toISOString() })
    expect(res.status).toBe(200)
    expect(res.body.correct).toBe(true)
    expect(res.body.skill_after).toBe(55)
  })
})
