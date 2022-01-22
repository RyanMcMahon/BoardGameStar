import slug from 'slugid';
import * as _ from 'lodash';
// import { doc, writeBatch } from 'firebase/firestore';
import {
  ref,
  set,
  onValue,
  serverTimestamp,
  push,
  query,
} from 'firebase/database';

import { seed, shuffle } from './rng';

import {
  AdmitJoinGameEvent,
  AnyPieceOption,
  Card,
  CardPiece,
  ClientEvent,
  DeckOption,
  DeckPiece,
  Game,
  GameConfig,
  GameStateEvent,
  Piece,
  Pieces,
  PlayerPiece,
  RenderPiece,
  RequestJoinGameEvent,
  StartGameEvent,
  UpdatePiecesGameEvent,
} from '../types';
import { db, realtimeDb, withTransaction } from './api';
import { update } from 'lodash';
import { useEffect, useState } from 'react';
import { getHostId, getPlayerId } from './identity';

export function useGameState(
  game: Game | null,
  hostId: string,
  gameId: string
) {
  const [gameState, setGameState] = useState<GameState>();
  const gamePath = `play/${hostId}/${gameId}`;
  const [dbRef] = useState(ref(realtimeDb, gamePath));
  const curHostId = getHostId();
  const curPlayerId = getPlayerId();

  const sendEvent = (event: GameStateEvent) => push(dbRef, event);

  useEffect(() => {
    const connect = async () => {
      if (!game) {
        return;
      }

      const gs = new GameState(game, hostId, gameId);

      onValue(dbRef, (snapshot) => {
        const values = snapshot.val() as GameStateEvent;
        const sorted = Object.values(values).sort((a, b) =>
          a.ts < b.ts ? 1 : -1
        );
        sorted.forEach((event) => gs.syncEvent(event));
      });

      // TODO fetch all events and check for start
      if (curHostId === hostId) {
        const startEvent: StartGameEvent = {
          id: slug.nice(),
          event: 'start_game',
          playerId: curPlayerId,
          ts: serverTimestamp(),
        };
        push(dbRef, startEvent);
      }

      const joinEvent: RequestJoinGameEvent = {
        id: curHostId,
        event: 'request_join_game',
        playerId: curPlayerId,
        name: 'Player',
        ts: serverTimestamp(),
      };
      push(dbRef, joinEvent);

      setGameState(gs);
    };

    connect();
  }, [game, hostId, gameId]);

  return {
    gameState,
    sendEvent,
  };
}

export class GameState {
  // gamePath: string;
  syncedEvents: { [id: string]: boolean } = {};
  pieces: Pieces; //{ [id: string]: Piece }; // TODO
  players: {
    [id: string]: {
      id: string;
      hand: string[];
      name: string;
      pieceId: string;
    };
  };

  constructor(game: Game, host: string, gameId: string) {
    const pieces = _.cloneDeep(game.config.pieces);
    Object.values(pieces).forEach((p) => ((p as any).delta = 0));
    this.pieces = pieces as any;
    this.players = {};
  }

  disconnect() {
    // TODO
  }

  // async startGame(playerId: string) {
  //   // TODO create pieces
  //   debugger;
  //   const batch = writeBatch(db);
  //   Object.values(this.pieces).forEach((piece) => {
  //     // TODO auto-shuffle
  //     batch.set(doc(db, this.gamePath, piece.id), piece);
  //   });
  //   return batch.commit();
  // }

