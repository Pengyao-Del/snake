import {
  BOARD_SIZE,
  DELTAS,
  DIFFICULTIES,
  DifficultyKey,
  Direction,
  GameState,
  OPPOSITE,
  Point,
} from "../pages/game/type/snakeType";

/** 初始蛇身：蛇头在前，朝右 */
const createSnake = (): Point[] => [
  { x: 7, y: 10 },
  { x: 6, y: 10 },
  { x: 5, y: 10 },
  { x: 4, y: 10 },
];

/** 在空格中随机生成食物（棋盘快满时也不会死循环） */
export const spawnFood = (snake: Point[]): Point => {
  const occupied = new Set(snake.map((p) => p.y * BOARD_SIZE + p.x));
  const free: number[] = [];
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    if (!occupied.has(i)) free.push(i);
  }
  if (!free.length) return { x: -1, y: -1 };
  const index = free[Math.floor(Math.random() * free.length)];
  return { x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) };
};

export const createGame = (): GameState => {
  const snake = createSnake();
  return {
    snake,
    food: spawnFood(snake),
    direction: "right",
    score: 0,
  };
};

export interface StepResult {
  state: GameState;
  /** 这一步吃到了食物 */
  ate: boolean;
  dead: boolean;
}

/**
 * 单步推进。
 * 注意：不吃食物时尾巴会让出格子，所以碰撞检测要排除最后一节。
 */
export const step = (state: GameState, direction: Direction): StepResult => {
  const delta = DELTAS[direction];
  const head = state.snake[0];
  const next: Point = { x: head.x + delta.x, y: head.y + delta.y };

  // 撞墙
  if (next.x < 0 || next.y < 0 || next.x >= BOARD_SIZE || next.y >= BOARD_SIZE) {
    return { state: { ...state, direction }, ate: false, dead: true };
  }

  const ate = next.x === state.food.x && next.y === state.food.y;
  const body = ate ? state.snake : state.snake.slice(0, -1);

  // 撞到自己
  if (body.some((seg) => seg.x === next.x && seg.y === next.y)) {
    return { state: { ...state, direction }, ate: false, dead: true };
  }

  const snake = [next, ...body];

  return {
    state: {
      ...state,
      snake,
      direction,
      score: ate ? state.score + 1 : state.score,
      food: ate ? spawnFood(snake) : state.food,
    },
    ate,
    dead: false,
  };
};

/** 等级：每吃 5 个升一级 */
export const getLevel = (score: number): number => 1 + Math.floor(score / 5);

/** 当前移动间隔（毫秒），分数越高越快 */
export const getSpeed = (difficulty: DifficultyKey, score: number): number => {
  const config = DIFFICULTIES.find((item) => item.key === difficulty) || DIFFICULTIES[1];
  const speed = config.base - Math.floor(score / 5) * config.step;
  return Math.max(config.min, speed);
};

/** 判断两个方向是否相反（禁止 180° 掉头） */
export const isOpposite = (a: Direction, b: Direction): boolean => OPPOSITE[a] === b;
