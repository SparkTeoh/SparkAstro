import { useEffect, useRef, useState, type ReactNode } from 'react'
import { mod12 } from '../../core/constants/base'
import { MUTAGEN_COLORS, type Mutagen } from '../../core/constants/stars'
import { mutagenTargets, type Chart } from '../../core/ziwei'
import type { Overlay } from '../../state/overlay'
import { useT } from '../../state/lang'
import { PalaceCell, type ViewMode } from './PalaceCell'
import {
  CANVAS_H, CANVAS_W, CENTER, DIRECTION_LABELS, DIRECTION_LABEL_SHIFT, OUTER_ARROW_LEN, cellRect, innerAnchor, outerAnchor,
} from './geometry'

interface Props {
  chart: Chart
  mode: ViewMode
  overlay: Overlay
  activePalace: number
  onSelectPalace: (b: number) => void
  center: ReactNode
}

export function ChartGrid({ chart, mode, overlay, activePalace, onSelectPalace, center }: Props) {
  const t = useT()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1.3, entry.contentRect.width / CANVAS_W))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 边宫（非四角）离心箭头从外边中点射出，会与该宫方位字重叠
  const arrowOut = new Set(
    chart.palaces.filter((p) => !CORNER_BRANCHES.has(p.branch) && p.stars.some((s) => s.selfOut.length > 0)).map((p) => p.branch),
  )
  const triad = new Set([activePalace, mod12(activePalace + 4), mod12(activePalace + 8), mod12(activePalace + 6)])

  return (
    <div ref={wrapRef} className="w-full">
      <div style={{ height: CANVAS_H * scale }} className="relative w-full">
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}
        >
          {/* 十二宫格整体外框：1.5px 深海蓝实线 */}
          <div
            className="absolute"
            style={{ left: GRID.x - 1.5, top: GRID.y - 1.5, width: GRID.w + 3, height: GRID.h + 3, border: '1.5px solid #003054', background: '#FFFFFF' }}
          />
          {chart.palaces.map((p) => {
            const r = cellRect(p.branch)
            return (
              <div key={p.branch} className="absolute" style={{ left: r.x, top: r.y }}>
                <PalaceCell
                  palace={p}
                  mode={mode}
                  overlay={overlay}
                  active={p.branch === activePalace}
                  inTriad={triad.has(p.branch)}
                  onClick={() => onSelectPalace(p.branch)}
                />
              </div>
            )
          })}
          <div
            className="absolute overflow-hidden"
            style={{
              left: CENTER.x0, top: CENTER.y0, width: CENTER.x1 - CENTER.x0, height: CENTER.y1 - CENTER.y0,
              border: '1px solid #CBD5E1', background: '#FFFFFF',
            }}
          >
            {center}
          </div>
          <SvgLayer chart={chart} mode={mode} activePalace={activePalace} />
          {DIRECTION_LABELS.map((d) => {
            // 该宫有离心自化箭头（从外边中点射出）时，方位字沿外边滑开避让
            const shift = arrowOut.has(d.branch) ? DIRECTION_LABEL_SHIFT : 0
            return (
              <div
                key={d.text}
                className={`pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 text-[10px] leading-[11px] text-[#94A3B8] ${
                  d.vertical ? 'flex-col items-center' : 'whitespace-nowrap'
                }`}
                style={{ left: d.x + (d.vertical ? 0 : shift), top: d.y + (d.vertical ? shift : 0) }}
              >
                {d.vertical ? [...t(d.text)].map((ch, i) => <span key={i}>{ch}</span>) : t(d.text)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** 十二宫格整体范围（画布坐标） */
const GRID = { x: cellRect(5).x, y: cellRect(5).y, w: CANVAS_W - cellRect(5).x * 2, h: CANVAS_H - cellRect(5).y * 2 }

/** 四角宫：巳、申、寅、亥（离心箭头从外角射出，不占外边中点） */
const CORNER_BRANCHES = new Set([5, 8, 2, 11])

const Arrow = ({ x1, y1, x2, y2, color, id }: { x1: number; y1: number; x2: number; y2: number; color: string; id: string }) => (
  <g>
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill={color} />
      </marker>
    </defs>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.2} markerEnd={`url(#${id})`} />
  </g>
)

function SvgLayer({ chart, mode, activePalace }: { chart: Chart; mode: ViewMode; activePalace: number }) {
  const a = innerAnchor(activePalace)
  const tri = [activePalace, mod12(activePalace + 4), mod12(activePalace + 8)].map(innerAnchor)
  const opp = innerAnchor(mod12(activePalace + 6))
  const elems: ReactNode[] = []

  // 离心自化：宫外侧向外箭头
  for (const p of chart.palaces) {
    const muts: Mutagen[] = p.stars.flatMap((s) => s.selfOut)
    const o = outerAnchor(p.branch)
    muts.forEach((m, i) => {
      // 多支箭头沿垂直于射出方向错开
      const off = (i - (muts.length - 1) / 2) * 10
      const x = o.x - o.dy * off
      const y = o.y + o.dx * off
      elems.push(
        <Arrow
          key={`out-${p.branch}-${i}`}
          id={`out-${p.branch}-${i}`}
          x1={x}
          y1={y}
          x2={x + o.dx * OUTER_ARROW_LEN}
          y2={y + o.dy * OUTER_ARROW_LEN}
          color={MUTAGEN_COLORS[m]}
        />,
      )
    })
  }
  // 向心自化：由发出四化的对宫内侧锚点直指本宫内侧锚点
  for (const p of chart.palaces) {
    const muts: Mutagen[] = p.stars.flatMap((s) => s.selfIn)
    if (!muts.length) continue
    const src = mod12(p.branch + 6)
    const from = innerAnchor(src)
    const to = innerAnchor(p.branch)
    const vx = to.x - from.x
    const vy = to.y - from.y
    const len = Math.hypot(vx, vy)
    const ux = vx / len
    const uy = vy / len
    muts.forEach((m, i) => {
      const off = (i - (muts.length - 1) / 2) * 10
      const x = from.x - uy * off + ux * 2
      const y = from.y + ux * off + uy * 2
      elems.push(
        <Arrow key={`in-${p.branch}-${i}`} id={`in-${p.branch}-${i}`} x1={x} y1={y} x2={x + ux * 20} y2={y + uy * 20} color={MUTAGEN_COLORS[m]} />,
      )
    })
  }
  // 飞星模式：选中宫宫干飞出四化
  if (mode === 'flying') {
    mutagenTargets(chart, chart.palaces[activePalace].stem).forEach((h, i) => {
      if (h.branch === undefined || h.branch === activePalace) return
      const to = innerAnchor(h.branch)
      const color = MUTAGEN_COLORS[h.mutagen]
      const off = (i - 1.5) * 4
      elems.push(
        <Arrow key={`fly-${i}`} id={`fly-${i}`} x1={a.x + off} y1={a.y + off} x2={to.x + off} y2={to.y + off} color={color} />,
      )
    })
  }

  return (
    <svg className="pointer-events-none absolute inset-0" width={CANVAS_W} height={CANVAS_H}>
      {mode !== 'flying' && (
        <g stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" fill="none">
          <polygon points={tri.map((p) => `${p.x},${p.y}`).join(' ')} />
          <line x1={a.x} y1={a.y} x2={opp.x} y2={opp.y} />
        </g>
      )}
      {elems}
    </svg>
  )
}
