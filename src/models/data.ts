import type { AnyPieceOption } from './game';

export interface Assets {
  [key: string]: string;
}

export interface DiceSet {
  [sides: number]: number;
}

export interface ScenarioOption {
  id: string;
  name: string;
  pieces: string[];
  players: string[];
}

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

export interface PlayerValueConfig {
  id: string;
  type: 'attr' | 'input' | 'select';
  label: string;
}

export interface PlayerInputConfig extends PlayerValueConfig {
  type: 'input';
  format: 'string' | 'number' | 'currency';
}

export interface PlayerSelectConfig extends PlayerValueConfig {
  type: 'select';
  exclusive: boolean;
  values: {
    id: string;
    label: string;
    description?: string | null;
    value: string | null;
    modifiers?: {
      id: string;
      label: string;
      value: number;
    }[];
  }[];
}

export interface PlayerAttrConfig extends PlayerValueConfig {
  type: 'attr';
  checkable: boolean;
  values: {
    id: string;
    label: string;
    value: string | null;
  }[];
  modifiers?: {
    id: string;
    label: string;
    value: string | null;
  }[];
}

export interface PlayerStatGroup {
  label: string;
  stats: PlayerStatConfig[];
}

export type PlayerStatConfig =
  | PlayerInputConfig
  | PlayerSelectConfig
  | PlayerAttrConfig;

export interface GameConfig {
  currency?: string;
  prompts?: GamePrompt[];
  curScenario: string;
  playerStats?: PlayerStatGroup[];
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
