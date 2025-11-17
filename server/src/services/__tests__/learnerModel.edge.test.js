import { describe, it, expect } from '@jest/globals'
import { updateSkill } from '../../services/learnerModel.js'

describe('learnerModel.updateSkill edge cases', () => {
  it('clamps skill to 0', () => {
    const s = updateSkill({ currentSkill: 0, puzzleDifficulty: 'easy', isCorrect: false, timeSpent: 10, attemptsCount: 1 })
    expect(s).toBeGreaterThanOrEqual(0)
  })

  it('clamps skill to 100', () => {
    const s = updateSkill({ currentSkill: 100, puzzleDifficulty: 'hard', isCorrect: true, timeSpent: 10, attemptsCount: 1 })
    expect(s).toBeLessThanOrEqual(100)
  })

  it('penalizes many attempts', () => {
    const s1 = updateSkill({ currentSkill: 50, puzzleDifficulty: 'medium', isCorrect: true, timeSpent: 60, attemptsCount: 1 })
    const s3 = updateSkill({ currentSkill: 50, puzzleDifficulty: 'medium', isCorrect: true, timeSpent: 60, attemptsCount: 3 })
    expect(s1).toBeGreaterThan(s3)
  })

  it('time bonus increases gain when under maxTime', () => {
    const slow = updateSkill({ currentSkill: 50, puzzleDifficulty: 'medium', isCorrect: true, timeSpent: 120, attemptsCount: 1, maxTime: 120 })
    const fast = updateSkill({ currentSkill: 50, puzzleDifficulty: 'medium', isCorrect: true, timeSpent: 60, attemptsCount: 1, maxTime: 120 })
    expect(fast).toBeGreaterThan(slow)
  })

  it('handles null currentSkill', () => {
    const s = updateSkill({ currentSkill: null, puzzleDifficulty: 'easy', isCorrect: true, timeSpent: 10, attemptsCount: 1 })
    expect(typeof s).toBe('number')
  })
})
