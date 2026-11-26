// 命盘画布几何（基准 760 × 860，等比缩放）
export const CANVAS_W = 760
export const CANVAS_H = 860
export const MARGIN = 22
export const CELL_W = (CANVAS_W - MARGIN * 2) / 4
export const CELL_H = (CANVAS_H - MARGIN * 2) / 4

/** 地支 -> [行, 列] */
export const BRANCH_CELL: [number, number][] = [
  [3, 2], // 子
  [3, 1], // 丑
  [3, 0], // 寅
  [2, 0], // 卯
  [1, 0], // 辰
  [0, 0], // 巳
  [0, 1], // 午
  [0, 2], // 未
  [0, 3], // 申
  [1, 3], // 酉
  [2, 3], // 戌
  [3, 3], // 亥
]

export const cellRect = (b: number) => {
  const [r, c] = BRANCH_CELL[b]
  return { x: MARGIN + c * CELL_W, y: MARGIN + r * CELL_H, w: CELL_W, h: CELL_H, r, c }
}

export const CENTER = {
  x0: MARGIN + CELL_W,
  y0: MARGIN + CELL_H,
  x1: MARGIN + CELL_W * 3,
  y1: MARGIN + CELL_H * 3,
}
export const CENTER_POINT = { x: (CENTER.x0 + CENTER.x1) / 2, y: (CENTER.y0 + CENTER.y1) / 2 }

/** 宫位靠中宫一侧的锚点（三方四正连线端点） */
export const innerAnchor = (b: number) => {
  const { x, y, w, h, r, c } = cellRect(b)
  if (r === 0 && c === 0) return { x: CENTER.x0, y: CENTER.y0 }
  if (r === 0 && c === 3) return { x: CENTER.x1, y: CENTER.y0 }
  if (r === 3 && c === 0) return { x: CENTER.x0, y: CENTER.y1 }
  if (r === 3 && c === 3) return { x: CENTER.x1, y: CENTER.y1 }
  if (r === 0) return { x: x + w / 2, y: CENTER.y0 }
  if (r === 3) return { x: x + w / 2, y: CENTER.y1 }
  if (c === 0) return { x: CENTER.x0, y: y + h / 2 }
  return { x: CENTER.x1, y: y + h / 2 }
}

/** 宫位外边框锚点及向外单位方向（离心自化箭头）：四角宫沿 45° 对角线，边宫沿离中心放射方向 */
export const outerAnchor = (b: number) => {
  const { x, y, w, h, r, c } = cellRect(b)
  const D = Math.SQRT1_2
  if (r === 0 && c === 0) return { x, y, dx: -D, dy: -D }
  if (r === 0 && c === 3) return { x: x + w, y, dx: D, dy: -D }
  if (r === 3 && c === 0) return { x, y: y + h, dx: -D, dy: D }
  if (r === 3 && c === 3) return { x: x + w, y: y + h, dx: D, dy: D }
  const a =
    r === 0 ? { x: x + w / 2, y } : r === 3 ? { x: x + w / 2, y: y + h } : c === 0 ? { x, y: y + h / 2 } : { x: x + w, y: y + h / 2 }
  const vx = a.x - CENTER_POINT.x
  const vy = a.y - CENTER_POINT.y
  const len = Math.hypot(vx, vy)
  return { ...a, dx: vx / len, dy: vy / len }
}

/** 离心自化箭头长度 */
export const OUTER_ARROW_LEN = 16

/** 方位字与离心箭头冲突时沿外边滑开的距离 */
export const DIRECTION_LABEL_SHIFT = 46

type Side = 'top' | 'bottom' | 'left' | 'right'
/** 外圈十二地理方位（罗盘：午正南、子正北、卯正东、酉正西） */
const DIRECTIONS: [number, Side, string][] = [
  [6, 'top', '正南方'],
  [7, 'top', '南偏西'],
  [1, 'bottom', '北偏东'],
  [0, 'bottom', '正北方'],
  [5, 'left', '南偏东'],
  [4, 'left', '东偏南'],
  [3, 'left', '正东方'],
  [2, 'left', '东偏北'],
  [8, 'right', '西偏南'],
  [9, 'right', '正西方'],
  [10, 'right', '西偏北'],
  [11, 'right', '北偏西'],
]

export const DIRECTION_LABELS = DIRECTIONS.map(([b, side, text]) => {
  const { x, y, w, h } = cellRect(b)
  const vertical = side === 'left' || side === 'right'
  const px = side === 'left' ? MARGIN / 2 : side === 'right' ? CANVAS_W - MARGIN / 2 : x + w / 2
  const py = side === 'top' ? MARGIN / 2 : side === 'bottom' ? CANVAS_H - MARGIN / 2 : y + h / 2
  return { text, x: px, y: py, vertical, branch: b }
})
