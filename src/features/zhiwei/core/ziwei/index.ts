import {
  BUREAU_BY_ELEMENT, isYangStem, mod12, nayinElement, palaceStem, triadGroup,
} from '../constants/base'
import {
  AUX_STARS, BODY_MASTER, BOSHI_12, CHANGSHENG_12, JIANGQIAN_12, KUI_POS, LIFE_MASTER, LUCUN_POS, MAJOR_STARS,
  MA_BY_TRIAD, MINOR_STARS, MUTAGENS, MUTAGEN_TABLE, PALACE_NAMES, SUIQIAN_12, YUE_POS, brightnessOf,
  type Mutagen, type StarKind,
} from '../constants/stars'
import type { Gender } from '../calendar'

export interface Star {
  name: string
  kind: StarKind
  brightness: string
  birthMutagen?: Mutagen
  /** 离心自化（本宫宫干化本宫星） */
  selfOut: Mutagen[]
  /** 向心自化（对宫宫干化入本宫星） */
  selfIn: Mutagen[]
}

export interface Palace {
  branch: number
  stem: number
  nameIndex: number // 0 = 命宫
  name: string
  isBody: boolean
  isLaiyin: boolean
  stars: Star[]
  boshi: string
  jiangqian: string
  suiqian: string
  changsheng: string
  decade: [number, number]
  xiaoxianAges: number[]
  liunianAges: number[]
}

export type PlateType = 'heaven' | 'earth' | 'human'

export interface ChartParams {
  yearStem: number
  yearBranch: number
  month: number // 1..12（已含闰月分界）
  day: number // 1..30
  hour: number // 地支序号
  gender: Gender
  plate?: PlateType
}

export interface Chart {
  params: ChartParams
  palaces: Palace[] // 下标 = 地支
  lifeIndex: number
  bodyIndex: number
  natalLifeIndex: number // 天盘命宫
  bureau: { num: number; name: string; element: string }
  lifeMaster: string
  bodyMaster: string
  douJun: number
  laiyin: number | null
  forward: boolean // 阳男阴女
  starPos: Record<string, number>
}

const triadPick = (yb: number, table: [number, number, number, number]) => table[triadGroup(yb)]

/** 起紫微 */
export const ziweiPosition = (bureau: number, day: number) => {
  if (day % bureau === 0) return mod12(2 + day / bureau - 1)
  let x = 1
  while ((day + x) % bureau !== 0) x++
  const q = (day + x) / bureau
  return x % 2 === 1 ? mod12(2 + q - 1 - x) : mod12(2 + q - 1 + x)
}

