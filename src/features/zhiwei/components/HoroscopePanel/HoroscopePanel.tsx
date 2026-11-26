import { useState, type ReactNode } from 'react'
import { BRANCHES, LUNAR_MONTH_NAMES, STEMS, lunarDayName } from '../../core/constants/base'
import { decades, monthStem, yearStemBranch } from '../../core/horoscopes'
import type { Chart } from '../../core/ziwei'
import { EMPTY_SELECTION, LAYER_STYLE, type HoroSelection } from '../../state/overlay'
import { useT } from '../../state/lang'
import type { ViewMode } from '../ChartGrid/PalaceCell'

interface Props {
  chart: Chart
  birthLunarYear: number
  sel: HoroSelection
  onChange: (s: HoroSelection) => void
  mode: ViewMode
  onMode: (m: ViewMode) => void
}

const gz = (s: number, b: number) => STEMS[s] + BRANCHES[b]

/** 单元格：null 表示空白占位 */
type Cell = { key: string; top: ReactNode; bottom?: ReactNode; active: boolean; disabled?: boolean; onClick: () => void } | null

/** 大限每页 8 格（首页另含童限），留一格给翻页 */
const DECADE_PAGE_SIZE = 8
/** 流月每页 9 格，留一格给翻页 */
const MONTH_PAGE_SIZE = 9

