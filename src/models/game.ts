export interface EditorConfig {
  name: string;
}

export interface PieceOption {
  id: string;
  x: number;
  y: number;
  rotation: number;
  layer: number;
  locked?: boolean;
  counts?: string;
  parentId?: string;
}

export interface RectPieceOption extends PieceOption {
  width: number;
  height: number;
}

export interface StackablePieceOption {
  stack?: string;
  pieces?: string[];
}

export interface ImagePieceOption extends RectPieceOption {
  image: string;
}

export interface BoardOption extends ImagePieceOption {
  type: 'board';
}

export interface CardOption extends ImagePieceOption {
  type: 'card';
  deckId: string;
  cardId: string;
  faceDown: boolean;
  // counts: string;
}

export interface DeckOption extends ImagePieceOption {
  type: 'deck';
  name: string;
  shuffled: string[];
  played: string[];
  discarded: string[];
  removed: string[];
  drawn: string[];
  shuffleOnStart: boolean;
}

export interface PlayerOption extends RectPieceOption {
  type: 'player';
  name: string;
  color: string;
  balance?: number;
}

export interface CircleTokenOption extends PieceOption, StackablePieceOption {
  type: 'circle';
  radius: number;
  color: string;
}

export interface ImageTokenOption
  extends ImagePieceOption,
    StackablePieceOption {
  type: 'image';
  back?: string;
  flipped?: boolean;
}

export interface MoneyTokenOption extends ImagePieceOption {
  type: 'money';
  balance: number;
}

export interface RectTokenOption extends RectPieceOption, StackablePieceOption {
  type: 'rect';
  color: string;
}

export type AnyPieceOption =
  | BoardOption
  | CardOption
  | DeckOption
  | PlayerOption
  | CircleTokenOption
  | ImageTokenOption
  | MoneyTokenOption
  | RectTokenOption;

export interface Piece {
  delta: number;
  [key: string]: any;
}
export type BoardPiece = BoardOption & Piece;
export type CircleTokenPiece = CircleTokenOption & Piece;
export type ImageTokenPiece = ImageTokenOption & Piece;
export type MoneyTokenPiece = MoneyTokenOption & Piece;
export type RectTokenPiece = RectTokenOption & Piece;

export interface StackPiece extends Piece {
  type: 'stack';
  pieces: string[];
  x: number;
  y: number;
}

export interface DicePiece extends Piece {
  id: string;
  type: 'die';
  faces: number;
  value: number;
  x: number;
  y: number;
  hidden: boolean;
  locked?: boolean;
  layer: number;
}

export interface CardPiece extends CardOption, Piece {
  peeking?: string[];
}

export interface DeckPiece extends DeckOption, Piece {
  count: number;
  total: number;
  peeking?: string[];
}

export interface DeletedPiece extends PieceOption, Piece {
  type: 'deleted';
}

export interface PlayerPiece extends PlayerOption, Piece {
  playerId?: string;
}

export interface Pieces {
  [id: string]: RenderPiece;
}

export type RenderPiece =
  | DicePiece
  | BoardPiece
  | CardPiece
  | DeckPiece
  | DeletedPiece
  | PlayerPiece
  | CircleTokenPiece
  | MoneyTokenPiece
  | ImageTokenPiece
  | StackPiece
  | RectTokenPiece;

export interface Card {
  id: string;
  deckId: string;
  image: string | undefined;
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  fn: () => void;
}

export interface Transaction {
  from: {
    name: string;
    id: string;
    max: number;
  };
  to: {
    name: string;
    id?: string;
  };
}
