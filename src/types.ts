export interface Assets {
  [key: string]: string;
}

export interface DiceSet {
  [sides: number]: number;
}

export interface EditorConfig {
  name: string;
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
  faceDown: boolean;
  counts: string;
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

export interface GamePromptInput {
  type: 'text' | 'number' | 'hand';
  label: string;
}

export interface GamePrompt {
  id?: string;
  title: string;
  inputs: GamePromptInput[];
}

export type GamePromptAnswer = string | number | null;

export interface GamePromptSubmission {
  promptId: string;
  playerId: string;
  answers: GamePromptAnswer[];
}

export interface GameConfig {
  currency?: string;
  prompts?: GamePrompt[];
  curScenario: string;
  scenarios: {
    [id: string]: ScenarioOption;
  };
  pieces: {
    [id: string]: AnyPieceOption;
  };
}

export interface GameProps {
  id: string;
  version: number;
  name: string;
  store: 'included' | 'browser' | 'file';
  thumbnail?: string;
  tags: string[];
  rules?: string;
  summary: string;
  description: string;
}

export interface EditorState extends GameConfig, GameProps {
  assets?: Assets;
  renderCount: number;
}

export interface Game extends GameProps {
  config: GameConfig;
  disableSync?: boolean;
  sendAssets?: boolean;
  loadAssets?: () => Promise<Assets>;
}

export interface PublicGame extends Game {
  store: 'browser';
  userId: string;
  price: number;
  disableSync: true;
  banner?: string;
  files: string[];
}

export interface UploadedFile {
  content: string;
  type: string;
  name: string;
}

export interface PublishableGame extends Omit<PublicGame, 'files'> {
  files: UploadedFile[];
}

export interface CreateGameAction {
  type: 'create_game';
  name: string;
  id: string;
}

export interface EditGameAction {
  type: 'edit_game';
  config: EditorState & { loadAssets?: () => any };
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

export interface UpdateGame {
  type: 'update_game';
  game: Partial<Omit<Game, 'config'> & GameConfig>;
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
    | MoneyTokenOption
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
    | MoneyTokenOption
    | RectTokenOption;
}

export interface RemovePieceAction {
  type: 'remove_piece';
  id: string;
}

export type EditorAction =
  | CreateGameAction
  | EditGameAction
  | UpdateGame
  | SetCurScenarioAction
  | AddScenarioAction
  | DuplicateScenarioAction
  | UpdateScenarioAction
  | RemoveScenarioAction
  | AddPieceAction
  | UpdatePieceAction
  | RemovePieceAction;

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

export interface JoinEvent {
  event: 'join';
  game: Game;
  hand: string[];
  chat: ChatEvent[];
  assets:
    | string[]
    | {
        [key: string]: string;
      };
  player: {
    name: string;
  };
}

export interface PlayerJoinEvent {
  event: 'player_join';
  board: string[];
  pieces: Pieces;
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

export interface CreateStackEvent {
  event: 'create_stack';
  ids: string[];
}

export interface SplitStackEvent {
  event: 'split_stack';
  id: string;
  count: number;
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
  dice: DiceSet;
  hidden: boolean;
}
export interface RevealPieceEvent {
  event: 'reveal_pieces';
  pieceIds: string[];
}

export interface SetDiceEvent {
  event: 'set_dice';
  diceIds: string[];
}

export interface DiceCountEvent {
  event: 'dice_counts';
  counts: { [playerId: string]: number };
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

export interface PeekAtCardEvent {
  event: 'peek_at_card';
  cardIds: string[];
  peeking: boolean;
}

export interface PeekAtDeckEvent {
  event: 'peek_at_deck';
  deckId: string;
  peeking: boolean;
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
  loadedFromCache?: boolean;
  asset: {
    [key: string]: string;
  };
}

export interface DeckPeekResultsEvent {
  event: 'deck_peek_results';
  cardIds: string[];
  discardedCardIds: string[];
}

export interface TransactionEvent {
  event: 'transaction';
  transaction: Transaction;
  amount: number;
}

export interface ChatEvent {
  event: 'chat';
  playerId: string;
  message: string;
}

export interface PromptPlayersEvent {
  event: 'prompt_players';
  prompt: GamePrompt;
  players: string[];
}

export interface PromptSubmissionEvent {
  event: 'prompt_submission';
  promptId: string;
  answers?: GamePromptAnswer[];
}

export interface PromptResultsEvent {
  event: 'prompt_results';
  promptId: string;
  results: {
    [playerId: string]: GamePromptAnswer[] | boolean;
  };
}

export interface LocalPieceUpdate {
  event: 'local_piece_update';
  pieces: Pieces;
}

export interface LoadComplete {
  event: 'load_complete';
}

export interface ClearPromptResult {
  event: 'clear_prompt_result';
}

export interface SetRequestAsset {
  event: 'set_request_asset';
  asset: string;
}

export type ClientEvent =
  | TransactionEvent
  | PromptPlayersEvent
  | PromptSubmissionEvent
  | ChatEvent
  | RollDiceEvent
  | DrawCardsEvent
  | DrawCardsToTableEvent
  | PickUpCardsEvent
  | PassCardsEvent
  | PeekAtCardEvent
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
  | RevealPieceEvent
  | CreateStackEvent
  | SplitStackEvent
  | UpdatePieceEvent;

export type GameEvent =
  | SetRequestAsset
  | ClearPromptResult
  | PromptPlayersEvent
  | PromptResultsEvent
  | LocalPieceUpdate
  | LoadComplete
  | ChatEvent
  | AddToBoardEvent
  | DiceCountEvent
  | SetDiceEvent
  | HandCountEvent
  | DeckPeekResultsEvent
  | JoinEvent
  | PlayerJoinEvent
  | RemoveFromBoardEvent
  | SetHandEvent
  | AssetLoadedEvent
  | UpdatePieceEvent;
