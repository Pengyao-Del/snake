/** 棋盘边长（格） */
export const BOARD_SIZE = 20;

/** 每一格占棋盘的百分比 */
export const CELL_PERCENT = 100 / BOARD_SIZE;

export type Direction = "up" | "down" | "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export type GameStatus = "ready" | "playing" | "paused" | "over";

export interface GameState {
  /** 第 0 个元素是蛇头 */
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
}

export const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export type DifficultyKey = "easy" | "normal" | "hard";

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  desc: string;
  /** 初始每步间隔（毫秒） */
  base: number;
  /** 每升一级减少的间隔 */
  step: number;
  /** 最快间隔，防止快到不可玩 */
  min: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { key: "easy", label: "悠闲", desc: "轻松热身", base: 260, step: 10, min: 170 },
  { key: "normal", label: "经典", desc: "标准节奏", base: 200, step: 12, min: 120 },
  { key: "hard", label: "疾速", desc: "极限手速", base: 150, step: 12, min: 80 },
];
