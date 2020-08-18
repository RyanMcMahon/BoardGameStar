import { emptyState } from './common';
import { GameState, proccessEvent, getClientEvents } from '../game';
import { MoneyTokenPiece, UpdatePieceEvent, PlayerPiece } from '../../types';

jest.mock('../peer');

describe.only('transaction event', () => {
  it('should process a bank -> bank transaction event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        m: {
          id: 'm',
          type: 'money',
          balance: 100,
          x: 0,
          width: 100,
          delta: 0,
        } as MoneyTokenPiece,
      },
    };
    const state = proccessEvent(prevState, {
      event: 'transaction',
      amount: 10,
      transaction: {
        from: {
          id: 'm',
          name: 'Old',
          max: 100,
        },
        to: {
          name: 'New',
        },
      },
    });
    const events = getClientEvents(prevState, state);

    expect(events.room.length).toBe(1);
    const updateEvent = events.room[0] as UpdatePieceEvent;
    expect(updateEvent.pieces.m).toBeTruthy();
    expect(updateEvent.pieces.m.balance).toBe(90);
    expect(updateEvent.pieces.m.delta).toBe(1);

    const newPiece = Object.values(updateEvent.pieces).find(p => p.id !== 'm');
    expect(newPiece).toBeTruthy();
    expect(newPiece?.balance).toBe(10);
    expect(newPiece?.x).toBe(140);
  });

  it('should process a bank -> player transaction event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        m: {
          id: 'm',
          type: 'money',
          balance: 100,
          x: 0,
          width: 100,
          delta: 0,
        } as MoneyTokenPiece,
        p: {
          id: 'p',
          type: 'player',
          balance: 100,
          x: 0,
          delta: 0,
        } as PlayerPiece,
      },
    };
    const state = proccessEvent(prevState, {
      event: 'transaction',
      amount: 10,
      transaction: {
        from: {
          id: 'm',
          name: 'Bank',
          max: 100,
        },
        to: {
          id: 'p',
          name: 'Player',
        },
      },
    });
    const events = getClientEvents(prevState, state);
    expect(events.room.length).toBe(1);

    const updateEvent = events.room[0] as UpdatePieceEvent;
    expect(updateEvent.pieces.m).toBeTruthy();
    expect(updateEvent.pieces.m.balance).toBe(90);
    expect(updateEvent.pieces.m.delta).toBe(1);

    expect(updateEvent.pieces.p).toBeTruthy();
    expect(updateEvent.pieces.p.balance).toBe(110);
    expect(updateEvent.pieces.p.delta).toBe(1);
  });

  it('should process a player -> bank transaction event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        m: {
          id: 'm',
          type: 'money',
          balance: 100,
          x: 0,
          width: 100,
          delta: 0,
        } as MoneyTokenPiece,
        p: {
          id: 'p',
          type: 'player',
          balance: 100,
          x: 0,
          delta: 0,
        } as PlayerPiece,
      },
    };
    const state = proccessEvent(prevState, {
      event: 'transaction',
      amount: 10,
      transaction: {
        from: {
          id: 'p',
          name: 'From',
          max: 100,
        },
        to: {
          id: 'm',
          name: 'To',
        },
      },
    });
    const events = getClientEvents(prevState, state);
    expect(events.room.length).toBe(1);

    const updateEvent = events.room[0] as UpdatePieceEvent;
    expect(updateEvent.pieces.m).toBeTruthy();
    expect(updateEvent.pieces.m.balance).toBe(110);
    expect(updateEvent.pieces.m.delta).toBe(1);

    expect(updateEvent.pieces.p).toBeTruthy();
    expect(updateEvent.pieces.p.balance).toBe(90);
    expect(updateEvent.pieces.p.delta).toBe(1);
  });

  it('should process a player -> player transaction event', () => {
    const prevState: GameState = {
      ...emptyState,
      pieces: {
        p1: {
          id: 'p1',
          type: 'player',
          balance: 100,
          x: 0,
          delta: 0,
        } as PlayerPiece,
        p2: {
          id: 'p2',
          type: 'player',
          balance: 100,
          x: 0,
          delta: 0,
        } as PlayerPiece,
      },
    };
    const state = proccessEvent(prevState, {
      event: 'transaction',
      amount: 10,
      transaction: {
        from: {
          id: 'p1',
          name: 'From',
          max: 100,
        },
        to: {
          id: 'p2',
          name: 'To',
        },
      },
    });
    const events = getClientEvents(prevState, state);
    expect(events.room.length).toBe(1);

    const updateEvent = events.room[0] as UpdatePieceEvent;
    expect(updateEvent.pieces.p1).toBeTruthy();
    expect(updateEvent.pieces.p1.balance).toBe(90);
    expect(updateEvent.pieces.p1.delta).toBe(1);

    expect(updateEvent.pieces.p2).toBeTruthy();
    expect(updateEvent.pieces.p2.balance).toBe(110);
    expect(updateEvent.pieces.p2.delta).toBe(1);
  });

  it.skip('should process a transaction event with insufficient funds', () => {
    // TODO
  });

  it.skip('should process a transaction event with unknown ricipient', () => {
    // TODO
  });
});