  syncEvent(event: GameStateEvent) {
    if (this.syncedEvents[event.id]) {
      return;
    }

    seed(`${event.ts}`);

    this.syncedEvents[event.id] = true;

    switch (event.event) {
      case 'start_game': {
        Object.values(this.pieces).forEach((piece) => {
          if (piece.type === 'deck' && piece.shuffleOnStart) {
            piece.shuffled = shuffle(piece.shuffled);
          }
        });
        break;
      }

      case 'request_join_game': {
        const { playerId } = event;

        // Associate with player piece
        let assignedToPlayer = false;
        Object.values(this.pieces).forEach((piece) => {
          if (
            !assignedToPlayer &&
            piece.type === 'player' &&
            !(piece as PlayerPiece).playerId
          ) {
            this.players[playerId] = {
              id: playerId,
              hand: [],
              name: event.name,
              pieceId: piece.id,
            };
            piece.name = event.name;
            piece.playerId = playerId;
            assignedToPlayer = true;
          }
        });
        break;
      }

      case 'draw_cards': {
        const { playerId, deckId, count } = event;
        this.players[playerId].hand = [
          ...this.players[playerId].hand,
          ...(this.pieces[deckId] as DeckPiece).shuffled.splice(0, count),
        ];
        break;
      }

      case 'draw_cards_to_table': {
        const { deckId, count } = event;
        const deck = this.pieces[deckId] as DeckPiece;
        for (let i = 0; i < count; i++) {
          const cardId = deck.shuffled.shift();
          if (cardId) {
            deck.played.push(cardId);
            this.pieces[cardId].x = deck.x + (deck.width + 20) * (i + 1);
            this.pieces[cardId].y = deck.y;
          }
        }
        break;
      }

      case 'pick_up_cards': {
        const { playerId, ids } = event;
        const player = this.players[playerId];
        ids.forEach((id) => {
          const card = this.pieces[id] as CardPiece;
          const deck = this.pieces[card.deckId] as DeckPiece;
          deck.played = deck.played.filter((x) => x !== id);
          player.hand.push(id);
        });
        break;
      }

      case 'pass_cards': {
        // TODO
        break;
      }

      case 'play_cards': {
        const { playerId, ids } = event;
        const player = this.players[playerId];
        const playerPiece = this.pieces[player.pieceId];
        ids.forEach((id, index) => {
          const card = this.pieces[id] as CardPiece;
          const deck = this.pieces[card.deckId] as DeckPiece;
          card.x = playerPiece.x + (deck.width + 20) * index;
          card.y = playerPiece.y + 50;
          deck.played.push(id);
        });
        player.hand = player.hand.filter((id) => !ids.includes(id));
        break;
      }

      case 'discard_cards': {
        break;
      }

      case 'update_pieces': {
        const { pieces } = event;
        pieces.forEach((piece) => {
          this.pieces[piece.id] = {
            ...this.pieces[piece.id],
            ...piece,
          };
        });
        break;
      }

      default:
        console.warn(`Unknown Event`, event);
    }
  }

  // shuffle(deckId: string) {
  //   withTransaction(async (t) => {
  //     const deck = this.pieces[deckId];
  //     const deckRef = doc(db, `${this.gamePath}/${deck.id}`);
  //     const deckData = (await (await t.get(deckRef)).data()) as DeckPiece;
  //     const deckUpdate = {
  //       delta: deckData.delta + 1,
  //       shuffled: _.shuffle(deckData.shuffled),
  //     };
  //     this.pieces[deck.id] = {
  //       ...deck,
  //       ...update,
  //     };
  //     return t.update(deckRef, deckUpdate);
  //   });
  // }

  // drawCards(deckId: string, playerId: string, count: number) {
  //   withTransaction(async (t) => {
  //     const deck = this.pieces[deckId];
  //     const deckRef = doc(db, `${this.gamePath}/${deck.id}`);
  //     const deckData = (await (await t.get(deckRef)).data()) as DeckPiece;
  //     const cards = [];
  //     const deckUpdate = {
  //       delta: deckData.delta + 1,
  //       shuffled: _.shuffle(deckData.shuffled),
  //     };
  //     this.pieces[deck.id] = {
  //       ...deck,
  //       ...deckUpdate,
  //     };
  //     return t.update(deckRef, deckUpdate);
  //   });
  // }

  // updatePiece(id: string, update: Partial<RenderPiece>) {
  //   withTransaction(async (t) => {
  //     const piece = this.pieces[id] as RenderPiece;
  //     update.delta = piece.delta + 1;
  //     this.pieces[id] = {
  //       ...piece,
  //       ...update,
  //     };
  //     const pieceRef = doc(db, `${this.gamePath}/${id}`);
  //     let pieceData = (await (await t.get(pieceRef)).data()) as RenderPiece;
  //     update.delta = pieceData.delta;
  //     t.update(pieceRef, update);
  //   });
  // }
}
