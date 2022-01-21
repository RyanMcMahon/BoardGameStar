import {
  ClientEvent,
  DeckOption,
  Game,
  GameConfig,
  GameStateEvent,
  JoinEvent,
} from '../types';
import { GameState } from './gameState';

const basePosition = {
  layer: 0,
  height: 200,
  width: 200,
  rotation: 0,
  x: 0,
  y: 0,
};

const gameConfig: Game = {
  id: '1',
  name: '',
  summary: '',
  description: '',
  version: 1,
  store: 'browser',
  tags: [],
  config: {
    curScenario: '',
    scenarios: {
      base: {
        id: 'base',
        name: 'base',
        pieces: [],
        players: [],
      },
    },
    pieces: {
      player1: {
        ...basePosition,
        id: 'player1',
        type: 'player',
        name: 'player1',
        color: '',
      },
      player2: {
        ...basePosition,
        id: 'player2',
        type: 'player',
        name: 'player2',
        color: '',
      },
      fire_deck: {
        ...basePosition,
        id: 'fire_deck',
        type: 'deck',
        name: 'Fire Deck',
        image: '',
        shuffled: ['x1', 'x2', 'x3'],
        discarded: [],
        removed: [],
        drawn: [],
        shuffleOnStart: true,
      },
      x1: {
        ...basePosition,
        id: 'x1',
        cardId: 'x',
        deckId: 'fire_deck',
        type: 'card',
        faceDown: false,
        image: '',
      },
      x2: {
        ...basePosition,
        id: 'x2',
        cardId: 'x',
        deckId: 'fire_deck',
        type: 'card',
        faceDown: false,
        image: '',
      },
      x3: {
        ...basePosition,
        id: 'x3',
        cardId: 'x',
        deckId: 'fire_deck',
        type: 'card',
        faceDown: false,
        image: '',
      },
    },
  },
};

describe('GameState', () => {
  it('should create a game state', () => {
    // TODO
  });

  it('should sync an event', () => {
    // TODO
    const gameState = new GameState(gameConfig, '1', '2');
  });

  it('should sync an event that happened before the latest event', () => {
    // TODO
    const gameState = new GameState(gameConfig, '1', '2');
    expect(1).toBe(1);
  });

  describe('Events', () => {
    const joinEvent: GameStateEvent = {
      playerId: '1',
      event: 'request_join_game',
      ts: 1000,
      name: 'Ryan',
    };

    it('should sync a start_game event', () => {
      const gameState = new GameState(gameConfig, '1', '2');
      const event: GameStateEvent = {
        event: 'start_game',
        playerId: '1',
        ts: 1000,
      };
      gameState.syncEvent(event);
      expect(
        (gameState.pieces.fire_deck as DeckOption).shuffled.toString()
      ).toBe(`x2,x3,x1`);
    });

    it('should sync a join_game event', () => {
      const gameState = new GameState(gameConfig, '1', '2');
      gameState.syncEvent(joinEvent);
      expect(gameState.players['1'].name).toBe('Ryan');
    });

    it('should sync a draw_cards event', () => {
      const gameState = new GameState(gameConfig, '1', '2');
      const event: GameStateEvent = {
        playerId: '1',
        ts: 1000,
        event: 'draw_cards',
        deckId: 'fire_deck',
        count: 2,
      };
      gameState.syncEvent(joinEvent);
      gameState.syncEvent(event);
      expect(gameState.players['1'].hand.toString()).toBe('x2,x3');
      expect(
        (gameState.pieces.fire_deck as DeckOption).shuffled.toString()
      ).toBe(`x1`);
    });
  });

  it('should sync a draw_cards_to_table event', () => {
    // TODO
  });

  it('should sync a pick_up_cards event', () => {
    // TODO
  });

  it('should sync a pass_cards event', () => {
    // TODO
  });

  it('should sync a play_cards event', () => {
    // TODO
  });

  it('should sync a discard_cards event', () => {
    // TODO
  });

  it('should sync a update_piece event', () => {
    // TODO
  });

  it.skip('should sync a create_stack event', () => {
    // TODO
  });

  it.skip('should sync a split_stack event', () => {
    // TODO
  });
});
