import { createNewGame } from './game';
import { GameConfig } from '../types';

jest.mock('./peer');

const gameConfig: GameConfig = {
  version: 1,
  id: '1',
  name: 'test',
  curScenario: '1',
  scenarios: {
    1: {
      id: '1',
      name: 'scenario 1',
      players: ['player1', 'player2', 'player3', 'player4'],
      pieces: ['player1', 'player2', 'player3', 'player4', 'p1', 'p2'],
    },
  },
  pieces: {
    player1: {
      id: 'player1',
      type: 'player',
      color: 'red',
      name: 'player 1',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      layer: 3,
    },
    player2: {
      id: 'player2',
      type: 'player',
      color: 'blue',
      name: 'player 2',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      layer: 3,
    },
    player3: {
      id: 'player3',
      type: 'player',
      color: 'green',
      name: 'player 3',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      layer: 3,
    },
    player4: {
      id: 'player4',
      type: 'player',
      color: 'yellow',
      name: 'player 4',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      layer: 3,
    },
    p1: {
      id: 'p1',
      type: 'deck',
      name: 'deck',
      image: 'a.png',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      cards: ['p2'],
      rotation: 0,
      layer: 3,
    },
    p2: {
      id: 'p2',
      type: 'card',
      deckId: 'p1',
      image: 'a.png',
      faceDown: false,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      rotation: 0,
      counts: '1,3:2,4:3',
      layer: 3,
    },
  },
  store: 'file',
  sendAssets: false,
  loadAssets: () => ({}),
};

const { onConnection, conn, onData } = require('./peer');
describe('game', () => {
  it('should update pieces based on the number of players', () => {
    createNewGame(gameConfig, { assets: {}, sendAssets: false }, () => {});

    // Player 1
    onConnection();

    // Player 2
    conn.metadata = {
      playerId: 'b',
      name: 'b',
    };

    onConnection();

    // conn.send.mock.calls.forEach((c: any) => console.log(c));
    // expect(conn.send).toHaveBeenCalledWith({
    //   type: 'join',
    // });
  });
});
