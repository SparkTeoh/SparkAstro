# 运动清单的动作图解

每个动作一张图，网页用的是 `*.png`，`*.svg` 是源文件。两者都由脚本生成，不要手改：

    python3 scripts/workout-figures.py        # 生成 / 更新 *.svg
    node scripts/workout-figures-png.mjs      # 转成 1200×1200 *.png

改图（角度、标注、文字）就改 `scripts/workout-figures.py` 里对应的函数，再跑一次上面两行。
YAML 里引用 PNG，例如：

    image: ./workout/max-hangs.png

风格：浅底 (`#f7f6f2`)、黑色解剖线稿 (`#0a0a0d`)、站点蓝 (`#3d5afe`) / 安全绿 (`#2e7d32`) / 警示红 (`#c62828`) 标注，底部黑条写负荷和组次数。

指力板握姿采用精准侧面解剖剖面图（`grip_cross_section()`：展示 20mm 四指平整洞截面、近/中/远节指骨、PIP 90° vs ≈140° vs 死折反折、大拇指放松 vs 拇指压指甲、A2 滑车位置），配合正面双孔位门框黄杨木指力板（`hangboard_front()`：区分顶部宽沿 Jug 与中/下排 20mm 四指平整洞）。
