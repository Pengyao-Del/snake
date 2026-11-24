import { View } from "@tarojs/components";
import { CELL_PERCENT, Direction, Point } from "../../type/snakeType";
import style from "./index.module.less";

interface Props {
  snake: Point[];
  direction: Direction;
  dead: boolean;
}

const HEAD_RGB = [178, 255, 226];
const TAIL_RGB = [13, 143, 108];

const bodyColor = (index: number, total: number): string => {
  const t = total <= 1 ? 0 : index / (total - 1);
  const rgb = HEAD_RGB.map((v, i) => Math.round(v + (TAIL_RGB[i] - v) * t));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
};

const DIR_CLASS: Record<Direction, string> = {
  up: "dirUp",
  down: "dirDown",
  left: "dirLeft",
  right: "dirRight",
};

/** 蛇身层：按格子百分比定位，蛇头带眼睛与方向朝向 */
export default function Snake({ snake, direction, dead }: Props) {
  return (
    <View className={style.layer}>
      {snake.map((seg, index) => {
        const isHead = index === 0;
        const headClass = `${style.segment} ${style[DIR_CLASS[direction]]} ${
          dead ? style.headDead : ""
        }`;
        return (
          <View
            key={`${seg.x}-${seg.y}-${index}`}
            className={style.cell}
            style={{
              left: `${seg.x * CELL_PERCENT}%`,
              top: `${seg.y * CELL_PERCENT}%`,
              zIndex: 30 - index,
            }}
          >
            <View
              className={isHead ? `${style.head} ${headClass}` : style.segment}
              style={
                isHead
                  ? undefined
                  : {
                      backgroundColor: bodyColor(index, snake.length),
                      opacity: 0.55 + 0.45 * (1 - index / snake.length),
                    }
              }
            >
              {isHead && (
                <>
                  <View className={`${style.eye} ${style.eyeA}`} />
                  <View className={`${style.eye} ${style.eyeB}`} />
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
