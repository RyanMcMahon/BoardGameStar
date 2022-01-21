import * as _ from 'lodash';
import { doc, writeBatch } from 'firebase/firestore';

import { seed, shuffle } from './rng';

import {
  AnyPieceOption,
  ClientEvent,
  DeckOption,
  DeckPiece,
  Game,
  GameConfig,
  GameStateEvent,
  Piece,
  RenderPiece,
} from '../types';
import { db, withTransaction } from './api';
import { update } from 'lodash';
import { useEffect, useState } from 'react';

export function useGameState(
  game: Game | null,
  hostId: string,
  gameId: string
) {
  const [gameState, setGameState] = useState<GameState>();

  useEffect(() => {
    const startGame = async () => {
      if (!game) {
        return;
      }

      const gs = new GameState(game, hostId, gameId);
      // TODO if host
      if (true) {
        gs.startGame('123');
      }
      setGameState(gs);
    };

    startGame();
  }, [game, hostId, gameId]);

  return gameState;
}

export class GameState {
  gamePath: string;
  pieces: { [id: string]: AnyPieceOption }; // TODO
  players: {
    [id: string]: {
      hand: string[];
      name: string;
    };
  };

  constructor(game: Game, host: string, id: string) {
    // TODO
    this.gamePath = `games/${game.id}/play/${host}/${id}`;
    this.pieces = game.config.pieces;
    this.players = {};
  }

  disconnect() {
    // TODO
  }

  async startGame(playerId: string) {
    // TODO create pieces
    debugger;
    const batch = writeBatch(db);
    Object.values(this.pieces).forEach((piece) => {
      // TODO auto-shuffle
      batch.set(doc(db, this.gamePath, piece.id), piece);
    });
    return batch.commit();
  }

  syncEvent(event: GameStateEvent) {
    seed(`${event.ts}`);

    switch (event.event) {
      case 'start_game':
        Object.values(this.pieces).forEach((piece) => {
          if (piece.type === 'deck' && piece.shuffleOnStart) {
            piece.shuffled = shuffle(piece.shuffled);
          }
        });
        break;

      case 'request_join_game':
        this.players[event.playerId] = {
          hand: [],
          name: event.name,
        };
        break;

      case 'draw_cards':
        const { playerId, deckId, count } = event;
        this.players[playerId].hand = [
          ...this.players[playerId].hand,
          ...(this.pieces[deckId] as DeckOption).shuffled.splice(0, count),
        ];
        break;
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
