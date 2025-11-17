import { describe, it, expect } from '@jest/globals';
import { updateSkill, recommendNextDifficulty } from '../learnerModel.js';

describe('learnerModel', () => {
  describe('updateSkill', () => {
    it('should increase skill for correct solution', () => {
      const currentSkill = 50;
      const newSkill = updateSkill({
        currentSkill,
        puzzleDifficulty: 'medium',
        isCorrect: true,
        timeSpent: 60,
        attemptsCount: 1
      });
      
      expect(newSkill).toBeGreaterThan(currentSkill);
      expect(newSkill).toBeLessThanOrEqual(100);
    });

    it('should decrease skill for incorrect solution', () => {
      const currentSkill = 50;
      const newSkill = updateSkill({
        currentSkill,
        puzzleDifficulty: 'medium',
        isCorrect: false,
        timeSpent: 60,
        attemptsCount: 1
      });
      
      expect(newSkill).toBeLessThan(currentSkill);
      expect(newSkill).toBeGreaterThanOrEqual(0);
    });

    it('should clamp skill to 0-100 range', () => {
      const lowSkill = updateSkill({
        currentSkill: 0,
        puzzleDifficulty: 'easy',
        isCorrect: false,
        timeSpent: 60,
        attemptsCount: 1
      });
      
      const highSkill = updateSkill({
        currentSkill: 100,
        puzzleDifficulty: 'hard',
        isCorrect: true,
        timeSpent: 60,
        attemptsCount: 1
      });
      
      expect(lowSkill).toBeGreaterThanOrEqual(0);
      expect(highSkill).toBeLessThanOrEqual(100);
    });

    it('should give more reward for first attempt', () => {
      const skill1 = updateSkill({
        currentSkill: 50,
        puzzleDifficulty: 'medium',
        isCorrect: true,
        timeSpent: 60,
        attemptsCount: 1
      });
      
      const skill2 = updateSkill({
        currentSkill: 50,
        puzzleDifficulty: 'medium',
        isCorrect: true,
        timeSpent: 60,
        attemptsCount: 2
      });
      
      expect(skill1).toBeGreaterThan(skill2);
    });
  });

  describe('recommendNextDifficulty', () => {
    it('should recommend harder difficulty after correct first attempt', () => {
      const recommendation = recommendNextDifficulty({
        currentSkill: 50,
        currentDifficulty: 'medium',
        isCorrect: true,
        attemptsCount: 1
      });
      
      expect(['medium', 'hard']).toContain(recommendation);
    });

    it('should recommend same or easier difficulty after incorrect', () => {
      const recommendation = recommendNextDifficulty({
        currentSkill: 50,
        currentDifficulty: 'medium',
        isCorrect: false,
        attemptsCount: 2
      });
      
      expect(['easy', 'medium']).toContain(recommendation);
    });

    it('should return valid difficulty string', () => {
      const recommendation = recommendNextDifficulty({
        currentSkill: 50,
        currentDifficulty: 'medium',
        isCorrect: true,
        attemptsCount: 1
      });
      
      expect(['easy', 'medium', 'hard']).toContain(recommendation);
    });
  });
});

