import {
  ClientEvent,
  GameConfig,
  GameStateEvent,
  JoinEvent,
  JoinGameEvent,
} from '../types';
import { GameState } from './gameState';

const gameConfig: GameConfig = {
  curScenario: '',
  scenarios: {},
  pieces: {
    fire_deck: {
      id: 'fire_deck',
      layer: 0,
      type: 'deck',
      name: 'Fire Deck',
      image: '',
      height: 200,
      width: 200,
      rotation: 0,
      x: 0,
      y: 0,
      cards: [
        {
          id: 'x',
          deckId: 'fire_deck',
          type: 'card',
          faceDown: false,
          x: 0,
          y: 0,
          counts: '4',
          layer: 0,
          image: '',
          height: 200,
          width: 200,
          rotation: 0,
        },
      ],
    },
  },
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
    it('should sync a join_game event', () => {
      const gameState = new GameState(gameConfig);
      const event: GameStateEvent = {
        event: 'join_game',
        player: '1',
      };
      gameState.syncEvent(event);
      expect(gameState.pieces['']).toBe('a');
    });

    // it('should sync a draw_cards event', () => {
    //   const gameState = new GameState(gameConfig);
    //   const event: ClientEvent = {
    //     event: 'draw_cards',
    //     deckId: '1',
    //     count: 2,
    //   };
    //   gameState.syncEvent(event);
    //   expect(gameState.pieces['']).toBe('a');
    // });
  });
});
