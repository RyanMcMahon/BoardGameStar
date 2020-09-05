import _, { update } from 'lodash';
import { detailedDiff } from 'deep-object-diff';
import slug from 'slugid';
import Peer from 'peerjs';
import {
  Card,
  RenderPiece,
  Game,
  GameEvent,
  ClientEvent,
  PlayerPiece,
  Pieces,
  DicePiece,
  CardPiece,
  DeckPiece,
  ChatEvent,
  StackPiece,
  MoneyTokenPiece,
  GamePromptAnswer,
  GamePrompt,
  PlayerJoinEvent,
} from '../types';

import { getHostId, getGameId, getInstanceId } from './identity';
import { createPeer } from './peer';
import { stat } from 'fs';
import { send } from 'process';

interface GamePeerDataConnection extends Peer.DataConnection {
  send: (event: GameEvent) => void;
  metadata: {
    playerId: string;
    name: string;
    spectator?: boolean;
  };
}

interface Deck extends DeckPiece {
  cards: string[];
  discarded: string[];
}

interface Player {
  name: string;
  hand: string[];
  conn: GamePeerDataConnection;
}

interface Players {
  [id: string]: Player;
}

interface Decks {
  [id: string]: Deck;
}

export interface GameState {
  game: Game;
  clients: { [playerId: string]: GamePeerDataConnection };
  hostId: string;
  gameId: string;
  players: string[];
  chat: ChatEvent[];
  hands: { [playerId: string]: string[] };
  decks: string[];
  shuffled: { [deckId: string]: string[] };
  discarded: { [deckId: string]: string[] };
  board: string[];
  pieces: Pieces;
  prompts: {
    [promptId: string]: {
      players: string[];
      prompt: GamePrompt;
      answers: {
        [playerId: string]: GamePromptAnswer[];
      };
    };
  };
}

interface GameStateChange {
  players: { [index: string]: string };
  chat: { [index: string]: ChatEvent };
  hands: { [playerId: string]: { [index: string]: string } };
  decks: { [index: string]: string };
  shuffled: { [deckId: string]: { [index: string]: string } };
  discarded: { [index: string]: string };
  board: { [index: string]: string };
  pieces: Pieces;
}

export interface GameClientState {
  hostId: string;
  gameId: string;
  peer: Peer;
  board: string[];
  pieces: Pieces;
}

export interface Assets {
  [key: string]: string;
}

interface GameOptions {
  assets: Assets;
  sendAssets: boolean;
}

interface PlayerConnectEvent {
  event: 'player_connect';
  playerId: string;
  name: string;
  spectator: boolean;
  piecesForPlayerCounts: PiecesForPlayerCounts;
}

interface PiecesForPlayerCounts {
  [pieceId: string]: number[];
}

let curGame: GameClientState;

function getPiecesForPlayerCounts(game: Game): PiecesForPlayerCounts {
  const scenario = game.config.scenarios[game.config.curScenario];
  const maxPlayers = scenario.players.length;

  const ret: PiecesForPlayerCounts = {};

  Object.values(game.config.pieces).forEach(piece => {
    if (piece.counts) {
      const countExp = (piece.counts || '1').split(',').map((t, index) => {
        const tuple = t.split(':');
        if (tuple.length < 2) {
          tuple.unshift(`${index + 1}`);
        }
        return [parseInt(tuple[0], 10), parseInt(tuple[1], 10)];
      });
      countExp.forEach(([min, count], index) => {
        const max =
          index + 1 < countExp.length ? countExp[index + 1][0] - 1 : maxPlayers;

        ret[piece.id] = new Array(maxPlayers).fill(0);
        for (let i = min; i <= max; i++) {
          ret[piece.id][i] = count;
        }
      });
    }
  });

  return ret;
}

function getPiecesForPlayerCount(
  game: Game,
  piecesForPlayerCounts: PiecesForPlayerCounts,
  playerCount: number
): Pieces {
  const pieces = Object.entries(piecesForPlayerCounts).reduce(
    (agg, [id, counts]) => {
      const piece = game.config.pieces[id];
      const offset = {
        x: ((piece as any).width || (piece as any).radius * 2) * 1.2,
        y: ((piece as any).height || (piece as any).radius * 2) * 1.2,
      };
      const ret: Pieces = { ...agg };

      for (let i = 0; i < counts[playerCount]; i++) {
        const copy = {
          ...piece,
          x: piece.x + (i % 10) * offset.x,
          y: piece.y + Math.floor(i / 10) * offset.y,
          id: slug.nice(),
          parentId: id,
          delta: 0,
        };
        ret[copy.id] = copy as any;
      }

      return ret;
    },
    {}
  );
  return pieces;
}

