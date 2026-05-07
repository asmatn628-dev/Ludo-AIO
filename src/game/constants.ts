export const COLORS = {
  RED: "text-red-500",
  GREEN: "text-green-500",
  YELLOW: "text-yellow-400",
  BLUE: "text-blue-500",
};

export const BG_COLORS = {
  RED: "bg-red-500",
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-400",
  BLUE: "bg-blue-500",
};

export const BASE_COLORS = [
  "red",
  "green",
  "yellow",
  "blue"
];

export const BOARD_SIZE = 15;

// The main path has 52 squares.
// Red starts at 0, Green at 13, Yellow at 26, Blue at 39.
export const STAR_POSITIONS = [8, 21, 34, 47];

export enum TokenState {
  BASE = "BASE",
  ACTIVE = "ACTIVE",
  HOME_PATH = "HOME_PATH",
  HOME = "HOME"
}

export type PlayerColor = "red" | "green" | "yellow" | "blue";

export interface Token {
  id: number;
  color: PlayerColor;
  state: TokenState;
  position: number; // For ACTIVE: 0-51 (global board index). For HOME_PATH: 0-4.
}

export interface Player {
  color: PlayerColor;
  tokens: Token[];
  isBot: boolean;
  isActive: boolean; // Are they playing in this match?
  name: string;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  hasKilled: boolean; // For Master mode
}

export type GameMode = "classic" | "quick" | "blitz" | "master";

export type GameState = "menu" | "lobby" | "playing" | "finished";
