import { describe, test, expect } from 'vitest';
import { filterProfanity, containsProfanity } from '../profanity.js';

describe('Profanity Filter', () => {
  describe('containsProfanity', () => {
    test('detects common Czech profanity', () => {
      expect(containsProfanity('kurva')).toBe(true);
      expect(containsProfanity('prdel')).toBe(true);
      expect(containsProfanity('hovno')).toBe(true);
    });

    test('detects profanity case-insensitively', () => {
      expect(containsProfanity('KURVA')).toBe(true);
      expect(containsProfanity('Kurva')).toBe(true);
      expect(containsProfanity('HoVnO')).toBe(true);
    });

    test('detects profanity within longer text', () => {
      expect(containsProfanity('to je hovno hra')).toBe(true);
      expect(containsProfanity('ty kurvo')).toBe(true);
    });

    test('does not flag clean text', () => {
      expect(containsProfanity('dobrá hra')).toBe(false);
      expect(containsProfanity('pěkný tah')).toBe(false);
      expect(containsProfanity('gg')).toBe(false);
    });

    test('handles empty string', () => {
      expect(containsProfanity('')).toBe(false);
    });
  });

  describe('filterProfanity', () => {
    test('replaces profanity with asterisks', () => {
      const result = filterProfanity('to je kurva špatný');
      expect(result).not.toContain('kurva');
      expect(result).toContain('***');
    });

    test('replaces multiple profanities', () => {
      const result = filterProfanity('hovno a prdel');
      expect(result).not.toContain('hovno');
      expect(result).not.toContain('prdel');
    });

    test('preserves clean text unchanged', () => {
      expect(filterProfanity('dobrá hra')).toBe('dobrá hra');
      expect(filterProfanity('pěkný tah')).toBe('pěkný tah');
    });

    test('handles case-insensitive replacement', () => {
      const result = filterProfanity('KURVA to je HOVNO');
      expect(result).not.toContain('KURVA');
      expect(result).not.toContain('HOVNO');
    });

    test('handles empty string', () => {
      expect(filterProfanity('')).toBe('');
    });
  });
});
