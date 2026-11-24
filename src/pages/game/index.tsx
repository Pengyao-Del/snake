import { useEffect, useRef, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useDidHide } from "@tarojs/taro";
import Board from "./components/Board/Board";
import Snake from "./components/Snake/Snake";
import {
  DIFFICULTIES,
  DifficultyKey,
  Direction,
  GameState,
  GameStatus,
  OPPOSITE,
} from "./type/snakeType";
import { createGame, getLevel, getSpeed, step } from "../../utiles/utile";
import style from "./index.module.less";

const STORAGE_KEY = "snake_records_v2";
const MAX_QUEUE = 2;
const IS_H5 = process.env.TARO_ENV === "h5";

const vibrate = (type: "light" | "medium" | "heavy") => {
  try {
    const result = Taro.vibrateShort({ type } as any);
    if (result && typeof (result as any).catch === "function") {
      (result as any).catch(() => {});
    }
  } catch (e) {
    // 部分端不支持震动，忽略即可
  }
};

export default function GamePage() {
  const [status, setStatus] = useState<GameStatus>("ready");
  const [game, setGame] = useState<GameState>(() => createGame());
  const [difficulty, setDifficulty] = useState<DifficultyKey>("normal");
  const [records, setRecords] = useState<Record<string, number>>({});
  const [newRecord, setNewRecord] = useState(false);

  const gameRef = useRef<GameState>(game);
  const statusRef = useRef<GameStatus>("ready");
  const difficultyRef = useRef<DifficultyKey>("normal");
  const recordsRef = useRef<Record<string, number>>({});
  const queueRef = useRef<Direction[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const currentConfig =
    DIFFICULTIES.find((item) => item.key === difficulty) || DIFFICULTIES[1];
  const best = records[difficulty] || 0;
  const level = getLevel(game.score);
  const speed = getSpeed(difficulty, game.score);

  const applyStatus = (next: GameStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const start = () => {
    const fresh = createGame();
    gameRef.current = fresh;
    queueRef.current = [];
    setGame(fresh);
    setNewRecord(false);
    applyStatus("playing");
  };

  const finish = (score: number) => {
    applyStatus("over");
    vibrate("heavy");
    const key = difficultyRef.current;
    const prev = recordsRef.current[key] || 0;
    if (score > prev) {
      const next = { ...recordsRef.current, [key]: score };
      recordsRef.current = next;
      setRecords(next);
      setNewRecord(true);
      try {
        Taro.setStorageSync(STORAGE_KEY, next);
      } catch (e) {
        // 存储失败不影响游戏
      }
    }
  };

  const togglePause = () => {
    if (statusRef.current === "playing") {
      applyStatus("paused");
    } else if (statusRef.current === "paused") {
      applyStatus("playing");
    } else {
      start();
    }
  };

  // 切到后台时自动暂停，避免回来就撞墙
  useDidHide(() => {
    if (statusRef.current === "playing") applyStatus("paused");
  });

  /** 把方向压入队列，避免快速连按导致掉头或丢输入 */
  const turn = (dir: Direction) => {
    if (statusRef.current !== "playing") return;
    const queue = queueRef.current;
    const last = queue.length ? queue[queue.length - 1] : gameRef.current.direction;
    if (dir === last || dir === OPPOSITE[last] || queue.length >= MAX_QUEUE) return;
    queue.push(dir);
  };

  const pickDirection = (current: Direction): Direction => {
    const queue = queueRef.current;
    while (queue.length) {
      const next = queue.shift() as Direction;
      if (next !== current && next !== OPPOSITE[current]) return next;
    }
    return current;
  };

  // 读取历史最高分（兼容 H5 端可能带 data 包装的存储格式）
  useEffect(() => {
    try {
      const raw = Taro.getStorageSync(STORAGE_KEY) as any;
      const saved =
        raw && typeof raw === "object" && raw.data && typeof raw.data === "object"
          ? raw.data
          : raw;
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        recordsRef.current = saved;
        setRecords(saved);
      }
    } catch (e) {
      // 忽略
    }
  }, []);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // 游戏主循环
  useEffect(() => {
    if (status !== "playing") return;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const current = gameRef.current;
      const result = step(current, pickDirection(current.direction));

      if (result.dead) {
        gameRef.current = result.state;
        setGame(result.state);
        finish(result.state.score);
        return;
      }

      gameRef.current = result.state;
      setGame(result.state);
      if (result.ate) vibrate("light");

      timerRef.current = setTimeout(
        tick,
        getSpeed(difficultyRef.current, result.state.score)
      );
    };

    timerRef.current = setTimeout(
      tick,
      getSpeed(difficultyRef.current, gameRef.current.score)
    );

    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status]);

  // H5 / 桌面端键盘操作
  useEffect(() => {
    if (typeof window === "undefined" || !window.addEventListener) return;
    const KEY_DIR: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };
    const handler = (event: KeyboardEvent) => {
      const dir = KEY_DIR[event.key];
      if (dir) {
        event.preventDefault();
        turn(dir);
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (statusRef.current === "ready" || statusRef.current === "over") start();
        else togglePause();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onTouchStart = (event: any) => {
    const point = event.touches && event.touches[0];
    if (!point) return;
    touchRef.current = { x: point.clientX, y: point.clientY };
  };

  const onTouchEnd = (event: any) => {
    const origin = touchRef.current;
    touchRef.current = null;
    if (!origin) return;
    const point = event.changedTouches && event.changedTouches[0];
    if (!point) return;
    const dx = point.clientX - origin.x;
    const dy = point.clientY - origin.y;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      turn(dx > 0 ? "right" : "left");
    } else {
      turn(dy > 0 ? "down" : "up");
    }
  };

  const onTouchCancel = () => {
    touchRef.current = null;
  };

  const pickDifficulty = (key: DifficultyKey) => {
    if (statusRef.current === "playing") return;
    setDifficulty(key);
  };

  const difficultyChips = (
    <View className={style.chips}>
      {DIFFICULTIES.map((item) => (
        <View
          key={item.key}
          className={`${style.chip} ${item.key === difficulty ? style.chipOn : ""}`}
          hoverClass={style.chipHover}
          onClick={() => pickDifficulty(item.key)}
        >
          <Text className={style.chipLabel}>{item.label}</Text>
          <Text className={style.chipDesc}>{item.desc}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View className={style.page}>
      <View className={style.glowA} />
      <View className={style.glowB} />

      <View className={style.header}>
        <View className={style.brand}>
          <Text className={style.title}>SNAKE</Text>
          <Text className={style.subtitle}>贪吃蛇 · 霓虹版</Text>
        </View>
        <View className={style.headerBadge}>
          <Text className={style.badgeLabel}>难度</Text>
          <Text className={style.badgeValue}>{currentConfig.label}</Text>
        </View>
      </View>

      <View className={style.stats}>
        <View className={style.stat}>
          <Text className={style.statLabel}>当前分数</Text>
          <Text key={game.score} className={style.statValue}>
            {game.score}
          </Text>
        </View>
        <View className={`${style.stat} ${style.statAccent}`}>
          <Text className={style.statLabel}>最高纪录</Text>
          <Text className={style.statValue}>{best}</Text>
        </View>
        <View className={style.stat}>
          <Text className={style.statLabel}>等级</Text>
          <Text className={style.statValue}>{level}</Text>
        </View>
      </View>

      <View
        className={`${style.boardWrap} ${status === "over" ? style.boardOver : ""}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <Board food={game.food} />
        <Snake snake={game.snake} direction={game.direction} dead={status === "over"} />

        {status !== "playing" && (
          <View className={style.mask}>
            <View className={style.panel}>
              {status === "ready" && (
                <>
                  <Text className={style.panelTag}>READY</Text>
                  <Text className={style.panelTitle}>准备出发</Text>
                  <Text className={style.panelDesc}>
                    吃掉光点得分，别撞墙，也别咬到自己
                  </Text>
                  {difficultyChips}
                  <View className={style.primaryBtn} hoverClass={style.primaryBtnHover} onClick={start}>
                    <Text className={style.btnText}>开始游戏</Text>
                  </View>
                  <Text className={style.panelHint}>
                    {IS_H5 ? "滑动棋盘 / 键盘方向键均可操作" : "在棋盘上滑动或点击方向键操作"}
                  </Text>
                </>
              )}

              {status === "paused" && (
                <>
                  <Text className={style.panelTag}>PAUSED</Text>
                  <Text className={style.panelTitle}>已暂停</Text>
                  <Text className={style.panelDesc}>
                    当前 {game.score} 分 · 等级 {level}，随时可以继续
                  </Text>
                  <View
                    className={style.primaryBtn}
                    hoverClass={style.primaryBtnHover}
                    onClick={() => applyStatus("playing")}
                  >
                    <Text className={style.btnText}>继续游戏</Text>
                  </View>
                  <View className={style.ghostBtn} hoverClass={style.ghostBtnHover} onClick={start}>
                    <Text className={style.ghostText}>重新开始</Text>
                  </View>
                </>
              )}

              {status === "over" && (
                <>
                  <Text className={`${style.panelTag} ${style.panelTagDanger}`}>GAME OVER</Text>
                  <Text className={style.panelTitle}>本局结束</Text>
                  <View className={style.finalScore}>
                    <Text className={style.finalValue}>{game.score}</Text>
                    <Text className={style.finalUnit}>分</Text>
                  </View>
                  {newRecord ? (
                    <View className={style.recordTag}>
                      <Text className={style.recordText}>新纪录</Text>
                    </View>
                  ) : (
                    <Text className={style.panelDesc}>最高纪录 {best} 分，再试一次？</Text>
                  )}
                  {difficultyChips}
                  <View className={style.primaryBtn} hoverClass={style.primaryBtnHover} onClick={start}>
                    <Text className={style.btnText}>再来一局</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      <View className={style.metaRow}>
        <Text className={style.metaText}>速度 {Math.round(1000 / speed)} 格/秒</Text>
        <Text className={style.metaDot}>·</Text>
        <Text className={style.metaText}>{currentConfig.desc}</Text>
      </View>

      <View className={style.dpad}>
        <View className={style.dpadRow}>
          <View className={style.key} hoverClass={style.keyHover} onClick={() => turn("up")}>
            <Text className={style.keyArrow}>↑</Text>
          </View>
        </View>
        <View className={style.dpadRow}>
          <View className={style.key} hoverClass={style.keyHover} onClick={() => turn("left")}>
            <Text className={style.keyArrow}>←</Text>
          </View>
          <View
            className={`${style.key} ${style.keyCenter}`}
            hoverClass={style.keyHover}
            onClick={togglePause}
          >
            <Text className={style.centerIcon}>{status === "playing" ? "II" : "▶"}</Text>
          </View>
          <View className={style.key} hoverClass={style.keyHover} onClick={() => turn("right")}>
            <Text className={style.keyArrow}>→</Text>
          </View>
        </View>
        <View className={style.dpadRow}>
          <View className={style.key} hoverClass={style.keyHover} onClick={() => turn("down")}>
            <Text className={style.keyArrow}>↓</Text>
          </View>
        </View>
      </View>

      <Text className={style.hint}>提示：连续快速转向会被缓冲，放心操作</Text>
      <Text className={style.footer}>吃掉光点 · 越吃越长 · 越吃越快</Text>
    </View>
  );
}