export function proccessEvent(
  state: GameState,
  event: ClientEvent | PlayerConnectEvent,
  playerId: string
): GameState {
  switch (event.event) {
    case 'player_connect': {
      const { playerId, spectator, piecesForPlayerCounts } = event;
      const players = [...state.players];
      if (!spectator) {
        players.push(playerId);
      }

      const curScenario =
        state.game.config.scenarios[state.game.config.curScenario];
      const pieces = getPiecesForPlayerCount(
        state.game,
        piecesForPlayerCounts,
        players.length
      );
      const shuffled: { [deckId: string]: string[] } = {};
      const discarded: { [deckId: string]: string[] } = {};

      curScenario.pieces.forEach(id => {
        if (!pieces[id]) {
          const piece = {
            ...state.game.config.pieces[id],
            delta: (state.pieces[id]?.delta || 0) + 1,
          };
          if (piece.type === 'card') {
            return;
          }

          pieces[id] = piece as RenderPiece;
        } else {
          pieces[id] = {
            ...pieces[id],
            delta: pieces[id].delta + 1,
          };
        }
      });

      if (!spectator) {
        const playarea = {
          ...pieces[curScenario.players[players.length - 1]],
          playerId,
          hand: [],
          name: event.name || `Player ${players.length}`,
        } as RenderPiece;
        pieces[playarea.id] = playarea;
      }

      for (let id in pieces) {
        if (pieces[id].counts && !pieces[id].parentId) {
          // original piece
          delete pieces[id];
        }
      }

      Object.values(pieces).forEach(piece => {
        if (piece.type !== 'deck') {
          return;
        }

        const cards = Object.values(pieces)
          .filter(p => p.deckId === piece.id)
          .map(x => x.id);
        shuffled[piece.id] = _.shuffle(cards);
        discarded[piece.id] = [];

        piece.count = cards.length;
        piece.total = cards.length;
      });

      const board = Object.values(pieces)
        .filter((p: any) => p.type !== 'card')
        .map((p: any) => p.id);
      const newState = {
        ...state,
        shuffled,
        discarded,
        pieces,
        board,
        players,
      };
      return newState;
    }

    case 'chat': {
      return {
        ...state,
        chat: [...state.chat, event],
      };
    }

    case 'shuffle_discarded': {
      const { deckId } = event;
      const newState = {
        ...state,
        shuffled: {
          [deckId]: [...state.shuffled[deckId], ...state.discarded[deckId]],
        },
        discarded: {
          [deckId]: [],
        },
      };
      newState.pieces[deckId].count = newState.shuffled[deckId].length;
      return newState;
    }

    case 'transaction': {
      const newState = { ...state };
      const { amount } = event;
      const { from, to } = event.transaction;
      const fromPiece = { ...state.pieces[from.id] };
      let moneyTemplate = (fromPiece.type === 'money'
        ? fromPiece
        : {
            ...Object.values(state.pieces).find(p => p.type === 'money'),
            x: 0, // TODO
            y: 0, // TODO
          }) as MoneyTokenPiece;

      if (fromPiece.balance < amount) {
        console.error('Insufficient Funds');
        return state;
      }

      const toPiece: MoneyTokenPiece | PlayerPiece = to.id
        ? { ...(state.pieces[to.id] as MoneyTokenPiece | PlayerPiece) }
        : {
            ...moneyTemplate,
            id: slug.nice(),
            x: moneyTemplate.x + moneyTemplate.width + 40,
            balance: 0,
            delta: 0,
          };

      if (!toPiece) {
        console.error('Unknown Recipient');
        return state;
      }

      fromPiece.balance -= amount;
      fromPiece.delta++;
      toPiece.balance = (toPiece.balance || 0) + amount;
      toPiece.delta++;

      if (
        fromPiece.balance === 0 &&
        Object.values(state.pieces).find(
          p => p.type === 'money' && p.id !== fromPiece.id
        )
      ) {
        fromPiece.type = 'deleted';
      }

      newState.pieces = {
        ...state.pieces,
        [fromPiece.id]: fromPiece,
        [toPiece.id]: toPiece,
      };

      return newState;
    }

    case 'prompt_players': {
      return { ...state };
    }

    case 'prompt_submission': {
      return { ...state };
    }

    case 'roll_dice': {
      const playArea = Object.values(state.pieces).find(
        p => p.playerId === playerId
      );
      if (!playArea) {
        return state;
      }

      const { dice, hidden } = event;
      const dicePieces: DicePiece[] = Object.entries(dice)
        .filter(([faces, count]) => count > 0)
        .reduce((agg, [faces, count], setIndex) => {
          const d: DicePiece[] = [...Array(count)].map((x, index) => ({
            hidden,
            id: slug.nice(),
            type: 'die',
            faces: parseInt(faces, 10),
            value: _.random(1, parseInt(faces, 10)),
            delta: 0,
            x: playArea.x + index * 150,
            y: playArea.y + 50 + setIndex * 150,
            layer: 6,
          }));
          return [...agg, ...d];
        }, [] as DicePiece[]);
      const diceById = (_.keyBy(dicePieces, 'id') as unknown) as Pieces;

      return {
        ...state,
        pieces: {
          ...state.pieces,
          ...diceById,
        },
      };
    }

    case 'draw_cards': {
      const playArea = Object.values(state.pieces).find(
        p => p.playerId === playerId
      );
      if (!playArea) {
        return state;
      }

      const { deckId, count } = event;
      const reShuffle = count > state.shuffled[deckId].length;
      const shuffled = [
        ...state.shuffled[deckId],
        ...(reShuffle ? _.shuffle(state.discarded[deckId]) : []),
      ];
      const discarded = reShuffle ? [] : [...state.discarded[deckId]];
      const hand = [...playArea.hand, ...shuffled.splice(0, count)];
      return {
        ...state,
        pieces: {
          ...state.pieces,
          [deckId]: {
            ...state.pieces[deckId],
            count: shuffled.length,
            delta: state.pieces[deckId].delta + 1,
          },
          [playArea.id]: {
            ...playArea,
            hand,
            handCount: hand.length,
            delta: playArea.delta + 1,
          },
        },
        shuffled: {
          [deckId]: shuffled,
        },
        discarded: {
          [deckId]: discarded,
        },
        // hands: {
        //   [playerId]: hand,
        // },
      };
    }

    case 'draw_cards_to_table': {
      const { deckId, count, faceDown } = event;
      const deckPiece = state.pieces[deckId];
      const reShuffle = count > state.shuffled[deckId].length;
      const shuffled = [
        ...state.shuffled[deckId],
        ...(reShuffle ? _.shuffle(state.discarded[deckId]) : []),
      ];
      const discarded = reShuffle ? [] : [...state.discarded[deckId]];
      const cardIds = shuffled.splice(0, count);
      const board = [...state.board, ...cardIds];
      const cards = _.keyBy(
        cardIds.map((id, index) => ({
          ...state.pieces[id],
          faceDown,
          x: deckPiece.x + deckPiece.width + 50 + index * 40,
          y: deckPiece.y,
          width: deckPiece.width,
          height: deckPiece.height,
          delta: state.pieces[id].delta + 1,
        })),
        'id'
      );

      return {
        ...state,
        board,
        pieces: {
          ...state.pieces,
          ...cards,
          [deckId]: {
            ...state.pieces[deckId],
            count: shuffled.length,
            delta: state.pieces[deckId].delta + 1,
          },
        },
        shuffled: {
          [deckId]: shuffled,
        },
        discarded: {
          [deckId]: discarded,
        },
      };
    }

    case 'pick_up_cards': {
      const { cardIds } = event;
      const newState = {
        ...state,
        board: state.board.filter(pieceId => !cardIds.includes(pieceId)),
      };
      newState.hands[playerId].push(...cardIds);
      return newState;
    }

    case 'play_cards': {
      const playArea = Object.values(state.pieces).find(
        p => p.playerId === playerId
      ) as PlayerPiece;
      if (!playArea) {
        return state;
      }

      const { cardIds, faceDown } = event;
      const cards = playArea.hand
        .filter(id => cardIds.includes(id))
        .map((cardId, index) => {
          const card = state.pieces[cardId] as CardPiece;
          const deck = state.pieces[card.deckId];

          return {
            ...state.pieces[cardId],
            faceDown,
            x: playArea.x + index * 40,
            y: playArea.y + 50,
            width: deck.width,
            height: deck.height,
            delta: card.delta + 1,
          };
        }) as RenderPiece[];
      return {
        ...state,
        pieces: {
          ...state.pieces,
          ..._.keyBy(cards, 'id'),
          [playArea.id]: {
            ...playArea,
            hand: playArea.hand.filter(id => !cardIds.includes(id)),
            delta: playArea.delta + 1,
          },
        },
        board: [...state.board, ...cardIds],
      };
    }

    case 'pass_cards': {
      const { cardIds, playerId: receivingPlayerId } = event;
      return {
        ...state,
        hands: {
          [receivingPlayerId]: [...state.hands[receivingPlayerId], ...cardIds],
          [playerId]: state.hands[playerId].filter(id => !cardIds.includes(id)),
        },
      };
    }

    case 'discard': {
      const { cardIds } = event;
      const cards = cardIds.map(id => state.pieces[id]);
      const cardsByDeck = _.groupBy(cards, 'deckId');
      const discarded = { ...state.discarded };
      for (let deckId in cardsByDeck) {
        discarded[deckId] = [
          ...discarded[deckId],
          ...cardsByDeck[deckId].map(card => card.id),
        ];
      }

      return {
        ...state,
        ...discarded,
        hands: {
          [playerId]: state.hands[playerId].filter(id => !cardIds.includes(id)),
        },
        board: state.board.filter(id => !cardIds.includes(id)),
      };
    }

    case 'discard_played': {
      const { deckId } = event;
      const cardIds = state.board
        .map(id => state.pieces[id])
        .filter(p => p.type === 'card' && p.deckId === deckId)
        .map(c => c.id);
      return {
        ...state,
        discarded: {
          [deckId]: [...state.discarded[deckId], ...cardIds],
        },
        board: state.board.filter(pieceId => cardIds.includes(pieceId)),
      };
    }

    case 'create_stack': {
      const { ids } = event;
      const top = { ...state.pieces[ids.slice(-1)[0]] };
      const bottom = { ...state.pieces[ids[0]] };
      const stack: StackPiece = {
        ...top,
        x: bottom.x,
        y: bottom.y,
        id: slug.nice(),
        type: 'stack',
        pieces: [
          ...(bottom.pieces || [bottom.id]),
          ...(top.pieces || [top.id]),
        ],
        counts: null,
        delta: 0,
      };

      return {
        ...state,
        pieces: {
          ...state.pieces,
          [stack.id]: stack,
        },
        board: [...state.board.filter(i => !ids.includes(i)), stack.id],
      };
    }

    case 'split_stack': {
      const { id, count } = event;
      // const newState = {...state};
      const stack = { ...state.pieces[id] };
      const bottom = stack.pieces.slice(0, count - 1);
      const top = stack.pieces.slice(count - 1);

      const piecesToRemove: string[] = [];
      const piecesToAdd: string[] = [];
      const updatedPieces: Pieces = {};

      if (!top.length) {
        return state;
      }

      if (bottom.length === 1) {
        const [bottomId] = bottom;
        const bottomPiece = { ...state.pieces[bottomId] };
        piecesToRemove.push(stack.id);
        piecesToAdd.push(bottomId);

        bottomPiece.x = stack.x;
        bottomPiece.y = stack.y;
        bottomPiece.delta++;
        updatedPieces[bottomId] = bottomPiece;
      } else {
        stack.pieces = bottom;
        stack.delta++;
        updatedPieces[stack.id] = stack;
      }

      if (top.length === 1) {
        const [topId] = top;
        const topPiece = { ...state.pieces[topId] };
        piecesToAdd.push(topId);

        topPiece.x = stack.x + (topPiece.width || topPiece.radius * 2) + 20;
        topPiece.y = stack.y;
        topPiece.delta++;
        updatedPieces[topId] = topPiece;
      } else {
        const topStack: StackPiece = {
          ...state.pieces[top[0]],
          id: slug.nice(),
          type: 'stack',
          pieces: top,
          counts: null,
          delta: 0,
          x: stack.x + (stack.width || stack.radius * 2) + 20,
          y: stack.y + 50,
        };
        // newState.pieces[topStack.id] = topStack;
        updatedPieces[topStack.id] = topStack;
        piecesToAdd.push(topStack.id);
      }

      return {
        ...state,
        pieces: {
          ...state.pieces,
          ...updatedPieces,
        },
        board: [
          ...state.board.filter(id => !piecesToRemove.includes(id)),
          ...piecesToAdd,
        ],
      };
    }

    case 'rename_player': {
      const { name } = event;
      const playArea = Object.values(state.pieces).find(
        p => p.playerId === playerId
      );
      if (!playArea) {
        return state;
      }

      return {
        ...state,
        pieces: {
          [playArea.id]: {
            ...playArea,
            name,
            delta: playArea.delta + 1,
          },
        },
      };
    }

    case 'update_piece': {
      const { pieces } = event;
      return { ...state, pieces: { ...state.pieces, ...pieces } };
    }

    default: {
      return state;
    }
  }
}

