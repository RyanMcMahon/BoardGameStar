import { emptyState } from './common';
import { GameState, proccessEvent, getClientEvents } from '../game';
import { UpdatePieceEvent, PlayerPiece, GameEvent } from '../../types';

jest.mock('../peer');

describe('dice events', () => {
  it('should process a roll_dice event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        p: {
          id: 'p',
          type: 'player',
          balance: 100,
          playerId: 'p1',
          x: 0,
          y: 0,
          delta: 0,
        } as PlayerPiece,
      },
    };
    const state = proccessEvent(
      prevState,
      {
        event: 'roll_dice',
        hidden: false,
        dice: {
          20: 4,
        },
      },
      'p1'
    );
    const events = getClientEvents(prevState, state);
    expect(events.room.length).toBe(2);

    const updateEvent = events.room.find(
      (e: GameEvent) => e.event === 'update_piece'
    ) as UpdatePieceEvent;
    expect(Object.values(updateEvent.pieces).length).toBe(4);

    const addToBoardEvent = events.room.find(
      (e: GameEvent) => e.event === 'add_to_board'
    ) as UpdatePieceEvent;
    expect(addToBoardEvent.pieces.length).toEqual(4);
  });
});
