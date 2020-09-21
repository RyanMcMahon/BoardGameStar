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
  PromptPlayersEvent,
} from '../types';

import { getHostId, getGameId, getInstanceId } from './identity';
import { createPeer } from './peer';
import { stat } from 'fs';
import { send } from 'process';
import { Prompt } from 'react-router-dom';

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
  prompts: {
    [index: string]: {
      prompt: GamePrompt;
      answers: any;
      players: string[];
    };
  };
}

export interface SaveGame {
  gameId: string;
  gameState: GameState;
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

const saveGameDebounced = _.debounce(saveGame, 500);
function saveGame(saveGame: SaveGame) {
  localStorage.setItem('gameState', JSON.stringify(saveGame));
}

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

      if (state.players.includes(playerId)) {
        return state;
      }

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

      curScenario.players.forEach(id => {
        if (state.pieces[id]) {
          pieces[id] = {
            ...state.pieces[id],
            hand: [],
            balance: 0,
            delta: state.pieces[id].delta + 1,
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
      const newState: GameState = {
        ...state,
        shuffled: {
          ...state.shuffled,
          [deckId]: [...state.shuffled[deckId], ...state.discarded[deckId]],
        },
        discarded: {
          ...state.discarded,
          [deckId]: [],
        },
        pieces: {
          ...state.pieces,
          [deckId]: {
            ...state.pieces[deckId],
          },
        },
      };
      newState.pieces[deckId].count = newState.shuffled[deckId].length;
      newState.pieces[deckId].delta++;

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

      if (!state.board.includes(toPiece.id)) {
        newState.board = [...newState.board, toPiece.id];
      }

      newState.pieces = {
        ...state.pieces,
        [fromPiece.id]: fromPiece,
        [toPiece.id]: toPiece,
      };

      return newState;
    }

    case 'prompt_players': {
      const prompt = { ...event.prompt, id: slug.nice() };
      return {
        ...state,
        prompts: {
          ...state.prompts,
          [prompt.id]: {
            prompt,
            answers: {},
            players: event.players,
          },
        },
      };
    }

    case 'prompt_submission': {
      const { promptId, answers } = event;
      const prompt = {
        ...state.prompts[promptId],
      };
      prompt.answers = { ...prompt.answers };

      if (answers) {
        prompt.answers[playerId] = answers;
      } else {
        delete prompt.answers[playerId];
      }

      return {
        ...state,
        prompts: {
          ...state.prompts,
          [promptId]: {
            ...prompt,
          },
        },
      };
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
        board: [...state.board, ...Object.keys(diceById)],
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
          ...state.shuffled,
          [deckId]: shuffled,
        },
        discarded: {
          ...state.discarded,
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
          ...state.shuffled,
          [deckId]: shuffled,
        },
        discarded: {
          ...state.discarded,
          [deckId]: discarded,
        },
      };
    }

    case 'pick_up_cards': {
      const { cardIds } = event;
      const playArea = Object.values(state.pieces).find(
        p => p.playerId === playerId
      ) as PlayerPiece;

      if (!playArea) {
        return state;
      }

      return {
        ...state,
        board: state.board.filter(pieceId => !cardIds.includes(pieceId)),
        pieces: {
          ...state.pieces,
          [playArea.id]: {
            ...playArea,
            hand: [...playArea.hand, ...cardIds],
            delta: playArea.delta + 1,
          },
        },
      };
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
      const sendingPlayer = Object.values(state.pieces).find(
        p => p.playerId === playerId
      ) as PlayerPiece;
      const receivingPlayer = Object.values(state.pieces).find(
        p => p.playerId === receivingPlayerId
      ) as PlayerPiece;
      if (!sendingPlayer || !receivingPlayer) {
        return state;
      }
      return {
        ...state,
        pieces: {
          ...state.pieces,
          [sendingPlayer.id]: {
            ...sendingPlayer,
            hand: sendingPlayer.hand.filter(id => !cardIds.includes(id)),
            delta: sendingPlayer.delta + 1,
          },
          [receivingPlayer.id]: {
            ...receivingPlayer,
            hand: [...receivingPlayer.hand, ...cardIds],
            delta: receivingPlayer.delta + 1,
          },
        },
      };
    }

    case 'discard': {
      const playArea = Object.values(state.pieces).find(
        p => p.playerId === playerId
      );
      if (!playArea) {
        return state;
      }

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
        discarded,
        board: state.board.filter(id => !cardIds.includes(id)),
        pieces: {
          ...state.pieces,
          [playArea.id]: {
            ...playArea,
            hand: playArea.hand.filter((id: string) => !cardIds.includes(id)),
            delta: playArea.delta + 1,
          },
        },
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
          ...state.discarded,
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

    case 'peek_at_card': {
      const { cardIds, peeking } = event;
      const cards = cardIds.map(cardId => {
        const card = { ...state.pieces[cardId] };
        card.peeking = (card.peeking || []).filter(
          (id: string) => id !== playerId
        );

        if (peeking) {
          card.peeking.push(playerId);
        }
        card.delta++;
        return card;
      });

      return {
        ...state,
        pieces: {
          ...state.pieces,
          ..._.keyBy(cards, 'id'),
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
  const updatedPrompts = new Set<string>();

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
  }

  if (added.prompts) {
    for (let id in added.prompts) {
      if (!prevState.prompts[id]) {
        events.room.push({
          prompt: added.prompts[id].prompt,
          players: added.prompts[id].players,
          event: 'prompt_players',
        });
      } else {
        updatedPrompts.add(id);
      }
    }
  }

  if (deleted.prompts) {
    for (let id in deleted.prompts) {
      if (deleted.prompts[id].answers) {
        updatedPrompts.add(id);
      }
    }
  }

  updatedPrompts.forEach(promptId => {
    const prompt = state.prompts[promptId];
    if (prompt.players.every(id => prompt.answers[id])) {
      events.room.push({
        promptId,
        results: prompt.answers,
        event: 'prompt_results',
      });
    } else {
      events.room.push({
        promptId,
        results: Object.keys(prompt.answers).reduce(
          (agg, id) => ({ ...agg, [id]: true }),
          {}
        ),
        event: 'prompt_results',
      });
    }
  });

  // deleted
  // TODO

  // Updated
  if (updated.pieces) {
    for (let id in updated.pieces) {
      updatedPieces.add(id);
    }
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

  if (added.board || updated.board || deleted.board) {
    events.room.push({
      event: 'set_board_event',
      board: state.board,
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
  createGameConn({
    hostId,
    gameId,
    game,
    options,
    cb,
    initialState: {
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
      prompts: {},
    },
  });
}

export async function createGameConn({
  gameId,
  hostId,
  game,
  initialState,
  options,
  cb,
}: {
  gameId: string;
  hostId: string;
  game: Game;
  initialState: GameState;
  options: GameOptions;
  cb: (gameState: GameClientState) => void;
}) {
  const { assets, sendAssets } = options;
  let gameState: GameState = initialState;

  const peer = await createPeer(getInstanceId(gameId, hostId));

  peer.on('open', () => {
    const chat: ChatEvent[] = [];
    const piecesForPlayerCounts: PiecesForPlayerCounts = getPiecesForPlayerCounts(
      game
    );

    const clients: GamePeerDataConnection[] = [];
    const sendToRoom = (event: GameEvent) => {
      clients.forEach(client => client.send(event));
    };

    // console.log(`Started Game: ${hostId}_${gameId}`);
    cb({
      ...gameState,
      peer,
    });

    peer.on('connection', (conn: GamePeerDataConnection) => {
      const { playerId, name, spectator } = conn.metadata;
      clients.push(conn);

      conn.on('open', () => {
        if (!spectator) {
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
          gameState = newState;
        }

        // Resend Everything
        sendToRoom({
          event: 'update_piece',
          pieces: gameState.pieces,
        });
        sendToRoom({
          event: 'set_board_event',
          board: gameState.board,
        });

        const syncConfig = { ...game };
        delete syncConfig.loadAssets;
        delete syncConfig.store;

        try {
          conn.send({
            chat,
            event: 'join',
            game: syncConfig,
            assets: sendAssets ? assets : Object.keys(assets),
            // TODO remove
            hand: [],
            player: {
              name: 'x',
            },
          });
        } catch (err) {
          console.error(err);
        }

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
          saveGameDebounced({
            gameId,
            gameState,
          });
        });

        conn.on('error', err => {
          console.log(err);
        });
      });
    });
  });
}
