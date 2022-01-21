import seedrandom from 'seedrandom';

let rng = seedrandom('BGS');

export function seed(seed: string) {
  rng = seedrandom(seed);
}

export function random(): number {
  return rng();
}

export function randomRange(low: number, high: number): number {
  return Math.floor(random() * high - low) + low;
}

export function shuffle<T>(arr: T[]): T[] {
  const length = arr.length;
  const shuffled: T[] = [...arr];

  for (let i = 0; i < length; i++) {
    const rand = randomRange(i, length);
    const value = shuffled[rand];
    shuffled[rand] = shuffled[i];
    shuffled[i] = value;
  }

  return shuffled;
}
