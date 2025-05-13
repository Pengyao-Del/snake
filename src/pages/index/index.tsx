import { View, Button, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import "./index.less";

export default function Index() {
  //20x20个网格
  const row = 20;
  const col = 20;
  // 定时器
  let timer;
  let randomRow: number;
  let randomCol: number;
  // 网格 20*20
  const [grid, setGrid] = useState<number[][]>(
    Array(row)
      .fill(null)
      .map(() => Array(col).fill(0))
  );
  //蛇的状态
  const [snake, setSnake] = useState<any>({
    position: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ], //起始位置
    direction: "r", //初始方向
    source: 0, //初始分数
  });

  //获得零食
  const getEat = () => {
    const newGrid = Array(row)
      .fill(null)
      .map(() => Array(col).fill(0));
    let flag = false;

    //判断是否出现在蛇的位置
    do {
      randomRow = Math.floor(Math.random() * row);
      randomCol = Math.floor(Math.random() * col);
      for (let i = 0; i < snake.position.length; i++) {
        if (snake.position[i].x === randomRow && snake.position[i].y === randomCol) {
          flag = true;
          break;
        }
      }
    } while (flag);
    if (!flag) {
      newGrid[randomRow][randomCol] = 1;
      setGrid([...newGrid]);
    }
  };

  //移动蛇
  const moveSnake = () => {
    // 根据最新的方向移动蛇
    setSnake((prevSnake) => {
      // 状态更新后执行
      const newPosition: any = [];
      const head = { ...prevSnake.position[0] };
      // 根据最新的方向移动蛇头
      switch (prevSnake.direction) {
        case "r":
          head.x += 1;
          break;
        case "l":
          head.x -= 1;
          break;
        case "u":
          head.y -= 1;
          break;
        case "d":
          head.y += 1;
          break;
      }
      newPosition.push(head);
      //移动蛇身  如果没有吃到食物 最后一个就舍掉了
      for (let i = 0; i < prevSnake.position.length - 1; i++) {
        newPosition.push(prevSnake.position[i]);
      }
      // 碰撞边边
      if (head.x < 0 || head.x >= col || head.y < 0 || head.y >= row) {
        clearInterval(timer);
        Taro.showModal({
          content: `游戏结束\n本次得分：${prevSnake.source}`,
        });
      }
      // 检查是否得分 y行 x列 不能用完全等于
      if (head.x == randomCol && head.y == randomRow) {
        newPosition.push(prevSnake.position[prevSnake.position.length - 1]);
        prevSnake.source = prevSnake.source + 1;
        //长度+1
        prevSnake.longth = prevSnake.longth + 1;
        // 重新生成食物
        getEat();
      }
      // 检测蛇头是否与蛇身重叠
      for (let i = 1; i < newPosition.length; i++) {
        if (newPosition[0].x === newPosition[i].x && newPosition[0].y === newPosition[i].y) {
          clearInterval(timer);
          Taro.showModal({
            content: `游戏结束\n本次得分：${prevSnake.source}`,
          });
        }
      }

      return { ...prevSnake, position: newPosition };
    });
  };

  //改变方向
  const change = (direction: string) => {
    setSnake((prevSnake) => {
      if (
        (prevSnake.direction == "r" && direction == "l") ||
        (prevSnake.direction == "l" && direction == "r") ||
        (prevSnake.direction == "u" && direction == "d") ||
        (prevSnake.direction == "d" && direction == "u")
      ) {
        return { ...prevSnake };
      } else {
        return { ...prevSnake, direction: direction };
      }
    });
  };

  // 游戏开始 蛇移动
  const startGame = () => {
    timer = setInterval(() => {
      moveSnake();
    }, 300);
  };

  //开始/重新开始
  const start = () => {
    // 初始化蛇
    setSnake({
      position: [
        { x: 3, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
      ], //起始位置

      direction: "r", //初始方向
      source: 0, //初始分数
    });
    // 初始化食物
    setGrid(
      Array(row)
        .fill(null)
        .map(() => Array(col).fill(0))
    );
    if (timer) {
      clearInterval(timer);
    }
    //倒计时
    let count = 3;
    const countDown = setInterval(() => {
      if (count == 0) {
        clearInterval(countDown);
        getEat();
        startGame();
      } else {
        Taro.showToast({
          title: `${count}`,
          icon: "none",
        });
        count--;
      }
    }, 1000);
  };

  return (
    <>
      <View className="index">
        <View className="action">
          分数：{snake.source}
          <Text onClick={start} className="start">
            开始
          </Text>
        </View>
        <View className="play-box">
          {snake.position.map((item, index) => {
            return (
              <View
                key={index}
                style={{
                  width: "30rpx",
                  height: "30rpx",
                  backgroundColor: index == 0 ? "red" : "green",
                  position: "absolute",
                  left: item.x * 30 + "rpx",
                  top: item.y * 30 + "rpx",
                  borderRadius: "50%",
                }}
              ></View>
            );
          })}
          {/* 渲染20*20个网关作为蛇吃饲料的显示以及蛇上下左右移动 */}
          {grid.map((rowItems, rowIndex) => (
            <View key={rowIndex} className="flex" style={{ display: "flex" }}>
              {rowItems.map((item, colIndex) => {
                const current = rowIndex * col + colIndex;
                return (
                  <View key={current} className="grid">
                    <View className="eat" style={{ display: item === 1 ? "block" : "none" }}></View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <View className="play">
          <Button onClick={() => change("u")}>上</Button>
          <view className="flex-box">
            <Button onClick={() => change("l")}>左</Button>
            <Button onClick={() => change("r")}>右</Button>
          </view>
          <Button onClick={() => change("d")}>下</Button>
        </View>
      </View>
    </>
  );
}