export function getClientEvents(prevState: GameState, state: GameState) {
  const events: {
    room: GameEvent[];
    players: { [playerId: string]: GameEvent[] };
  } = {
    room: [],
    players: {},
  };
  const { added, deleted, updated } = detailedDiff(prevState, state) as {
    added: Partial<GameStateChange>;
    deleted: Partial<GameStateChange>;
    updated: Partial<GameStateChange>;
  };

  const updatedPieces = new Set<string>();

  // Added
  if (added.chat) {
    events.room.push(
      ...((Object.values(added.chat || {}) as unknown) as ChatEvent[])
    );
  }

  if (added.shuffled) {
    for (let deckId in added.shuffled) {
      updatedPieces.add(deckId);
    }
  }

  if (added.pieces) {
    for (let id in added.pieces) {
      updatedPieces.add(id);
    }
    // events.room.push({
    //   event: 'add_to_board',
    //   pieces: Object.keys(added.pieces),
    // });
  }

  // if (added.board) {
  //   events.room.push({
  //     event: 'add_to_board',
  //     pieces: Object.values(added.board),
  //   });
  // }

  // deleted
  // TODO

  // Updated
  if (updated.pieces) {
    for (let id in updated.pieces) {
      updatedPieces.add(id);
    }
  }

  if (added.board || updated.board || deleted.board) {
    events.room.push({
      event: 'set_board_event',
      board: state.board,
    });
  }

  if (updatedPieces.size) {
    events.room.push({
      event: 'update_piece',
      pieces: _.keyBy(
        Array.from(updatedPieces).map(id => state.pieces[id]),
        'id'
      ),
    });
  }

  return events;
}

