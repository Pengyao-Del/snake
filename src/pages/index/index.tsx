import { View, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useRef } from "react";
import "./index.less";

export default function Index() {
  //399个网格
  const row = 20;
  const col = 20;
  // 网格 20*20
  const [grid, setGrid] = useState<number[][]>(
    Array(row)
      .fill(null)
      .map(() => Array(col).fill(0))
  );
  //蛇的状态
  const [snake, setSnake] = useState<any>({
    position: [{ x: 0, y: 0 }], //起始位置
    direction: "r", //初始方向
    longth: 1, //初始长度
    source: 0, //初始分数
    life: 1, //1活着 0死了
  });
  // 使用 useRef 保存定时器引用
  let timer;

  //获得零食
  const getEat = () => {
    const newGrid = Array(row)
      .fill(null)
      .map(() => Array(col).fill(0));
    // 获得一个随机数作为零食的位置
    const randomRow = Math.floor(Math.random() * row);
    const randomCol = Math.floor(Math.random() * col);
    newGrid[randomRow][randomCol] = 1;
    console.log("newGrid", newGrid);
    setGrid([...newGrid]);
  };

  //移动蛇
  const moveSnake = () => {
    // 根据最新的方向移动蛇
    setSnake((prevSnake) => {
      // 状态更新后执行
      const newPosition = [...prevSnake.position];
      console.log("newPosition", prevSnake.direction);

      // 根据最新的方向移动蛇头
      switch (prevSnake.direction) {
        case "r":
          newPosition[0].x += 1;
          break;
        case "l":
          newPosition[0].x -= 1;
          break;
        case "u":
          newPosition[0].y -= 1;
          break;
        case "d":
          newPosition[0].y += 1;
          break;
      }

      // 碰撞检测使用最新状态
      if (
        newPosition[0].x < 0 ||
        newPosition[0].x * 30 >= 570 ||
        newPosition[0].y < 0 ||
        newPosition[0].y * 30 >= 570
      ) {
        clearInterval(timer);
        Taro.showModal({
          content: `游戏结束\n本次得分：${prevSnake.source}`,
          success: function (res) {
            if (res.confirm) {
              console.log("用户点击确定");
            } else if (res.cancel) {
              console.log("用户点击取消");
            }
          },
        });
        return { ...prevSnake, life: 0 };
      }

      return { ...prevSnake, position: newPosition };
    });
  };

  const change = (direction: string) => {
    setSnake((snake) => ({ ...snake, direction: direction }));
    console.log(snake);
  };

  const start = () => {
    getEat();
    startGame();
  };

  // 游戏开始
  const startGame = () => {
    timer = setInterval(() => {
      moveSnake();
    }, 1000);
  };

  return (
    <>
      <View className="index">
        <View className="play-box">
          <View
            style={{
              width:
                snake.direction === "r" || snake.direction === "l"
                  ? snake.longth * 30 + "rpx"
                  : "30rpx",
              background: "red",
              position: "absolute",
              left: snake.position[0].x * 30 + "rpx",
              top: snake.position[0].y * 30 + "rpx",
              height:
                snake.direction === "d" || snake.direction === "u"
                  ? snake.longth * 30 + "rpx"
                  : "30rpx",
              zIndex: 99,
            }}
          ></View>
          {/* 渲染20*20个网关作为蛇吃饲料的显示以及蛇上下左右移动 */}
          {grid.map((item, rowIndex) => {
            return item.map((item, colIndex) => {
              const current = rowIndex * row + colIndex;
              return (
                <View
                  key={current}
                  className="grid"
                  style={{ display: current != 399 ? "block" : "none" }}
                >
                  <View className="eat" style={{ display: item === 1 ? "block" : "none" }}></View>
                </View>
              );
            });
          })}
        </View>
        <View>
          <Button onClick={() => change("u")}>上</Button>
          <Button onClick={() => change("d")}>下</Button>
          <Button onClick={() => change("l")}>左</Button>
          <Button onClick={() => change("r")}>右</Button>
        </View>
        <Button onClick={() => start()}>开始</Button>
        <Button>重新开始</Button>
      </View>
    </>
  );
}