export function HoroscopePanel({ chart, birthLunarYear, sel, onChange, mode, onMode }: Props) {
  const t = useT()
  const ds = decades(chart, birthLunarYear)
  const [decadePage, setDecadePage] = useState(0)
  const [monthPage, setMonthPage] = useState(0)

  const pickDecade = (i: number) => onChange(sel.decade === i && sel.year === null ? EMPTY_SELECTION : { ...EMPTY_SELECTION, decade: i })
  const pickYear = (y: number) => onChange(sel.year === y ? { ...EMPTY_SELECTION, decade: sel.decade } : { ...EMPTY_SELECTION, decade: sel.decade, year: y })

  // ── 大限行 ──
  const decadeCells: Cell[] = []
  if (decadePage === 0) {
    decadeCells.push({
      key: 'child',
      top: t('起限前'),
      bottom: t('童限'),
      active: sel.decade === -1,
      onClick: () => pickDecade(-1),
    })
  }
  const dFrom = decadePage === 0 ? 0 : DECADE_PAGE_SIZE
  ds.slice(dFrom, dFrom + DECADE_PAGE_SIZE).forEach((d) =>
    decadeCells.push({
      key: 'd' + d.index,
      top: `${d.ageStart}~${d.ageEnd}`,
      bottom: t(gz(d.stem, d.branch) + '限'),
      active: sel.decade === d.index,
      onClick: () => pickDecade(d.index),
    }),
  )

  // ── 流年小限行 ──
  let years: number[] = []
  if (sel.decade === -1) years = Array.from({ length: Math.max(chart.bureau.num - 1, 1) }, (_, i) => birthLunarYear + i)
  else if (sel.decade !== null) years = Array.from({ length: 10 }, (_, i) => ds[sel.decade!].yearStart + i)
  const yearCells: Cell[] = years.map((y) => {
    const { stem, branch } = yearStemBranch(y)
    return {
      key: 'y' + y,
      top: `${y}${t('年')}`,
      bottom: `${t(gz(stem, branch))}${y - birthLunarYear + 1}`,
      active: sel.year === y,
      onClick: () => pickYear(y),
    }
  })

  // ── 流月行（未选流年时浅灰禁用） ──
  const noYear = sel.year === null
  const monthCells: Cell[] = LUNAR_MONTH_NAMES.map((m, i) => ({
    key: 'm' + i,
    top: t(m + '月'),
    bottom: noYear ? undefined : t(gz(monthStem(yearStemBranch(sel.year!).stem, i + 1), (i + 2) % 12)),
    active: sel.month === i + 1,
    disabled: noYear,
    onClick: () => onChange({ ...sel, month: sel.month === i + 1 ? null : i + 1, day: null, hour: null }),
  })).slice(monthPage === 0 ? 0 : MONTH_PAGE_SIZE, monthPage === 0 ? MONTH_PAGE_SIZE : 12)

  // ── 流日行（3 × 10，未选流月时禁用） ──
  const dayCells: Cell[] = Array.from({ length: 30 }, (_, i) => ({
    key: 'day' + i,
    top: t(lunarDayName(i + 1)),
    active: sel.day === i + 1,
    disabled: sel.month === null,
    onClick: () => onChange({ ...sel, day: sel.day === i + 1 ? null : i + 1, hour: null }),
  }))

  // ── 流时行（12 列，未选流日时禁用） ──
  const hourCells: Cell[] = BRANCHES.map((b, i) => ({
    key: 'h' + i,
    top: t(b + '时'),
    active: sel.hour === i,
    disabled: sel.day === null,
    onClick: () => onChange({ ...sel, hour: sel.hour === i ? null : i }),
  }))

  return (
    <div className="flex flex-col gap-[6px] rounded-md border border-stone-300 bg-[#fffdf8] p-2 text-[12px]">
      <Row label={t('大限')} color={LAYER_STYLE.decade.color}>
        <Grid
          cols={10}
          color={LAYER_STYLE.decade.color}
          cells={decadeCells}
          slots={10}
          pager={
            decadePage === 0
              ? { pos: 'end', text: '▷', onClick: () => setDecadePage(1) }
              : { pos: 'start', text: '◁', onClick: () => setDecadePage(0) }
          }
        />
      </Row>
      <Row label={t('流年小限')} color={LAYER_STYLE.year.color}>
        <Grid cols={10} color={LAYER_STYLE.year.color} cells={yearCells} slots={10} />
      </Row>
      <Row label={t('流月')} color={LAYER_STYLE.month.color}>
        <Grid
          cols={10}
          color={LAYER_STYLE.month.color}
          cells={monthCells}
          slots={10}
          pager={
            monthPage === 0
              ? { pos: 'end', text: '▷', onClick: () => setMonthPage(1) }
              : { pos: 'start', text: '◁', onClick: () => setMonthPage(0) }
          }
        />
      </Row>
      <Row label={t('流日')} color={LAYER_STYLE.day.color}>
        <Grid cols={10} color={LAYER_STYLE.day.color} cells={dayCells} slots={30} small />
      </Row>
      <Row label={t('流时')} color={LAYER_STYLE.hour.color}>
        <Grid cols={12} color={LAYER_STYLE.hour.color} cells={hourCells} slots={12} small />
      </Row>

      <div className="mt-1 flex items-center justify-center gap-0 self-center overflow-hidden rounded-full border border-amber-700/50">
        {(
          [
            ['flying', '飞星'],
            ['sanhe', '三合'],
            ['sihua', '四化'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => onMode(k)}
            className={`px-5 py-1 text-[13px] ${mode === k ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  )
}

function Row({ label, color, children }: { label: string; color: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-1 sm:gap-2">
      <div className="flex w-7 shrink-0 justify-center pt-[3px] text-center text-[11px] font-bold leading-[13px] sm:w-9 sm:text-[12px]" style={{ color }}>
        {/* 四字标签固定折为两行（如 流年 / 小限） */}
        {label.length === 4 ? (
          <span>
            {label.slice(0, 2)}
            <br />
            {label.slice(2)}
          </span>
        ) : (
          label
        )}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

const GRID_COLS: Record<number, string> = { 10: 'grid-cols-10', 12: 'grid-cols-12' }

/**
 * 固定格数的网格：未激活（cells 为空）时以浅灰禁用态占位，保证面板高度恒定。
 * pager 占据首格或末格。
 */
function Grid({
  cols, color, cells, slots, pager, small,
}: {
  cols: number
  color: string
  cells: Cell[]
  slots: number
  pager?: { pos: 'start' | 'end'; text: string; onClick: () => void }
  small?: boolean
}) {
  const disabled = cells.length === 0 || cells.every((c) => c?.disabled)
  const body: (Cell | 'pager')[] = [...cells]
  if (pager) {
    if (pager.pos === 'start') body.unshift('pager')
    else {
      while (body.length < slots - 1) body.push(null)
      body.push('pager')
    }
  }
  while (body.length < slots) body.push(null)

  return (
    <div className={`grid ${GRID_COLS[cols]} gap-[2px] sm:gap-1`}>
      {body.slice(0, slots).map((c, i) => {
        if (c === 'pager')
          return (
            <button
              key="pager"
              onClick={pager!.onClick}
              className={`rounded border text-[12px] ${
                disabled ? 'border-stone-200 bg-stone-100 text-stone-400' : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {pager!.text}
            </button>
          )
        const h = small ? 'min-h-[26px]' : 'min-h-[34px]'
        if (!c)
          return (
            <div
              key={'blank' + i}
              className={`${h} rounded border ${disabled ? 'border-stone-200 bg-stone-100' : 'border-transparent'}`}
              aria-disabled={disabled || undefined}
            />
          )
        if (c.disabled)
          return (
            <button
              key={c.key}
              disabled
              className={`${h} min-w-0 cursor-not-allowed overflow-hidden whitespace-nowrap rounded border border-stone-200 bg-stone-100 px-0 text-center text-[10px] leading-[13px] text-stone-400 sm:text-[12px] sm:leading-[14px]`}
            >
              {c.top}
            </button>
          )
        return (
          <button
            key={c.key}
            onClick={c.onClick}
            className={`${h} min-w-0 overflow-hidden whitespace-nowrap rounded border px-0 text-center text-[10px] leading-[13px] sm:text-[12px] sm:leading-[14px]`}
            style={{
              borderColor: c.active ? color : '#d6d3d1',
              background: c.active ? color : '#fff',
              color: c.active ? '#fff' : '#44403c',
            }}
          >
            <div>{c.top}</div>
            {c.bottom !== undefined && <div className="text-[9px] opacity-75 sm:text-[10px]">{c.bottom}</div>}
          </button>
        )
      })}
    </div>
  )
}
