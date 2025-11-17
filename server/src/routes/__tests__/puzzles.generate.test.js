import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'

jest.unstable_mockModule('../../services/llmAdapter.js', () => ({
  generateAdaptivePuzzle: jest.fn().mockResolvedValue({
    lines: ['a', 'b'],
    distractors: ['x'],
    solutionOrder: [0, 1],
    problem: 'p',
    hint: 'h'
  })
}))

jest.unstable_mockModule('../../models/Puzzle.js', () => ({
  Puzzle: {
    create: jest.fn().mockResolvedValue({
      id: 'p1',
      title: 't',
      description: 'd',
      difficulty: 'easy',
      category: 'algo',
      segments: ['a', 'b'],
      correct_order: [0, 1]
    })
  }
}))

jest.unstable_mockModule('../../models/Event.js', () => ({
  Event: { create: jest.fn().mockResolvedValue({ id: 'e1' }) }
}))

let router

beforeEach(async () => {
  router = (await import('../puzzles.js')).default
})

describe('puzzles generate endpoint', () => {
  let app
  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/puzzles', router)
  })

  it('creates puzzle from sanitized LLM output', async () => {
    const res = await request(app)
      .post('/api/puzzles/generate')
      .send({ topic: 'loops', difficulty: 'easy', userId: 'u1' })
    expect(res.status).toBe(201)
    expect(res.body.puzzle).toBeDefined()
  })
})
