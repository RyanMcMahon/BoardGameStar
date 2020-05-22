export interface Assets {
  [key: string]: string;
}

export interface EditorConfig {
  gameName: string;
}

export interface ScenarioOption {
  id: string;
  name: string;
  pieces: string[];
  players: string[];
}

export interface PieceOption {
  id: string;
  x: number;
  y: number;
  rotation: number;
  layer: number;
}

export interface RectPieceOption extends PieceOption {
  width: number;
  height: number;
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
  faceDown: boolean;
}

export interface DeckOption extends ImagePieceOption {
  type: 'deck';
  name: string;
  cards: (CardOption | string)[];
}

export interface PlayerOption extends RectPieceOption {
  type: 'player';
  name: string;
  color: string;
}

export interface CircleTokenOption extends PieceOption {
  type: 'circle';
  radius: number;
  color: string;
}

export interface ImageTokenOption extends ImagePieceOption {
  type: 'image';
}

export interface RectTokenOption extends RectPieceOption {
  type: 'rect';
  color: string;
}

export type AnyPiece =
  | BoardOption
  | CardOption
  | DeckOption
  | PlayerOption
  | CircleTokenOption
  | ImageTokenOption
  | RectTokenOption;

export interface EditorState {
  gameName: string;
  curScenario: string;
  scenarios: {
    [id: string]: ScenarioOption;
  };
  pieces: {
    [id: string]: AnyPiece;
  };
}
export type GameConfig = EditorState;

export interface CreateGameAction {
  type: 'create_game';
  editorConfig: EditorConfig;
}

export interface SetCurScenarioAction {
  type: 'set_cur_scenario';
  scenarioId: string;
}

export interface AddScenarioAction {
  type: 'add_scenario';
  scenario: ScenarioOption;
}

export interface DuplicateScenarioAction {
  type: 'duplicate_scenario';
  scenarioId: string;
}

export interface UpdateScenarioAction {
  type: 'update_scenario';
  scenario: ScenarioOption;
}

export interface RemoveScenarioAction {
  type: 'remove_scenario';
  scenarioId: string;
}

export interface UpdateGameNameAction {
  type: 'update_game_name';
  gameName: string;
}

export interface AddPieceAction {
  type: 'add_piece';
  piece:
    | BoardOption
    | CardOption
    | DeckOption
    | PlayerOption
    | CircleTokenOption
    | ImageTokenOption
    | RectTokenOption;
}

export interface UpdatePieceAction {
  type: 'update_piece';
  piece:
    | BoardOption
    | CardOption
    | DeckOption
    | PlayerOption
    | CircleTokenOption
    | ImageTokenOption
    | RectTokenOption;
}

export interface RemovePieceAction {
  type: 'remove_piece';
  id: string;
}

export type EditorAction =
  | CreateGameAction
  | UpdateGameNameAction
  | SetCurScenarioAction
  | AddScenarioAction
  | DuplicateScenarioAction
  | UpdateScenarioAction
  | RemoveScenarioAction
  | AddPieceAction
  | UpdatePieceAction
  | RemovePieceAction;

export interface CardOption {
  type: 'card';
  id: string;
  image: string;
  count: number;
}

export interface Piece {
  delta: number;
  [key: string]: any;
}
export type BoardPiece = BoardOption & Piece;
export type CardPiece = CardOption & Piece;
export type CircleTokenPiece = CircleTokenOption & Piece;
export type ImageTokenPiece = ImageTokenOption & Piece;
export type RectTokenPiece = RectTokenOption & Piece;

export interface DeckPiece extends DeckOption, Piece {
  count: number;
  total: number;
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
  | BoardPiece
  | CardPiece
  | DeckPiece
  | DeletedPiece
  | PlayerPiece
  | CircleTokenPiece
  | ImageTokenPiece
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

export interface JoinEvent {
  event: 'join';
  hand: string[];
  board: string[];
  pieces: Pieces;
  assets:
    | string[]
    | {
        [key: string]: string;
      };
  player: {
    name: string;
  };
}

export interface SetHandEvent {
  event: 'set_hand';
  hand: string[];
}

export interface UpdatePieceEvent {
  event: 'update_piece';
  pieces: {
    [id: string]: RenderPiece;
  };
}

export interface RemoveFromBoardEvent {
  event: 'remove_from_board';
  ids: string[];
}

export interface AddToBoardEvent {
  event: 'add_to_board';
  pieces: string[];
}

export interface RollDiceEvent {
  event: 'roll_dice';
}

export interface HandCountEvent {
  event: 'hand_count';
  counts: { [playerId: string]: number };
}

export interface PickUpCardsEvent {
  event: 'pick_up_cards';
  cardIds: string[];
}

export interface RenamePlayerEvent {
  event: 'rename_player';
  name: string;
}

export interface PlayCardsEvent {
  event: 'play_cards';
  cardIds: string[];
  faceDown: boolean;
}

export interface DiscardEvent {
  event: 'discard';
  cardIds: string[];
}

export interface ShuffleDeckEvent {
  event: 'shuffle_deck';
}

export interface ShuffleDiscardedEvent {
  event: 'shuffle_discarded';
  deckId: string;
}

export interface DiscardPlayedEvent {
  event: 'discard_played';
  deckId: string;
}

export interface DrawCardsEvent {
  event: 'draw_cards';
  deckId: string;
  count: number;
}

export interface DrawCardsToTableEvent {
  event: 'draw_cards_to_table';
  deckId: string;
  count: number;
  faceDown: boolean;
}

export interface PassCardsEvent {
  event: 'pass_cards';
  cardIds: string[];
  playerId: string;
}

export interface PeekAtDeckEvent {
  event: 'peek_at_deck';
  deckId: string;
}

export interface TakeCardsEvent {
  event: 'take_cards';
  deckId: string;
  cardIds: string[];
}

export interface RemoveCardsEvent {
  event: 'remove_cards';
  deckId: string;
  cardIds: string[];
}

export interface RequestAssetEvent {
  event: 'request_asset';
  asset: string;
}

export interface AssetLoadedEvent {
  event: 'asset_loaded';
  asset: {
    [key: string]: string;
  };
}

export interface DeckPeekEvent {
  event: 'deck_peek';
  deckId: string;
  playerId: string;
}

export interface DeckPeekResultsEvent {
  event: 'deck_peek_results';
  cardIds: string[];
  discardedCardIds: string[];
}

export type ClientEvent =
  | DrawCardsEvent
  | DrawCardsToTableEvent
  | PickUpCardsEvent
  | PassCardsEvent
  | PeekAtDeckEvent
  | TakeCardsEvent
  | RemoveCardsEvent
  | RenamePlayerEvent
  | PlayCardsEvent
  | DiscardEvent
  | ShuffleDeckEvent
  | ShuffleDiscardedEvent
  | DiscardPlayedEvent
  | RequestAssetEvent
  | UpdatePieceEvent;

export type GameEvent =
  | AddToBoardEvent
  | HandCountEvent
  | DeckPeekEvent
  | DeckPeekResultsEvent
  | JoinEvent
  | RemoveFromBoardEvent
  | SetHandEvent
  | AssetLoadedEvent
  | UpdatePieceEvent;
