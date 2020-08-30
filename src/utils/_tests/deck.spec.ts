import { emptyState } from './common';
import { GameState, proccessEvent, getClientEvents } from '../game';
import {
  UpdatePieceEvent,
  PlayerPiece,
  GameEvent,
  DeckPiece,
  CardPiece,
} from '../../types';

jest.mock('../peer');

describe('deck events', () => {
  it('should process a draw_cards event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        d: {
          id: 'd',
          type: 'deck',
          x: 0,
          y: 0,
          count: 1,
          delta: 0,
        } as DeckPiece,
        p: {
          id: 'p',
          playerId: 'p1',
          type: 'player',
          balance: 100,
          x: 0,
          handCount: 0,
          delta: 0,
        } as PlayerPiece,
      },
      hands: {
        p1: [],
      },
      shuffled: {
        d: ['1'],
      },
      discarded: {
        d: ['2', '3'],
      },
    };
    const state = proccessEvent(
      prevState,
      {
        event: 'draw_cards',
        deckId: 'd',
        count: 2,
      },
      'p1'
    );
    const events = getClientEvents(prevState, state);
    expect(events.room.length).toBe(1);

    const updateEvent = events.room.find(
      (e: GameEvent) => e.event === 'update_piece'
    ) as UpdatePieceEvent;
    expect(Object.values(updateEvent.pieces).length).toBe(2);
    expect(updateEvent.pieces.d.count).toBe(1);
    expect(updateEvent.pieces.d.delta).toBe(1);
    expect(updateEvent.pieces.p.handCount).toBe(2);
    expect(updateEvent.pieces.p.delta).toBe(1);
  });

  it('should process a draw_cards_to_table event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        d: {
          id: 'd',
          type: 'deck',
          x: 0,
          y: 0,
          height: 150,
          width: 100,
          count: 1,
          delta: 0,
        } as DeckPiece,
        c1: {
          id: 'c1',
          type: 'card',
          x: 0,
          y: 0,
          delta: 0,
        } as CardPiece,
        c2: {
          id: 'c2',
          type: 'card',
          x: 0,
          y: 0,
          delta: 0,
        } as CardPiece,
        c3: {
          id: 'c3',
          type: 'card',
          x: 0,
          y: 0,
          delta: 0,
        } as CardPiece,
      },
      shuffled: {
        d: ['c1'],
      },
      discarded: {
        d: ['c2', 'c3'],
      },
    };
    const state = proccessEvent(
      prevState,
      {
        event: 'draw_cards_to_table',
        deckId: 'd',
        count: 2,
        faceDown: true,
      },
      'p1'
    );
    const events = getClientEvents(prevState, state);
    expect(events.room.length).toBe(2);

    const updateEvent = events.room.find(
      (e: GameEvent) => e.event === 'update_piece'
    ) as UpdatePieceEvent;
    expect(Object.values(updateEvent.pieces).length).toBe(3);
    expect(updateEvent.pieces.d.count).toBe(1);
    state.board.forEach(id => expect(updateEvent.pieces[id].delta).toBe(1));
  });

  it('should process a pick_up_cards event', () => {
    // TODO
  });

  it('should process a pass_cards event', () => {
    // TODO
  });

  it('should process a peek_at_card event', () => {
    // TODO
  });

  it('should process a play_cards event', () => {
    // TODO
  });

  it('should process a discard event', () => {
    // TODO
  });

  it('should process a discard_played event', () => {
    // TODO
  });
});