export async function createNewGame(
  game: Game,
  options: GameOptions,
  cb: (gameState: GameClientState) => void
) {
  if (curGame) {
    curGame.peer.disconnect();
  }

  // const scenario = game.config.scenarios[game.config.curScenario];
  const hostId = getHostId();
  const gameId = getGameId();
  const peer = await createPeer(getInstanceId(gameId, hostId));
  const { assets, sendAssets } = options;

  peer.on('open', () => {
    const chat: ChatEvent[] = [];
    let hiddenPieces: Pieces = {};
    // let pieces: Pieces = Object.values(game.config.pieces).reduce(
    //   (byId, piece) => {
    //     if (piece.type !== 'card') {
    //       return {
    //         ...byId,
    //         [piece.id]: {
    //           ...piece,
    //           delta: 0,
    //         },
    //       };
    //     } else {
    //       return byId;
    //     }
    //   },
    //   {}
    // );

    // let decks: Decks = Object.values(pieces)
    //   .filter(p => p.type === 'deck')
    //   .reduce(
    //     (byId, deck) => ({
    //       ...byId,
    //       [deck.id]: {
    //         ...deck,
    //         count: 0,
    //         total: 0,
    //         cards: [],
    //         discarded: [],
    //       },
    //     }),
    //     {}
    //   );

    // const shuffleDiscarded = (deckId: string) => {
    //   decks[deckId].cards.push(...decks[deckId].discarded.splice(0));
    //   decks[deckId].cards = _.shuffle(decks[deckId].cards);
    // };

    const piecesForPlayerCounts: PiecesForPlayerCounts = getPiecesForPlayerCounts(
      game
    );

    let gameState: GameState = {
      game,
      hostId,
      gameId,
      players: [],
      chat: [],
      hands: {},
      clients: {},
      decks: [],
      shuffled: {},
      discarded: {},
      board: [],
      pieces: {},
      // pieces,
      prompts: {},
    };

    // const players: Players = {};
    // const gameState: GameClientState = {
    //   peer,
    //   hostId,
    //   gameId,
    //   pieces,
    //   board: [],
    // };
    const clients: GamePeerDataConnection[] = [];
    const prompts: {
      [promptId: string]: {
        players: string[];
        prompt: GamePrompt;
        answers: {
          [playerId: string]: GamePromptAnswer[];
        };
      };
    } = {};
    const sendToRoom = (event: GameEvent) => {
      clients.forEach(client => client.send(event));
    };

    // const getCardsForDeck = (deckId: string) =>
    //   Object.values(pieces).filter(p => p.deckId === deckId);

    // const updateDeckCount = (deckId: string) => {
    //   const count = decks[deckId].cards.length;
    //   const piece = pieces[deckId];
    //   if (!piece) {
    //     return;
    //   }
    //   piece.count = count;
    //   piece.total = getCardsForDeck(piece.id).length;
    //   piece.delta++;

    //   sendToRoom({
    //     event: 'update_piece',
    //     pieces: {
    //       [piece.id]: piece,
    //     },
    //   });
    // };

    // const sendHandCounts = () => {
    //   sendToRoom({
    //     event: 'hand_count',
    //     counts: Object.entries(players).reduce(
    //       (counts, [playerId, player]: [string, Player]) => ({
    //         ...counts,
    //         [playerId]: player.hand.length,
    //       }),
    //       {}
    //     ),
    //   });
    // };

    // const updatePlayerCount = () => {
    //   // TODO
    //   const playerCount = 1; // Object.keys(players).length;

    //   for (let pieceId in pieces) {
    //     const piece = pieces[pieceId];
    //     if (
    //       piecesForPlayerCounts[pieceId] ||
    //       piecesForPlayerCounts[piece.parentId]
    //     ) {
    //       delete pieces[pieceId];
    //     }
    //   }

    //   pieces = {
    //     ...pieces,
    //     ...Object.entries(piecesForPlayerCounts).reduce((agg, [id, counts]) => {
    //       const piece = game.config.pieces[id];
    //       const offset = {
    //         x: ((piece as any).width || (piece as any).radius * 2) * 1.2,
    //         y: ((piece as any).height || (piece as any).radius * 2) * 1.2,
    //       };
    //       const ret: Pieces = { ...agg };

    //       for (let i = 0; i < counts[playerCount]; i++) {
    //         const copy = {
    //           ...piece,
    //           x: piece.x + (i % 10) * offset.x,
    //           y: piece.y + Math.floor(i / 10) * offset.y,
    //           id: slug.nice(),
    //           parentId: id,
    //           delta: 0,
    //         };
    //         ret[copy.id] = copy as any;
    //       }

    //       return ret;
    //     }, {}),
    //   };

    //   Object.values(decks).forEach(deck => {
    //     deck.cards = _.shuffle(getCardsForDeck(deck.id).map(c => c.id));
    //     updateDeckCount(deck.id);
    //   });

    //   gameState.board = Object.values(pieces)
    //     .filter(piece => piece.type !== 'card')
    //     .map(p => p.id);

    //   sendToRoom({
    //     pieces,
    //     board: gameState.board,
    //     event: 'player_join',
    //   });
    // };

    // curGame = gameState;
    // console.log(`Started Game: ${hostId}_${gameId}`);
    cb({
      ...gameState,
      peer,
    });

    peer.on('connection', (conn: GamePeerDataConnection) => {
      const { playerId, name, spectator } = conn.metadata;
      let playerCount;
      let player: Player;

      clients.push(conn);

      // TODO
      // if (!spectator) {
      //   playerCount = Object.keys(players).length + 1;
      //   player = players[playerId] || {
      //     conn,
      //     name: name || `Player ${playerCount}`,
      //     hand: [],
      //   };
      //   players[playerId] = player;
      // }

      conn.on('open', () => {
        // let playArea: PlayerPiece;
        if (!spectator) {
          // TODO
          // const playAreaId = scenario.players[0]; //_.size(players) - 1];
          // playArea = pieces[playAreaId] as PlayerPiece;
          // playArea.playerId = playerId;
          // playArea.delta++;
          // playArea.name = player.name;
          // pieces[playArea.id] = playArea;
          // updatePlayerCount();

          // TODO
          const newState = proccessEvent(
            gameState,
            {
              name,
              playerId,
              event: 'player_connect',
              spectator: !!spectator,
              piecesForPlayerCounts: piecesForPlayerCounts,
            },
            playerId
          );
          const events = getClientEvents(gameState, newState);
          events.room.forEach(event => {
            if (event.event !== 'add_to_board') {
              sendToRoom(event);
            }
          });
          // Re-Send Board
          sendToRoom({
            event: 'set_board_event',
            board: newState.board,
          });
          gameState = newState;
        }

        const syncConfig = { ...game };
        delete syncConfig.loadAssets;
        delete syncConfig.store;

        try {
          conn.send({
            chat,
            event: 'join',
            game: syncConfig,
            assets: sendAssets ? assets : Object.keys(assets),
            hand: [],
            // hand: spectator ? [] : player.hand,
            // TODO remove
            player: {
              name: 'x',
            },
            // player: {
            //   name: spectator ? 'spectator' : player.name,
            // },
          });
        } catch (err) {
          console.error(err);
        }

        // TODO
        // if (spectator) {
        //   conn.send({
        //     pieces,
        //     board: gameState.board,
        //     event: 'player_join',
        //   });
        // } else {
        //   // sendHandCounts();
        //   sendToRoom({
        //     event: 'update_piece',
        //     pieces: {
        //       [playArea!.id]: playArea!,
        //     },
        //   });
        // }

        conn.on('data', (data: ClientEvent) => {
          if (data.event === 'request_asset') {
            const { asset } = data;
            conn.send({
              event: 'asset_loaded',
              asset: {
                [asset]: assets[asset],
              },
            });
            return;
          }

          const prevState = gameState;
          const newState = proccessEvent(prevState, data, playerId);
          const events = getClientEvents(prevState, newState);
          gameState = newState;
          events.room.forEach(sendToRoom);
        });

        conn.on('error', err => {
          console.log(err);
        });
      });
    });
  });
}

