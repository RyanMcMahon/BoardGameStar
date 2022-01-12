import { ClientEvent, GameConfig } from '../types';
import { GameState } from './gameState';

const gameConfig: GameConfig = {
  curScenario: '',
  scenarios: {},
  pieces: {},
};

describe('GameState', () => {
  it('should create a game state', () => {
    // TODO
  });

  it('should sync an event', () => {
    // TODO
    const gameState = new GameState(gameConfig);
  });

  it('should sync an event that happened before the latest event', () => {
    // TODO
    const gameState = new GameState(gameConfig);
    expect(1).toBe(1);
  });

  describe('Events', () => {
    it('should sync a DRAW_CARDS event', () => {
      const gameState = new GameState(gameConfig);
      const event: ClientEvent = {
        event: 'draw_cards',
        deckId: '1',
        count: 2,
      };
      gameState.syncEvent(event);
      expect(gameState.pieces['']).toBe('a');
    });
  });
});
