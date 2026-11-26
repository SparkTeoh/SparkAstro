// 基础常量（全部以简体中文作为内部键，显示时经 i18n 转换）

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

export type Stem = (typeof STEMS)[number]
export type Branch = (typeof BRANCHES)[number]

export const mod = (x: number, n: number) => ((x % n) + n) % n
export const mod12 = (x: number) => mod(x, 12)

export const stemIndex = (s: string) => STEMS.indexOf(s as Stem)
export const branchIndex = (b: string) => BRANCHES.indexOf(b as Branch)
export const isYangStem = (s: number) => s % 2 === 0

/** 六十甲子序号（0 = 甲子） */
export const jiaziIndex = (s: number, b: number) => mod(6 * s - 5 * b, 60)

/** 纳音五行，按六十甲子每两位一组 */
const NAYIN_ELEMENTS = '金火木土金火水土金木水土火木水金火木土金火水土金木水土火木水'
export const nayinElement = (s: number, b: number) => NAYIN_ELEMENTS[Math.floor(jiaziIndex(s, b) / 2)]

export const BUREAU_BY_ELEMENT: Record<string, { num: number; name: string }> = {
  水: { num: 2, name: '水二局' },
  木: { num: 3, name: '木三局' },
  金: { num: 4, name: '金四局' },
  土: { num: 5, name: '土五局' },
  火: { num: 6, name: '火六局' },
}

/** 五虎遁：返回寅宫（正月）天干序号 */
export const tigerStartStem = (yearStem: number) => [2, 4, 6, 8, 0][yearStem % 5]
/** 五鼠遁：返回子时天干序号 */
export const ratStartStem = (dayStem: number) => [0, 2, 4, 6, 8][dayStem % 5]

/** 某宫（地支序号）的五虎遁宫干 */
export const palaceStem = (yearStem: number, branch: number) => mod(tigerStartStem(yearStem) + mod12(branch - 2), 10)

/** 十二时辰：时 -> 地支序号（23 点归子） */
export const hourToBranch = (h: number) => Math.floor((h + 1) / 2) % 12

export const HOUR_RANGES = [
  '23:00~00:59', '01:00~02:59', '03:00~04:59', '05:00~06:59', '07:00~08:59', '09:00~10:59',
  '11:00~12:59', '13:00~14:59', '15:00~16:59', '17:00~18:59', '19:00~20:59', '21:00~22:59',
]

export const STEM_ELEMENT = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
export const BRANCH_ELEMENT = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水']

/** 十神（以日主为我） */
export const tenGod = (dayStem: number, other: number) => {
  const de = Math.floor(dayStem / 2)
  const oe = Math.floor(other / 2)
  const rel = mod(oe - de, 5)
  const same = dayStem % 2 === other % 2
  const table = [
    ['比肩', '劫财'],
    ['食神', '伤官'],
    ['偏财', '正财'],
    ['七杀', '正官'],
    ['偏印', '正印'],
  ]
  return table[rel][same ? 0 : 1]
}

export const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const DAY_TENS = ['初', '十', '廿', '三']
const DAY_UNITS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
export const lunarDayName = (d: number) => {
  if (d === 10) return '初十'
  if (d === 20) return '二十'
  if (d === 30) return '三十'
  return DAY_TENS[Math.floor(d / 10)] + DAY_UNITS[(d - 1) % 10]
}

/** 三合局分组：0 申子辰, 1 寅午戌, 2 巳酉丑, 3 亥卯未 */
export const triadGroup = (b: number) => {
  if ([8, 0, 4].includes(b)) return 0
  if ([2, 6, 10].includes(b)) return 1
  if ([5, 9, 1].includes(b)) return 2
  return 3
}
