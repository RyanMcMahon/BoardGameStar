import {
  AnyPieceOption,
  ClientEvent,
  GameConfig,
  GameStateEvent,
  Piece,
} from '../types';

export class GameState {
  pieces: { [id: string]: AnyPieceOption };

  constructor(game: GameConfig) {
    // TODO
    this.pieces = game.pieces;
  }

  connect(hostId: string, gameId: string) {
    // TODO
  }

  disconnect() {
    // TODO
  }

  syncEvent(event: GameStateEvent) {
    // TODO
  }
}
