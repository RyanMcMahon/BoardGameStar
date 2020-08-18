import { Game } from '../../types';

export const emptyState = {
  game: {} as Game,
  hostId: '',
  gameId: '',
  players: [],
  chat: [],
  hands: {},
  clients: {},
  decks: [],
  shuffled: {},
  discarded: {},
  board: [],
  pieces: {},
  prompts: {},
};
