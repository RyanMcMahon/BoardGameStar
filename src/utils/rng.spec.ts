import { random, randomRange, seed, shuffle } from './rng';

describe('rng', () => {
  it('should return a random number', () => {
    seed('A12');
    expect(random()).toBe(0.7674942818596119);
  });

  it('should return a random number within a range', () => {
    seed('A12');
    expect(randomRange(3, 10)).toBe(7);
  });

  it('should shuffle an array', () => {
    seed('A12');
    expect(shuffle([1, 2, 3, 4, 5, 6, 7]).toString()).toBe(
      [6, 7, 2, 5, 1, 3, 4].toString()
    );
  });
});
