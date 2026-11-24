import { View } from "@tarojs/components";
import { CELL_PERCENT, Point } from "../../type/snakeType";
import style from "./index.module.less";

interface Props {
  food: Point;
}

/** 棋盘层：网格背景 + 食物 */
export default function Board({ food }: Props) {
  const visible = food && food.x >= 0 && food.y >= 0;

  return (
    <View className={style.board}>
      <View className={style.grid} />
      <View className={style.scanline} />
      <View className={style.vignette} />

      {visible && (
        <View
          className={style.food}
          style={{
            left: `${food.x * CELL_PERCENT}%`,
            top: `${food.y * CELL_PERCENT}%`,
          }}
        >
          <View className={style.halo} />
          <View className={style.orb}>
            <View className={style.shine} />
          </View>
          <View className={style.leaf} />
        </View>
      )}
    </View>
  );
}
