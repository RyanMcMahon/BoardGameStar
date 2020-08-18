import {
  createNewGame,
  getClientEvents,
  proccessEvent,
  GameState,
} from '../game';

import { emptyState } from './common';
import {
  Game,
  ChatEvent,
  DeckPiece,
  UpdatePieceEvent,
  MoneyTokenPiece,
} from '../../types';

jest.mock('../peer');

// const gameConfig: Game = {
//   version: 1,
//   id: '1',
//   name: 'test',
//   curScenario: '1',
//   scenarios: {
//     1: {
//       id: '1',
//       name: 'scenario 1',
//       players: ['player1', 'player2', 'player3', 'player4'],
//       pieces: ['player1', 'player2', 'player3', 'player4', 'p1', 'p2'],
//     },
//   },
//   pieces: {
//     player1: {
//       id: 'player1',
//       type: 'player',
//       color: 'red',
//       name: 'player 1',
//       x: 0,
//       y: 0,
//       width: 10,
//       height: 10,
//       rotation: 0,
//       layer: 3,
//     },
//     player2: {
//       id: 'player2',
//       type: 'player',
//       color: 'blue',
//       name: 'player 2',
//       x: 0,
//       y: 0,
//       width: 10,
//       height: 10,
//       rotation: 0,
//       layer: 3,
//     },
//     player3: {
//       id: 'player3',
//       type: 'player',
//       color: 'green',
//       name: 'player 3',
//       x: 0,
//       y: 0,
//       width: 10,
//       height: 10,
//       rotation: 0,
//       layer: 3,
//     },
//     player4: {
//       id: 'player4',
//       type: 'player',
//       color: 'yellow',
//       name: 'player 4',
//       x: 0,
//       y: 0,
//       width: 10,
//       height: 10,
//       rotation: 0,
//       layer: 3,
//     },
//     p1: {
//       id: 'p1',
//       type: 'deck',
//       name: 'deck',
//       image: 'a.png',
//       x: 0,
//       y: 0,
//       width: 10,
//       height: 10,
//       cards: ['p2'],
//       rotation: 0,
//       layer: 3,
//     },
//     p2: {
//       id: 'p2',
//       type: 'card',
//       deckId: 'p1',
//       image: 'a.png',
//       faceDown: false,
//       x: 0,
//       y: 0,
//       width: 10,
//       height: 10,
//       rotation: 0,
//       counts: '1,3:2,4:3',
//       layer: 3,
//     },
//   },
//   store: 'file',
//   sendAssets: false,
//   // loadAssets: () => ({}),
// };

const { onConnection, conn, onData } = require('../peer');
describe('game', () => {
  it.skip('should update pieces based on the number of players', () => {
    // createNewGame(gameConfig, { assets: {}, sendAssets: false }, () => {});
    // // Player 1
    // onConnection();
    // // Player 2
    // conn.metadata = {
    //   playerId: 'b',
    //   name: 'b',
    // };
    // onConnection();
    // conn.send.mock.calls.forEach((c: any) => console.log(c));
    // expect(conn.send).toHaveBeenCalledWith({
    //   type: 'join',
    // });
  });

  describe('proccessEvent -> getClientEvents', () => {
    it('should process a chat event', () => {
      const prevState = {
        ...emptyState,
      };
      const state = proccessEvent(prevState, {
        event: 'chat',
        playerId: 'a',
        message: 'Test',
      });
      const events = getClientEvents(prevState, state);

      expect(events.room.length).toBe(1);

      const chatEvent = events.room[0] as ChatEvent;
      expect(chatEvent.event).toBe('chat');
      expect(chatEvent.playerId).toBe('a');
      expect(chatEvent.message).toBe('Test');
    });

    it('should process a shuffle_discarded event', () => {
      const prevState: GameState = {
        ...emptyState,
        decks: ['d'],
        shuffled: {
          d: [],
        },
        discarded: {
          d: ['a'],
        },
        pieces: {
          d: {
            id: 'd',
            type: 'deck',
            count: 0,
            total: 1,
          } as DeckPiece,
        },
      };
      const state = proccessEvent(prevState, {
        event: 'shuffle_discarded',
        deckId: 'd',
      });
      const events = getClientEvents(prevState, state);

      expect(events.room.length).toBe(1);

      const updateEvent = events.room[0] as UpdatePieceEvent;
      expect(updateEvent.pieces.d).toBeTruthy();
      expect(updateEvent.pieces.d.count).toBe(1);
      expect(state.shuffled.d.length).toBe(1);
      expect(state.discarded.d.length).toBe(0);
    });

    it('should process a prompt_players event', () => {
      // TODO
    });

    it('should process a prompt_submission event', () => {
      // TODO
    });

    it('should process a roll_dice event', () => {
      // TODO
    });

    it('should process a draw_cards event', () => {
      // TODO
    });

    it('should process a draw_cards_to_table event', () => {
      // TODO
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

    it('should process a rename_player event', () => {
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

    it('should process a create_stack event', () => {
      // TODO
    });

    it('should process a split_stack event', () => {
      // TODO
    });

    it('should process a update_piece event', () => {
      // TODO
    });
  });
});