// switch (data.event) {
//   case 'request_asset':
//     try {
//       const { asset } = data;
//       conn.send({
//         event: 'asset_loaded',
//         asset: {
//           [asset]: assets[asset],
//         },
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'chat':
//     try {
//       chat.push(data);
//       sendToRoom(data);
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'transaction':
//     try {
//       const { amount } = data;
//       const { from, to } = data.transaction;
//       const fromPiece = pieces[from.id];
//       let moneyTemplate = (fromPiece.type === 'money'
//         ? fromPiece
//         : {
//             ...Object.values(pieces).find(p => p.type === 'money'),
//             x: 0, // TODO
//             y: 0, // TODO
//           }) as MoneyTokenPiece;

//       if (fromPiece.balance < amount) {
//         console.error('Insufficient Funds');
//         return;
//       }

//       const toPiece: MoneyTokenPiece | PlayerPiece = to.id
//         ? (pieces[to.id] as MoneyTokenPiece | PlayerPiece)
//         : {
//             ...moneyTemplate,
//             id: slug.nice(),
//             x: moneyTemplate.x + moneyTemplate.width + 40,
//             balance: 0,
//             delta: 0,
//           };

//       if (!toPiece) {
//         console.error('Unknown Recipient');
//         return;
//       }

//       fromPiece.balance -= amount;
//       fromPiece.delta++;
//       toPiece.balance = (toPiece.balance || 0) + amount;
//       toPiece.delta++;

