import { describe, expect, it } from 'bun:test';
import { RANK_ORDER, rankOf, toneForRank, toneForScore } from './score-rank';

describe('rankOf', () => {
  it('boundaries match the backend docs/scoring/README.md table', () => {
    expect(rankOf(100)).toBe('S');
    expect(rankOf(90)).toBe('S');
    expect(rankOf(89)).toBe('A');
    expect(rankOf(80)).toBe('A');
    expect(rankOf(79)).toBe('B');
    expect(rankOf(70)).toBe('B');
    expect(rankOf(69)).toBe('C');
    expect(rankOf(60)).toBe('C');
    expect(rankOf(59)).toBe('D');
    expect(rankOf(40)).toBe('D');
    expect(rankOf(39)).toBe('F');
    expect(rankOf(0)).toBe('F');
  });

  it('clamps negative / >100 inputs', () => {
    expect(rankOf(-10)).toBe('F');
    expect(rankOf(150)).toBe('S');
  });
});

describe('RANK_ORDER', () => {
  it('is ascending F→S', () => {
    expect(RANK_ORDER).toEqual(['F', 'D', 'C', 'B', 'A', 'S']);
  });
});

describe('toneForScore / toneForRank', () => {
  it('agrees for the same score', () => {
    expect(toneForScore(92)).toBe(toneForRank('S'));
    expect(toneForScore(50)).toBe(toneForRank('D'));
  });
});
