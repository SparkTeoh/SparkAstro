import { stemIndex } from '../core/constants/base'
import { PALACE_SHORT, PALACE_TWO, type Mutagen } from '../core/constants/stars'
import { lunarDayGanZhi } from '../core/calendar'
import type { Chart } from '../core/ziwei'
import {
  childLimitBranch, dayPalace, decades, flowGods, flowStars, hourPalace, hourStem, monthPalace, monthStem,
  mutagenHits, relativeNameIndex, yearInfo, yearStemBranch, type Decade,
} from '../core/horoscopes'

export interface HoroSelection {
  decade: number | null // -1 = 童限, 0..11
  year: number | null
  month: number | null // 1..12
  day: number | null // 1..30
  hour: number | null // 0..11
}

export const EMPTY_SELECTION: HoroSelection = { decade: null, year: null, month: null, day: null, hour: null }

export type LayerKey = 'decade' | 'year' | 'month' | 'day' | 'hour'

export const LAYER_STYLE: Record<LayerKey, { prefix: string; star: string; color: string }> = {
  decade: { prefix: '大', star: '大', color: '#15803d' },
  year: { prefix: '年', star: '年', color: '#1d4ed8' },
  month: { prefix: '月', star: '月', color: '#b45309' },
  day: { prefix: '日', star: '日', color: '#7c2d12' },
  hour: { prefix: '时', star: '时', color: '#9333ea' },
}

export interface Layer {
  key: LayerKey
  base: number // 该层命宫地支
  stem: number
  branch: number
  label: string
}

export interface Overlay {
  layers: Layer[]
  palaceTags: { text: string; color: string }[][]
  starMutagens: Record<string, { mutagen: Mutagen; color: string; key: LayerKey }[]>
  flowStars: { text: string; color: string }[][]
  gods: { jiangqian: string; suiqian: string }[] | null
  xiaoxian: { branch: number; color: string } | null
  /** 当前激活大限内 10 个流年落宫标签（按流年地支），如「2027年36岁」 */
  decadeYearLabels: (string | null)[]
}

/** 限流层级的叠宫全称前缀（用于导出 └限流叠宫） */
export const LAYER_FULL_PREFIX: Record<LayerKey, string> = {
  decade: '大限', year: '流年', month: '流月', day: '流日', hour: '流时',
}

export const decadeOfAge = (ds: Decade[], age: number) => ds.find((d) => age >= d.ageStart && age <= d.ageEnd) ?? null

export const buildOverlay = (chart: Chart, birthLunarYear: number, sel: HoroSelection): Overlay => {
  const layers: Layer[] = []
  const ds = decades(chart, birthLunarYear)
  let gods: Overlay['gods'] = null
  let xiaoxian: Overlay['xiaoxian'] = null
  const decadeYearLabels: Overlay['decadeYearLabels'] = Array.from({ length: 12 }, () => null)
  const fillYears = (from: number, to: number) => {
    for (let yr = from; yr <= to; yr++) {
      decadeYearLabels[yearStemBranch(yr).branch] = `${yr}年${yr - birthLunarYear + 1}岁`
    }
  }
  /** 推入大限层：同时按大限地支重排将前 / 岁前十二神，并填入该限 10 个流年标签 */
  const pushDecade = (layer: Layer, yearFrom: number, yearTo: number) => {
    layers.push(layer)
    gods = flowGods(layer.branch)
    fillYears(yearFrom, yearTo)
  }
  const childYears = (): [number, number] => [birthLunarYear, birthLunarYear + Math.max(chart.bureau.num - 1, 1) - 1]

  const pushDecadeFromAge = (age: number) => {
    if (age < chart.bureau.num) {
      const b = childLimitBranch(chart, age)
      pushDecade({ key: 'decade', base: b, stem: chart.palaces[b].stem, branch: b, label: '童限' }, ...childYears())
    } else {
      const d = decadeOfAge(ds, age)
      if (d) pushDecade({ key: 'decade', base: d.branch, stem: d.stem, branch: d.branch, label: `第${d.index + 1}大限` }, d.yearStart, d.yearEnd)
    }
  }

  if (sel.year !== null) {
    const y = yearInfo(chart, birthLunarYear, sel.year)
    pushDecadeFromAge(y.age)
    layers.push({ key: 'year', base: y.branch, stem: y.stem, branch: y.branch, label: `${sel.year}` })
    gods = flowGods(y.branch)
    xiaoxian = { branch: y.xiaoAfter, color: LAYER_STYLE.year.color }
    if (sel.month !== null) {
      const mp = monthPalace(chart, y.branch, sel.month)
      const ms = monthStem(y.stem, sel.month)
      layers.push({ key: 'month', base: mp, stem: ms, branch: (sel.month + 1) % 12, label: `${sel.month}月` })
      if (sel.day !== null) {
        const dp = dayPalace(mp, sel.day)
        const dgz = lunarDayGanZhi(sel.year, sel.month, sel.day)
        const dstem = dgz ? stemIndex(dgz[0]) : chart.palaces[dp].stem
        layers.push({ key: 'day', base: dp, stem: dstem, branch: dp, label: `${sel.day}日` })
        if (sel.hour !== null) {
          const hp = hourPalace(dp, sel.hour)
          layers.push({ key: 'hour', base: hp, stem: hourStem(dstem, sel.hour), branch: sel.hour, label: '' })
        }
      }
    }
  } else if (sel.decade !== null) {
    if (sel.decade === -1) pushDecadeFromAge(1)
    else {
      const d = ds[sel.decade]
      pushDecade({ key: 'decade', base: d.branch, stem: d.stem, branch: d.branch, label: `第${d.index + 1}大限` }, d.yearStart, d.yearEnd)
    }
  }

  const palaceTags: Overlay['palaceTags'] = Array.from({ length: 12 }, () => [])
  const flow: Overlay['flowStars'] = Array.from({ length: 12 }, () => [])
  const starMutagens: Overlay['starMutagens'] = {}
  for (const layer of layers) {
    const st = LAYER_STYLE[layer.key]
    for (let b = 0; b < 12; b++) {
      palaceTags[b].push({ text: st.prefix + PALACE_SHORT[relativeNameIndex(layer.base, b)], color: st.color })
    }
    for (const h of mutagenHits(chart, layer.stem)) {
      ;(starMutagens[h.star] ??= []).push({ mutagen: h.mutagen, color: st.color, key: layer.key })
    }
    if (layer.key === 'decade' || layer.key === 'year') {
      const fsBranch = layer.key === 'year' ? yearStemBranch(sel.year!).branch : layer.branch
      for (const f of flowStars(layer.stem, fsBranch)) flow[f.branch].push({ text: st.star + f.name, color: st.color })
    }
  }
  return { layers, palaceTags, starMutagens, flowStars: flow, gods, xiaoxian, decadeYearLabels }
}

/** 各宫限流叠宫全称，如「大限夫妻, 流年命宫」；无限流时为空数组 */
export const overlapNames = (layers: Pick<Layer, 'key' | 'base'>[]): string[][] =>
  Array.from({ length: 12 }, (_, b) =>
    layers.map((l) => {
      const idx = relativeNameIndex(l.base, b)
      return LAYER_FULL_PREFIX[l.key] + (idx === 0 ? '命宫' : PALACE_TWO[idx])
    }),
  )