//       if (
//         fromPiece.balance === 0 &&
//         Object.values(pieces).find(
//           p => p.type === 'money' && p.id !== fromPiece.id
//         )
//       ) {
//         fromPiece.type = 'deleted';
//         sendToRoom({
//           event: 'remove_from_board',
//           ids: [fromPiece.id],
//         });
//       }

//       sendToRoom({
//         event: 'update_piece',
//         pieces: {
//           [fromPiece.id]: fromPiece,
//           [toPiece.id]: toPiece,
//         },
//       });

//       if (!to.id) {
//         sendToRoom({
//           event: 'add_to_board',
//           pieces: [toPiece.id],
//         });
//         pieces[toPiece.id] = toPiece;
//       }
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'roll_dice':
//     try {
//       const { dice, hidden } = data;
//       const dicePieces: DicePiece[] = Object.entries(dice)
//         .filter(([faces, count]) => count > 0)
//         .reduce((agg, [faces, count], setIndex) => {
//           const d: DicePiece[] = [...Array(count)].map(
//             (x, index) => ({
//               hidden,
//               id: slug.nice(),
//               type: 'die',
//               faces: parseInt(faces, 10),
//               value: _.random(1, parseInt(faces, 10)),
//               delta: 0,
//               x: playArea.x + index * 150,
//               y: playArea.y + 50 + setIndex * 150,
//               layer: 6,
//             })
//           );
//           return [...agg, ...d];
//         }, [] as DicePiece[]);
//       const diceById = (_.keyBy(
//         dicePieces,
//         'id'
//       ) as unknown) as Pieces;

//       conn.send({
//         event: 'set_dice',
//         diceIds: Object.keys(diceById),
//       });

//       const send = hidden ? conn.send : sendToRoom;
//       send({
//         event: 'update_piece',
//         pieces: diceById,
//       });
//       send({
//         event: 'add_to_board',
//         pieces: Object.keys(diceById),
//       });

//       if (hidden) {
//         hiddenPieces = {
//           ...hiddenPieces,
//           ...diceById,
//         };
//       } else {
//         pieces = {
//           ...pieces,
//           ...diceById,
//         };
//         gameState.board.push(...Object.keys(diceById));
//       }
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   // TODO
//   // case 'reveal_pieces':
//   //   try {
//   //     const { pieceIds } = data;

//   //     // TODO
//   //   } catch (err) {
//   //     console.log(err);
//   //   }
//   //   break;

//   case 'peek_at_card':
//     try {
//       const { cardIds, peeking } = data;
//       const cards = cardIds.map(cardId => {
//         const card = pieces[cardId];
//         card.peeking = peeking
//           ? [...(card.peeking || []), playerId]
//           : (card.peeking || []).filter(
//               (id: string) => id !== playerId
//             );
//         card.delta++;
//         return card;
//       });