export const computeChart = (params: ChartParams): Chart => {
  const { yearStem: S, yearBranch: YB, month: M, day: D, hour: H, gender } = params
  const plate = params.plate ?? 'heaven'
  const natalLife = mod12(2 + (M - 1) - H)
  const body = mod12(2 + (M - 1) + H)
  // 天地人三盘：地盘以身宫、人盘以福德宫为命宫重起
  const natalFude = mod12(natalLife - 10)
  const life = plate === 'earth' ? body : plate === 'human' ? natalFude : natalLife

  const stems = Array.from({ length: 12 }, (_, b) => palaceStem(S, b))
  const element = nayinElement(stems[life], life)
  const bureau = { ...BUREAU_BY_ELEMENT[element], element }
  const yang = isYangStem(S)
  const forward = (yang && gender === 'male') || (!yang && gender === 'female')

  const pos: Record<string, number> = {}
  // 主星
  const Z = ziweiPosition(bureau.num, D)
  const F = mod12(4 - Z)
  Object.assign(pos, {
    紫微: Z, 天机: mod12(Z - 1), 太阳: mod12(Z - 3), 武曲: mod12(Z - 4), 天同: mod12(Z - 5), 廉贞: mod12(Z - 8),
    天府: F, 太阴: mod12(F + 1), 贪狼: mod12(F + 2), 巨门: mod12(F + 3), 天相: mod12(F + 4), 天梁: mod12(F + 5),
    七杀: mod12(F + 6), 破军: mod12(F + 10),
  })
  // 辅星
  const lucun = LUCUN_POS[S]
  const fireStart = triadPick(YB, [2, 1, 3, 9])
  const bellStart = triadPick(YB, [10, 3, 10, 10])
  Object.assign(pos, {
    左辅: mod12(4 + M - 1), 右弼: mod12(10 - (M - 1)), 文昌: mod12(10 - H), 文曲: mod12(4 + H),
    禄存: lucun, 擎羊: mod12(lucun + 1), 陀罗: mod12(lucun - 1), 天马: MA_BY_TRIAD[triadGroup(YB)],
    天魁: KUI_POS[S], 天钺: YUE_POS[S], 火星: mod12(fireStart + H), 铃星: mod12(bellStart + H),
    地空: mod12(11 - H), 地劫: mod12(11 + H),
  })
  // 小星
  const nameAt = (idx: number) => mod12(life - idx) // 第 idx 个人事宫所在地支
  const jieKong = [[8, 9], [6, 7], [4, 5], [2, 3], [0, 1]][S % 5]
  const xunStart = mod12(YB - S) // 旬首地支
  const xunKong = [mod12(xunStart + 10), mod12(xunStart + 11)]
  const pickYY = (pair: number[]) => (yang ? [pair.find((b) => b % 2 === 0)!, pair.find((b) => b % 2 === 1)!] : [pair.find((b) => b % 2 === 1)!, pair.find((b) => b % 2 === 0)!])
  const [jk, fjk] = pickYY(jieKong)
  const [xk, fxk] = pickYY(xunKong)
  const hongluan = mod12(3 - YB)
  Object.assign(pos, {
    三台: mod12(pos['左辅'] + D - 1),
    八座: mod12(pos['右弼'] - (D - 1)),
    恩光: mod12(pos['文昌'] + D - 2),
    天贵: mod12(pos['文曲'] + D - 2),
    龙池: mod12(4 + YB),
    凤阁: mod12(10 - YB),
    天才: mod12(life + YB),
    天寿: mod12(body + YB),
    台辅: mod12(6 + H),
    封诰: mod12(2 + H),
    红鸾: hongluan,
    天喜: mod12(hongluan + 6),
    天刑: mod12(9 + M - 1),
    天姚: mod12(1 + M - 1),
    解神: [8, 10, 0, 2, 4, 6][Math.floor((M - 1) / 2)],
    年解: mod12(10 - YB),
    天巫: [5, 8, 2, 11][(M - 1) % 4],
    天月: [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2][M - 1],
    阴煞: [2, 0, 10, 8, 6, 4][(M - 1) % 6],
    天厨: [5, 6, 0, 5, 6, 8, 2, 6, 9, 11][S],
    天官: [7, 4, 5, 2, 3, 9, 11, 9, 10, 6][S],
    天福: [9, 8, 0, 11, 3, 2, 6, 5, 6, 5][S],
    天哭: mod12(6 - YB),
    天虚: mod12(6 + YB),
    孤辰: [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2][YB],
    寡宿: [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10][YB],
    蜚廉: [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1][YB],
    破碎: [5, 1, 9, 5, 1, 9, 5, 1, 9, 5, 1, 9][YB],
    天空: mod12(YB + 1),
    大耗: [7, 6, 9, 8, 11, 10, 1, 0, 3, 2, 5, 4][YB],
    天伤: nameAt(7),
    天使: nameAt(5),
    截空: jk,
    副截: fjk,
    旬空: xk,
    副旬: fxk,
    华盖: triadPick(YB, [4, 10, 1, 7]),
    劫煞: triadPick(YB, [5, 11, 2, 8]),
    咸池: triadPick(YB, [9, 3, 6, 0]),
    天德: mod12(9 + YB),
    月德: mod12(5 + YB),
    龙德: mod12(7 + YB),
  })

  const birthMut: Record<string, Mutagen> = {}
  MUTAGEN_TABLE[S].forEach((star, i) => (birthMut[star] = MUTAGENS[i]))

  // 来因宫：寅~亥十宫中宫干 = 生年干
  let laiyin: number | null = null
  for (let b = 2; b <= 11; b++) if (stems[b] === S) laiyin = b

  // 十二神
  const boshiDir = forward ? 1 : -1
  const jiangStart = triadPick(YB, [0, 6, 9, 3])
  const csStart = { 水: 8, 土: 8, 木: 11, 金: 5, 火: 2 }[element] as number

  const palaces: Palace[] = Array.from({ length: 12 }, (_, b) => {
    const nameIndex = mod12(life - b)
    const decadeIdx = forward ? mod12(b - life) : mod12(life - b)
    const xiaoStart = triadPick(YB, [10, 4, 7, 1])
    const xiaoFirst = gender === 'male' ? mod12(b - xiaoStart) + 1 : mod12(xiaoStart - b) + 1
    const liuFirst = mod12(b - YB) + 1
    return {
      branch: b,
      stem: stems[b],
      nameIndex,
      name: PALACE_NAMES[nameIndex],
      isBody: b === body,
      isLaiyin: b === laiyin,
      stars: [],
      boshi: BOSHI_12[mod12((b - lucun) * boshiDir)],
      jiangqian: JIANGQIAN_12[mod12(b - jiangStart)],
      suiqian: SUIQIAN_12[mod12(b - YB)],
      changsheng: CHANGSHENG_12[mod12((b - csStart) * boshiDir)],
      decade: [bureau.num + decadeIdx * 10, bureau.num + decadeIdx * 10 + 9],
      xiaoxianAges: [0, 1, 2, 3, 4].map((k) => xiaoFirst + 12 * k),
      liunianAges: [0, 1, 2, 3, 4].map((k) => liuFirst + 12 * k),
    }
  })

  const place = (names: string[], kind: StarKind) => {
    for (const n of names) {
      const b = pos[n]
      palaces[b].stars.push({
        name: n, kind, brightness: brightnessOf(n, kind, b),
        birthMutagen: kind === 'minor' ? undefined : birthMut[n], selfOut: [], selfIn: [],
      })
    }
  }
  place(MAJOR_STARS, 'major')
  place(AUX_STARS, 'aux')
  place(MINOR_STARS, 'minor')

  // 离心 / 向心自化
  for (const p of palaces) {
    const opp = palaces[mod12(p.branch + 6)]
    for (const star of p.stars) {
      if (star.kind === 'minor') continue
      const outIdx = MUTAGEN_TABLE[p.stem].indexOf(star.name)
      if (outIdx >= 0) star.selfOut.push(MUTAGENS[outIdx])
      const inIdx = MUTAGEN_TABLE[opp.stem].indexOf(star.name)
      if (inIdx >= 0) star.selfIn.push(MUTAGENS[inIdx])
    }
  }

  return {
    params, palaces, lifeIndex: life, bodyIndex: body, natalLifeIndex: natalLife, bureau,
    lifeMaster: LIFE_MASTER[life], bodyMaster: BODY_MASTER[YB], douJun: mod12(0 - (M - 1) + H), laiyin, forward,
    starPos: pos,
  }
}

/** 星曜标注（导出 / 详情用）：亮度 + 生年四化 + 离心 + 向心 */
export const starLabel = (s: Star) => {
  let t = s.name
  if (s.brightness) t += `[${s.brightness}]`
  if (s.birthMutagen) t += `[生年${s.birthMutagen}]`
  for (const m of s.selfOut) t += `[↓${m}]`
  for (const m of s.selfIn) t += `[↑${m}]`
  return t
}

/** 某天干四化落宫 */
export const mutagenTargets = (chart: Chart, stem: number) =>
  MUTAGEN_TABLE[stem].map((star, i) => ({ star, mutagen: MUTAGENS[i], branch: chart.starPos[star] }))
