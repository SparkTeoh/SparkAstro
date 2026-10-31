# 运动清单的动作图解

每个动作一张图，网页用的是 `*.png`，`*.svg` 是源文件。两者都由脚本生成，不要手改：

    python3 scripts/workout-figures.py        # 生成 / 更新 *.svg
    node scripts/workout-figures-png.mjs      # 转成 1200×1200 *.png

改图（角度、标注、文字）就改 `scripts/workout-figures.py` 里对应的函数，再跑一次上面两行。
YAML 里引用 PNG，例如：

    image: ./workout/max-hangs.png

风格：浅底、黑色线稿小人、蓝色标注（角度、箭头、节奏），底部黑条写负荷和组次数。

握姿一律用真人照片（`grip-half-crimp.jpg` 半抠 ✓、`grip-thumb-lock.jpg` 拇指锁全抠 ×，640×640 方图），
由 `photo_panel()` 嵌进 Max Hangs / No-Hangs 的 SVG；不要再画抽象手指线稿。