//       sendToRoom({
//         event: 'update_piece',
//         pieces: _.keyBy(cards, 'id') as any,
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'peek_at_deck':
//     try {
//       const { deckId, peeking } = data;
//       if (peeking) {
//         conn.send({
//           event: 'deck_peek_results',
//           cardIds: _.shuffle(decks[deckId].cards),
//           discardedCardIds: _.shuffle(decks[deckId].discarded),
//         });
//       } else {
//         conn.send({
//           event: 'deck_peek_results',
//           cardIds: [],
//           discardedCardIds: [],
//         });
//       }
//       // sendToRoom({
//       //   deckId,
//       //   playerId,
//       //   peeking,
//       //   event: 'deck_peek',
//       // });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'take_cards':
//     try {
//       const { deckId, cardIds } = data;
//       const deck = decks[deckId];
//       const ids = [
//         ...cardIds.filter(id => deck.cards.includes(id)),
//         ...cardIds.filter(id => deck.discarded.includes(id)),
//       ];
//       players[playerId].hand.push(...ids);
//       deck.cards = deck.cards.filter(id => !cardIds.includes(id));
//       deck.discarded = deck.discarded.filter(
//         id => !cardIds.includes(id)
//       );
//       conn.send({
//         event: 'set_hand',
//         hand: player.hand,
//       });
//       sendHandCounts();
//       updateDeckCount(deckId);
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'remove_cards':
//     try {
//       const { deckId, cardIds } = data;
//       const deck = decks[deckId];
//       deck.cards = deck.cards.filter(id => !cardIds.includes(id));
//       deck.discarded = deck.discarded.filter(
//         id => !cardIds.includes(id)
//       );
//       updateDeckCount(deckId);
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'draw_cards':
//     try {
//       const { deckId, count } = data;
//       console.log(`Player ${playerId} drew ${count} cards`);
//       const remainingDrawCount = count - decks[deckId].cards.length;
//       players[playerId].hand.push(
//         ...decks[deckId].cards.splice(0, count)
//       );

//       if (remainingDrawCount > 0) {
//         shuffleDiscarded(deckId);
//         players[playerId].hand.push(
//           ...decks[deckId].cards.splice(0, remainingDrawCount)
//         );
//       }

//       conn.send({
//         event: 'set_hand',
//         hand: player.hand,
//       });
//       sendHandCounts();
//       updateDeckCount(deckId);
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'draw_cards_to_table':
//     try {
//       const { deckId, count, faceDown } = data;
//       const deckPiece = pieces[deckId];
//       const remainingDrawCount = count - decks[deckId].cards.length;
//       const cardIds = decks[deckId].cards.splice(0, count);

//       if (remainingDrawCount > 0) {
//         shuffleDiscarded(deckId);
//         cardIds.push(
//           ...decks[deckId].cards.splice(0, remainingDrawCount)
//         );
//       }

//       gameState.board.push(...cardIds);

//       const p = cardIds
//         .map((id, index) => ({
//           ...pieces[id],
//           faceDown,
//           x: deckPiece.x + deckPiece.width + 50 + index * 40,
//           y: deckPiece.y,
//           width: deckPiece.width,
//           height: deckPiece.height,
//           delta: pieces[id].delta + 1,
//         }))
//         .reduce(
//           (agg, piece) => ({
//             ...agg,
//             [(piece as RenderPiece).id]: piece,
//           }),
//           {}
//         );
//       pieces = {
//         ...pieces,
//         ...p,
//       };
//       sendToRoom({
//         event: 'update_piece',
//         pieces: p,
//       });
//       sendToRoom({
//         event: 'add_to_board',
//         pieces: cardIds,
//       });
//       updateDeckCount(deckId);
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'update_piece':
//     try {
//       const { pieces: p } = data;
//       pieces = {
//         ...pieces,
//         ...p,
//       };
//       Object.values(p).forEach(piece => {
//         if (playArea.id === piece.id) {
//           playArea = piece as PlayerPiece;
//         }
//       });
//       sendToRoom({
//         event: 'update_piece',
//         pieces: p,
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'prompt_players':
//     try {
//       const prompt = { ...data.prompt, id: slug.nice() };
//       prompts[prompt.id] = {
//         prompt,
//         answers: {},
//         players: data.players,
//       };
//       sendToRoom({
//         ...data,
//         prompt,
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'prompt_submission':
//     try {
//       const { answers, promptId } = data;
//       const prompt = prompts[promptId];

//       if (answers) {
//         prompt.answers[playerId] = answers;
//       } else {
//         delete prompt.answers[playerId];
//       }

