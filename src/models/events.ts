import type {
  BoardOption,
  CardOption,
  DeckOption,
  PlayerOption,
  RectTokenOption,
  CircleTokenOption,
  ImageTokenOption,
  MoneyTokenOption,
  Pieces,
  RenderPiece,
  Transaction,
} from './game';
import type { DiceSet, EditorState, GameConfig, Game, GamePrompt, GamePromptAnswer, ScenarioOption } from './data';

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
