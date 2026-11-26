import { mod, mod12, palaceStem, ratStartStem, tigerStartStem, triadGroup } from '../constants/base'
import {
  CHANG_BY_STEM, JIANGQIAN_12, KUI_POS, LUCUN_POS, MA_BY_TRIAD, MUTAGENS, MUTAGEN_TABLE, QU_BY_STEM, SUIQIAN_12,
  type Mutagen,
} from '../constants/stars'
import type { Chart } from '../ziwei'

export interface FlowStar {
  name: string // 如 禄、羊、陀、马、昌、曲、魁、钺、鸾、喜
  branch: number
}

export interface MutagenHit {
  star: string
  mutagen: Mutagen
  branch: number
}

export interface Decade {
  index: number // 0..11
  branch: number
  stem: number
  ageStart: number
  ageEnd: number
  yearStart: number
  yearEnd: number
}

export interface YearInfo {
  year: number
  stem: number
  branch: number
  age: number
  xiaoBefore: number | null // ┏ 生日前小限宫位
  xiaoAfter: number // ┓ 生日后小限宫位
}

export const decades = (chart: Chart, birthLunarYear: number): Decade[] =>
  Array.from({ length: 12 }, (_, i) => {
    const branch = mod12(chart.lifeIndex + (chart.forward ? i : -i))
    const ageStart = chart.bureau.num + i * 10
    return {
      index: i, branch, stem: chart.palaces[branch].stem, ageStart, ageEnd: ageStart + 9,
      yearStart: birthLunarYear + ageStart - 1, yearEnd: birthLunarYear + ageStart + 8,
    }
  })

/** 小限宫位（虚岁 age） */
export const xiaoxianBranch = (chart: Chart, age: number) => {
  const start = [10, 4, 7, 1][triadGroup(chart.params.yearBranch)]
  return chart.params.gender === 'male' ? mod12(start + age - 1) : mod12(start - (age - 1))
}

export const yearStemBranch = (year: number) => ({ stem: mod(year - 4, 10), branch: mod12(year - 4) })

export const yearInfo = (chart: Chart, birthLunarYear: number, year: number): YearInfo => {
  const age = year - birthLunarYear + 1
  const { stem, branch } = yearStemBranch(year)
  return {
    year, stem, branch, age,
    xiaoBefore: age > 1 ? xiaoxianBranch(chart, age - 1) : null,
    xiaoAfter: xiaoxianBranch(chart, age),
  }
}

export const mutagenHits = (chart: Chart, stem: number): MutagenHit[] =>
  MUTAGEN_TABLE[stem].map((star, i) => ({ star, mutagen: MUTAGENS[i], branch: chart.starPos[star] }))

/** 限流运曜：stem 与 branch 为该大限 / 流年的干支 */
export const flowStars = (stem: number, branch: number, withLuanXi = true): FlowStar[] => {
  const lu = LUCUN_POS[stem]
  const list: FlowStar[] = [
    { name: '禄', branch: lu },
    { name: '羊', branch: mod12(lu + 1) },
    { name: '陀', branch: mod12(lu - 1) },
    { name: '马', branch: MA_BY_TRIAD[triadGroup(branch)] },
    { name: '昌', branch: CHANG_BY_STEM[stem] },
    { name: '曲', branch: QU_BY_STEM[stem] },
    { name: '魁', branch: KUI_POS[stem] },
    { name: '钺', branch: [7, 8, 9, 9, 7, 8, 7, 6, 5, 5][stem] },
  ]
  if (withLuanXi) {
    const luan = mod12(3 - branch)
    list.push({ name: '鸾', branch: luan }, { name: '喜', branch: mod12(luan + 6) })
  }
  return list
}

/** 流月：正月命宫 = 流年支 + 子年斗君 */
export const monthPalace = (chart: Chart, yearBranch: number, lunarMonth: number) =>
  mod12(yearBranch + chart.douJun + lunarMonth - 1)

export const monthStem = (yearStem: number, lunarMonth: number) => mod(tigerStartStem(yearStem) + lunarMonth - 1, 10)

export const dayPalace = (monthPalaceIdx: number, day: number) => mod12(monthPalaceIdx + day - 1)
export const hourPalace = (dayPalaceIdx: number, hour: number) => mod12(dayPalaceIdx + hour)
export const hourStem = (dayStem: number, hour: number) => mod(ratStartStem(dayStem) + hour, 10)

/** 将前 / 岁前十二神按流年地支重排 */
export const flowGods = (yearBranch: number) => {
  const jiangStart = [0, 6, 9, 3][triadGroup(yearBranch)]
  return Array.from({ length: 12 }, (_, b) => ({
    jiangqian: JIANGQIAN_12[mod12(b - jiangStart)],
    suiqian: SUIQIAN_12[mod12(b - yearBranch)],
  }))
}

/** 以 base 为命宫时，宫位 b 的人事宫序号 */
export const relativeNameIndex = (base: number, b: number) => mod12(base - b)

/** 童限：1~5 岁 命、财、疾、夫、福 */
export const CHILD_LIMIT_NAME_INDEX = [0, 4, 5, 2, 10]
export const childLimitBranch = (chart: Chart, age: number) =>
  mod12(chart.lifeIndex - CHILD_LIMIT_NAME_INDEX[Math.min(Math.max(age, 1), 5) - 1])

export { palaceStem }