//       if (prompt.players.every(id => prompt.answers[id])) {
//         sendToRoom({
//           promptId,
//           results: prompt.answers,
//           event: 'prompt_results',
//         });
//       } else {
//         sendToRoom({
//           promptId,
//           results: Object.keys(prompt.answers).reduce(
//             (agg, id) => ({ ...agg, [id]: true }),
//             {}
//           ),
//           event: 'prompt_results',
//         });
//       }
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'create_stack': {
//     try {
//       const { ids } = data;
//       const top = pieces[ids.slice(-1)[0]];
//       const bottom = pieces[ids[0]];
//       const stack: StackPiece = {
//         ...top,
//         x: bottom.x,
//         y: bottom.y,
//         id: slug.nice(),
//         type: 'stack',
//         pieces: [
//           ...(bottom.pieces || [bottom.id]),
//           ...(top.pieces || [top.id]),
//         ],
//         counts: null,
//         delta: 0,
//       };
//       pieces[stack.id] = stack;
//       gameState.board = gameState.board.filter(i => !ids.includes(i));
//       gameState.board.push(stack.id);
//       sendToRoom({
//         ids,
//         event: 'remove_from_board',
//       });
//       sendToRoom({
//         event: 'update_piece',
//         pieces: {
//           [stack.id]: stack,
//         },
//       });
//       sendToRoom({
//         pieces: [stack.id],
//         event: 'add_to_board',
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;
//   }

//   case 'split_stack': {
//     try {
//       const { id, count } = data;
//       const stack = pieces[id];
//       const bottom = stack.pieces.slice(0, count - 1);
//       const top = stack.pieces.slice(count - 1);

//       const piecesToRemove: string[] = [];
//       const piecesToAdd: string[] = [];
//       const updatedPieces: Pieces = {};

//       if (!top.length) {
//         return;
//       }

//       if (bottom.length === 1) {
//         const [bottomId] = bottom;
//         const bottomPiece = pieces[bottomId];
//         piecesToRemove.push(stack.id);
//         piecesToAdd.push(bottomId);

//         bottomPiece.x = stack.x;
//         bottomPiece.y = stack.y;
//         bottomPiece.delta++;
//         updatedPieces[bottomId] = bottomPiece;
//       } else {
//         stack.pieces = bottom;
//         stack.delta++;
//         updatedPieces[stack.id] = stack;
//       }

//       if (top.length === 1) {
//         const [topId] = top;
//         const topPiece = pieces[topId];
//         piecesToAdd.push(topId);

//         topPiece.x =
//           stack.x + (topPiece.width || topPiece.radius * 2) + 20;
//         topPiece.y = stack.y;
//         topPiece.delta++;
//         updatedPieces[topId] = topPiece;
//       } else {
//         const topStack: StackPiece = {
//           ...pieces[top[0]],
//           id: slug.nice(),
//           type: 'stack',
//           pieces: top,
//           counts: null,
//           delta: 0,
//           x: stack.x + (stack.width || stack.radius * 2) + 20,
//           y: stack.y + 50,
//         };
//         pieces[topStack.id] = topStack;
//         updatedPieces[topStack.id] = topStack;
//         piecesToAdd.push(topStack.id);
//       }

//       sendToRoom({
//         event: 'update_piece',
//         pieces: updatedPieces,
//       });
//       sendToRoom({
//         event: 'remove_from_board',
//         ids: piecesToRemove,
//       });
//       sendToRoom({
//         event: 'add_to_board',
//         pieces: piecesToAdd,
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;
//   }

//   case 'pick_up_cards':
//     try {
//       const { cardIds } = data;
//       gameState.board = gameState.board.filter(
//         pieceId => !cardIds.includes(pieceId)
//       );
//       player.hand.push(...cardIds);
//       conn.send({
//         event: 'set_hand',
//         hand: player.hand,
//       });
//       sendToRoom({
//         event: 'remove_from_board',
//         ids: cardIds,
//       });
//       sendHandCounts();
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'pass_cards':
//     try {
//       const { cardIds, playerId: receivingPlayerId } = data;
//       const receivingPlayer = players[receivingPlayerId];
//       player.hand = player.hand.filter(id => !cardIds.includes(id));
//       receivingPlayer.hand.push(...cardIds);
//       receivingPlayer.conn.send({
//         event: 'set_hand',
//         hand: receivingPlayer.hand,
//       });
//       conn.send({
//         event: 'set_hand',
//         hand: player.hand,
//       });
//       sendHandCounts();
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'rename_player':
//     try {
//       const { name } = data;
//       player.name = name;
//       playArea.name = name;
//       playArea.delta++;
//       sendToRoom({
//         event: 'update_piece',
//         pieces: {
//           [playArea.id]: playArea,
//         },
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'play_cards':
//     try {
//       const { cardIds, faceDown } = data;
//       const cards = player.hand
//         .filter(id => cardIds.includes(id))
//         .map((cardId, index) => {
//           const card = pieces[cardId] as CardPiece;
//           const deck = pieces[card.deckId];

//           return {
//             ...pieces[cardId],
//             faceDown,
//             x: playArea.x + index * 40,
//             y: playArea.y + 50,
//             width: deck.width,
//             height: deck.height,
//             delta: card.delta + 1,
//           };
//         }) as RenderPiece[];
//       pieces = {
//         ...pieces,
//         ..._.keyBy(cards, 'id'),
//       };
//       player.hand = player.hand.filter(id => !cardIds.includes(id));
//       gameState.board.push(...cardIds);
//       conn.send({
//         event: 'set_hand',
//         hand: player.hand,
//       });
//       sendToRoom({
//         event: 'update_piece',
//         pieces: _.keyBy(cards, 'id'),
//       });
//       sendToRoom({
//         event: 'add_to_board',
//         pieces: cardIds,
//       });
//       sendHandCounts();
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'discard':
//     try {
//       const { cardIds } = data;
//       player.hand = player.hand.filter(id => !cardIds.includes(id));
//       cardIds.forEach(id => {
//         const card = pieces[id] as Card;
//         if (decks[card.deckId]) {
//           gameState.board = gameState.board.filter(
//             pieceId => pieceId !== id
//           );
//           decks[card.deckId].discarded.push(id);
//         }
//       });
//       conn.send({
//         event: 'set_hand',
//         hand: player.hand,
//       });
//       sendToRoom({
//         event: 'remove_from_board',
//         ids: cardIds,
//       });
//       sendHandCounts();
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'discard_played':
//     try {
//       const { deckId } = data;
//       const cardIds = gameState.board
//         .map(id => pieces[id])
//         .filter(p => p.type === 'card' && p.deckId === deckId)
//         .map(c => c.id);
//       decks[deckId].discarded.push(...cardIds);
//       gameState.board = gameState.board.filter(pieceId =>
//         cardIds.includes(pieceId)
//       );
//       sendToRoom({
//         event: 'remove_from_board',
//         ids: cardIds,
//       });
//     } catch (err) {
//       console.log(err);
//     }
//     break;

//   case 'shuffle_discarded':
//     try {
//       const { deckId } = data;
//       shuffleDiscarded(deckId);
//       updateDeckCount(deckId);
//     } catch (err) {
//       console.log(err);
//     }
//     break;
// }
