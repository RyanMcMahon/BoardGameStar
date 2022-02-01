import slug from 'slugid';
import { Loader } from 'pixi.js';
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
  Assets,
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
import { db, downloadGame, realtimeDb, withTransaction } from './api';
import { update } from 'lodash';
import { useEffect, useState } from 'react';
import { getHostId, getPlayerId } from './identity';

export function useGameState(
  // game: Game | null,
  hostId: string,
  sessionId: string
) {
  const [gameState, setGameState] = useState<GameState>();
  const [game, setGame] = useState<Game | null>(null);
  const [assets, setAssets] = useState<Assets>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameId, setGameId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [unsyncedEvents, setUnsyncedEvents] = useState<GameStateEvent[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const gamePath = `play/${hostId}/${sessionId}`;
  const [dbRef] = useState(ref(realtimeDb, gamePath));
  const curHostId = getHostId();
  const curPlayerId = getPlayerId();

  const sendEvent = (event: GameStateEvent) => push(dbRef, event);

  useEffect(() => {
    const connect = async () => {
      const dbRef = ref(realtimeDb, gamePath);
      onValue(dbRef, (snapshot) => {
        const values = snapshot.val() as GameStateEvent[];
        const sorted = Object.values(values).sort((a, b) =>
          a.ts < b.ts ? -1 : 1
        );
        sorted.forEach(async (event) => {
          if (event.event === 'start_game') {
            setGameId(event.gameId);
          }
        });
        setUnsyncedEvents((e) => [...e, ...sorted]);
        setEventCount((c) => c + 1);
      });
    };
    connect();
  }, [hostId, sessionId]);

  useEffect(() => {
    if (!gameId || isLoaded || isLoading) {
      return;
    }
    setIsLoading(true);

    const load = async () => {
      const { game, loadedAssets } = await downloadGame(gameId, () => {});

      const cardCopies: { [id: string]: AnyPieceOption } = {};
      Object.values(game.config.pieces).forEach((piece) => {
        if (piece.type === 'card') {
          const deck = game.config.pieces[piece.deckId] as DeckOption;
          // TODO do in editor?
          piece.width = deck.width;
          piece.height = deck.height;

          for (let i = 1; i < parseInt(piece.counts || '1', 10); i++) {
            const newId = `${piece.id}_${i}`;
            // TODO unshuffled deck
            deck.shuffled.push(newId);
            cardCopies[newId] = {
              ...piece,
              id: newId,
            };
          }
        }
      });
      game.config.pieces = {
        ...game.config.pieces,
        ...cardCopies,
      };

      Loader.shared.reset();
      for (let name in loadedAssets) {
        Loader.shared.add(name, loadedAssets[name]);
      }

      Loader.shared.load(() => {
        const gs = new GameState(game, hostId, sessionId);

        const joinEvent: RequestJoinGameEvent = {
          id: curHostId,
          event: 'request_join_game',
          playerId: curPlayerId,
          name: 'Player',
          ts: serverTimestamp(),
        };
        push(dbRef, joinEvent);

        setAssets(loadedAssets);
        setGameState(gs);
        setGame(game);
        setIsLoaded(true);
      });
    };
    load();
  }, [gameId, isLoaded, isLoading]);

  useEffect(() => {
    if (!gameState) {
      return;
    }
    unsyncedEvents.forEach((event) => gameState.syncEvent(event));
  }, [unsyncedEvents, gameState]);

  return {
    assets,
    game,
    isLoaded,
    eventCount,
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
