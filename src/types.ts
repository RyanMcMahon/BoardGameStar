interface BoardItemOption {
  image?: string;
}

interface PlayerOption {
  color: string;
  x: number;
  y: number;
}

export interface GameConfig {
  players: PlayerOption[];
  board: BoardItemOption[];
  decks: {
    name: string;
    id: string;
    image: string;
    x: number;
    y: number;
    width: number;
    height: number;
    cards: CardOption[] | string[];
  }[];
}

export interface ScenarioConfig {
  name: string;
  config: GameConfig;
}

export type Config = GameConfig | ScenarioConfig[];

export interface CardOption {
  image: string;
  count: number;
}

interface BaseItem {
  id: string;
  delta: number;
  image: string | undefined;
  x: number;
  y: number;
  width: number;
  height?: number;
  fill?: string;
  [key: string]: any;
}

export interface DeckItem extends BaseItem {
  type: 'deck';
  name: string;
  count: number;
  total: number;
}

export interface CardItem extends BaseItem {
  type: 'card';
  deckId: string;
}

export interface PieceItem extends BaseItem {
  type: 'piece';
}

export interface BoardItem extends BaseItem {
  type: 'board';
}

export interface PlayerItem extends BaseItem {
  type: 'player';
  name: string;
}

export interface DeletedItem extends BaseItem {
  type: 'deleted';
}

export type RenderItem =
  | BoardItem
  | DeckItem
  | CardItem
  | PieceItem
  | PlayerItem
  | DeletedItem;

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
  hand: Card[];
  board: RenderItem[];
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
  hand: Card[];
}

export interface UpdateItemEvent {
  event: 'update_item';
  item: Partial<RenderItem> & {
    id: string;
    delta: number;
  };
}

export interface RemoveFromBoardEvent {
  event: 'remove_from_board';
  ids: string[];
}

export interface AddToBoardEvent {
  event: 'add_to_board';
  items: RenderItem[];
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

export type ClientEvent =
  | DrawCardsEvent
  | PickUpCardsEvent
  | RenamePlayerEvent
  | PlayCardsEvent
  | DiscardEvent
  | ShuffleDeckEvent
  | ShuffleDiscardedEvent
  | DiscardPlayedEvent
  | RequestAssetEvent
  | UpdateItemEvent;

export type GameEvent =
  | AddToBoardEvent
  | HandCountEvent
  | JoinEvent
  | RemoveFromBoardEvent
  | SetHandEvent
  | AssetLoadedEvent
  | UpdateItemEvent;

export type Event =
  | AddToBoardEvent
  | HandCountEvent
  | JoinEvent
  | RemoveFromBoardEvent
  | RollDiceEvent
  | SetHandEvent
  | DrawCardsEvent
  | PickUpCardsEvent
  | RenamePlayerEvent
  | PlayCardsEvent
  | DiscardEvent
  | ShuffleDeckEvent
  | ShuffleDiscardedEvent
  | DiscardPlayedEvent
  | RequestAssetEvent
  | AssetLoadedEvent
  | UpdateItemEvent;
