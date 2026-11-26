import { BRANCHES, STEMS, mod12, tenGod } from '../constants/base'
import { PALACE_NAMES, PALACE_SHORT, PALACE_TWO } from '../constants/stars'
import { fmtWenmo, type ResolvedBirth } from '../calendar'
import { starLabel, type Chart, type Palace, type Star } from '../ziwei'
import {
  childLimitBranch, decades, flowStars, monthPalace, monthStem, mutagenHits, relativeNameIndex, yearInfo,
  type Decade,
} from '../horoscopes'
import { toLang, type Lang } from '../i18n'

/** AI 详批提示词的四大场景模式 */
export type ExportMode = 'career' | 'annual' | 'life' | 'natal'

export const EXPORT_MODES: ExportMode[] = ['career', 'annual', 'life', 'natal']

/** 起始 / 目标年份可选范围：出生年 ~ 出生年 + 95 */
export const YEAR_SPAN_LIMIT = 95

const DISCLAIMER = '最后，别忘了提醒用户上述分析仅限于研究或娱乐目的使用。'

/** 通用全盘导语（natal 模式勾选「附带通用大师解盘导语」时使用） */
export const PROMPT_INTRO =
  '你现在是资深的国学易经术数领域专家，请详细分析下面这个文墨天机紫微斗数命盘，综合使用三合紫微、飞星紫微、河洛紫微、钦天四化等各流派紫微斗数的分析技法，对命盘十二宫星曜分布、限流叠宫和各宫位间的飞宫四化进行细致分析，进而对命主的健康、学业、事业、财运、人际关系、婚姻和感情等各个方面进行全面分析和总结，关键事件须给出发生时间范围、吉凶属性、事件对命主的影响程度等信息，并结合命主的自身特点给出针对性的解决方案和建议。' +
  DISCLAIMER

const careerIntro = (n: number) =>
  `你现在是精通三合紫微、钦天四化、飞星紫微与子平八字同参的资深国学术数专家，同时也是一位商业财富战略顾问。下面是一份文墨天机紫微斗数命盘，以及由程序精确预计算好的「本命 / 大限 / 流年」三盘叠宫、七大财官宫位、对宫冲照与宫干飞化数据。请直接引用这些预计算数据，不要自行重新数宫位或心算四化。请结合命盘底色、当前十年大限气候与未来 ${n} 年逐年叠宫飞化数据，为命主制定一份可落地的事业战略与财富配置方案：何时进攻、何时防守、现金流与资产如何安排、合伙与团队如何取舍。${DISCLAIMER}`

const annualIntro = (year: number) =>
  `你现在是精通三合紫微、钦天四化、飞星紫微与子平八字同参的资深国学术数专家，擅长做单一年度的深度精批。下面是一份文墨天机紫微斗数命盘，以及由程序精确预计算好的 ${year} 年流年十二宫叠宫、流年四化冲照、关键宫干飞化与农历正月至腊月十二个流月的逐月明细。请直接引用这些预计算数据，不要自行重新数宫位或心算四化。请对命主 ${year} 年的事业、财运、感情、健康四大维度逐一详批，并把十二个流月排成一份可以照着执行的行动日历。${DISCLAIMER}`

const LIFE_INTRO =
  `你现在是统观全局的命理宗师，精通三合紫微、钦天四化、飞星紫微与子平八字同参。下面是一份文墨天机紫微斗数命盘，以及由程序精确预计算好的前八个十年大限的叠宫、坐星与宫干四化数据。请直接引用这些预计算数据，不要自行重新数宫位或心算四化。请全面剖析命主的性格、天赋、学业、事业赛道、财富层级、婚姻感情、六亲人际与健康隐患，并逐一深度解析前八个十年大限的人生阶段起伏与关键转折。本次只看命格底色与十年大周期，不需要逐一展开流年。${DISCLAIMER}`

const gz = (s: number, b: number) => STEMS[s] + BRANCHES[b]
const PLATE_NAME = { heaven: '天盘', earth: '地盘', human: '人盘' } as const
const opp = (b: number) => mod12(b + 6)

/** 地支藏干本气（子癸 丑己 寅甲 卯乙 辰戊 巳丙 午丁 未己 申庚 酉辛 戌戊 亥壬） */
const BRANCH_MAIN_STEM = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]

/** 导出用宫名（命宫写作「命  宫」） */
export const exportPalaceName = (p: Palace) => (p.nameIndex === 0 ? '命  宫' : p.name)

const listOrNone = (xs: string[]) => (xs.length ? xs.join(',') : '无')

export const palaceTitle = (p: Palace) =>
  `${exportPalaceName(p)}[${gz(p.stem, p.branch)}]${p.isBody ? '[身宫]' : ''}${p.isLaiyin ? '[来因]' : ''}`

/**
 * 宫位子树（文墨原版结构，已含 ├ / └ / │ 树枝符号，调用方只需加外层缩进前缀）
 * @param overlap 该宫限流叠宫全称列表（如 ['大限夫妻', '流年命宫']），为空输出「无」
 */
export const palaceLines = (p: Palace, overlap: string[] = []) => {
  const by = (k: string) => p.stars.filter((s) => s.kind === k).map(starLabel)
  return [
    `├主星 : ${listOrNone(by('major'))}`,
    `├辅星 : ${listOrNone(by('aux'))}`,
    `├小星 : ${listOrNone(by('minor'))}`,
    `├神煞`,
    `│ ├岁前星 : ${p.suiqian}`,
    `│ ├将前星 : ${p.jiangqian}`,
    `│ ├十二长生 : ${p.changsheng}`,
    `│ └太岁煞禄 : ${p.boshi}`,
    `├大限 : ${p.decade[0]}~${p.decade[1]}虚岁`,
    `├小限 : ${p.xiaoxianAges.join(',')}虚岁`,
    `├流年 : ${p.liunianAges.join(',')}虚岁`,
    `└限流叠宫 : ${overlap.length ? overlap.join(', ') : '无'}`,
  ]
}

export interface ExportOptions {
  mode: ExportMode
  lang: Lang
  note?: string
  /** 按地支索引的限流叠宫全称（界面当前选中的大限 / 流年…），未选中时省略 */
  overlap?: string[][]
  /** career：起始年份（默认当前公历年） */
  startYear?: number
  /** career：规划跨度（默认 5 年） */
  span?: 3 | 5
  /** annual：目标年份（默认当前公历年） */
  targetYear?: number
  /** career / annual：现实锚点 1 —— 当前职业 / 商业模式 / 状态（留空不输出） */
  occupation?: string
  /** career / annual：现实锚点 2 —— 近期核心决策问题 / 今年重点关注事项（留空不输出） */
  question?: string
  /** natal：是否附带通用大师解盘导语（默认不附带） */
  withIntro?: boolean
}

/** 把年份夹到「出生年 ~ 出生年 + 95」范围内 */
export const clampYear = (birthYear: number, year: number) =>
  Math.min(Math.max(Math.trunc(year), birthYear), birthYear + YEAR_SPAN_LIMIT)

// ───────────────────────── 预计算工具 ─────────────────────────

/** 紧凑星曜标注：巨门(旺)(生年忌)(↓禄)(↑权) */
const compactStar = (s: Star) => {
  let t = s.name
  if (s.brightness) t += `(${s.brightness})`
  if (s.birthMutagen) t += `(生年${s.birthMutagen})`
  for (const m of s.selfOut) t += `(↓${m})`
  for (const m of s.selfIn) t += `(↑${m})`
  return t
}

/** 某宫主星 + 辅星（不含小星） */
const mainStars = (p: Palace) => {
  const xs = p.stars.filter((s) => s.kind !== 'minor').map(compactStar)
  return xs.length ? xs.join(', ') : '无'
}

/** 某一层运限（大限 / 童限 / 流年 / 流月）的命宫地支与宫名前缀 */
interface Frame {
  prefix: string // 大 / 流 / 年 / 月
  base: number
}

/** 十年大限或童限（童限逐岁换宫，没有固定十年区间） */
interface Period {
  key: string
  child: boolean
  decade: Decade | null
  base: number
  stem: number
}

interface Ctx {
  birth: ResolvedBirth
  chart: Chart
  ds: Decade[]
  birthYear: number
}

const periodOfAge = (c: Ctx, age: number): Period => {
  const d = c.ds.find((x) => age >= x.ageStart && age <= x.ageEnd)
  if (d) return { key: `d${d.index}`, child: false, decade: d, base: d.branch, stem: d.stem }
  const b = childLimitBranch(c.chart, age)
  return { key: 'child', child: true, decade: null, base: b, stem: c.chart.palaces[b].stem }
}

const periodLabel = (p: Period) =>
  p.decade ? `第${p.decade.index + 1}大限[${gz(p.decade.stem, p.decade.branch)}]` : '童限'

/** 宫位叠宫简称：本疾/大官/流命 */
const tags = (c: Ctx, b: number, frames: Frame[]) =>
  [`本${PALACE_SHORT[c.chart.palaces[b].nameIndex]}`, ...frames.map((f) => f.prefix + PALACE_SHORT[relativeNameIndex(f.base, b)])].join('/')

/** 地支 + 叠宫简称：辛亥(本疾/大官/流命) */
const spot = (c: Ctx, b: number, frames: Frame[]) => `${gz(c.chart.palaces[b].stem, b)}(${tags(c, b, frames)})`

/** 某天干四化的落宫、对宫照 / 冲描述 */
const mutagenDetail = (c: Ctx, stem: number, frames: Frame[], from?: number) =>
  mutagenHits(c.chart, stem).map((h) => {
    const self = from !== undefined && h.branch === from ? '(自化)' : ''
    const across = h.mutagen === '忌' ? `⚠️冲${spot(c, opp(h.branch), frames)}` : `照${spot(c, opp(h.branch), frames)}`
    return { ...h, text: `入${spot(c, h.branch, frames)}${self}, ${across}` }
  })

/** 一行式四化：丁干 -> 太阴化禄[入…, 照…], …, 巨门化忌[入…, ⚠️冲…] */
const mutagenInline = (c: Ctx, stem: number, frames: Frame[], from?: number) =>
  `${STEMS[stem]}干 -> ` + mutagenDetail(c, stem, frames, from).map((h) => `${h.star}化${h.mutagen}[${h.text}]`).join(', ')

/** 八字大运与某公历年区间的重叠 */
const dayunOverlap = (birth: ResolvedBirth, from: number, to: number) => {
  const xs = birth.dayun.filter((d) => d.startYear <= to && d.startYear + 9 >= from)
  if (!xs.length) return from < (birth.dayun[0]?.startYear ?? Infinity) ? '尚未起运' : '已出八步大运范围'
  return xs.map((d) => `${gz(d.stem, d.branch)}(${d.tenGod})[${d.startYear}~${d.startYear + 9}]`).join(' → ')
}

const dayunLine = (birth: ResolvedBirth) =>
  `${birth.qiyun.text}(${birth.qiyun.forward ? '顺行' : '逆行'}) | ` +
  birth.dayun.map((d) => `${gz(d.stem, d.branch)}(${d.tenGod},${d.startAge}虚岁,${d.startYear}起)`).join(' → ')

/** 大限财官七核心宫位：[人事宫序号, 标签] */
const CORE7: [number, string][] = [
  [0, '命宫'], [8, '官禄(事业)'], [4, '财帛(现金流)'], [9, '田宅(总财库)'], [1, '兄弟(流动资金池/合伙)'],
  [6, '迁移(外部市场)'], [7, '交友(客户/团队)'],
]
/** 流年七大核心宫位 */
const YEAR7: [number, string][] = [
  [0, '命宫'], [8, '官禄'], [4, '财帛'], [9, '田宅(财库)'], [1, '兄弟(现金池)'], [6, '迁移'], [7, '交友'],
]
const ALL12: [number, string][] = PALACE_TWO.map((n, i) => [i, n])
/** life 模式重点宫位：命 / 官 / 财 / 夫 / 田 / 福 / 疾 */
const LIFE_KEY = new Set([0, 8, 4, 2, 9, 10, 5])

const flowStarText = (prefix: string, stem: number, branch: number) =>
  flowStars(stem, branch).map((f) => `${prefix}${f.name}[${BRANCHES[f.branch]}]`).join(', ')

/** 树状输出小工具：把若干行挂到同一父节点下，自动选用 ├ / └ */
const branchOut = (pre: string, rows: string[]) => rows.map((r, i) => `${pre}${i === rows.length - 1 ? '└' : '├'}${r}`)

// ───────────────────────── 本命盘（文墨原版树） ─────────────────────────

const natalTree = (c: Ctx, opts: ExportOptions, withDayun: boolean) => {
  const { birth, chart } = c
  const pal = chart.palaces
  const L: string[] = []
  const push = (s: string) => L.push(s)
  push('文墨天机紫微斗数命盘')
  push('│')
  push('├API 版本 : 1.1.5')
  push('├App版本 : 2.5.29')
  push('├安星码 : C5VUC')
  push('├符号定义')
  push('│ ├(↓:离心自化)')
  push('│ ├(↑:向心自化，从对宫化入)')
  push('│ ├(┏ : 生日前小限)')
  push('│ └( ┓: 生日后小限)')
  push('│')
  push('├基本信息')
  push('│ │')
  push(`│ ├性别 : ${birth.input.gender === 'male' ? '男' : '女'}`)
  push(`│ ├地理经度 : ${birth.input.longitude}`)
  push(`│ ├钟表时间 : ${fmtWenmo(birth.clock)}`)
  push(`│ ├真太阳时 : ${fmtWenmo(birth.trueSolar)}`)
  push(`│ ├农历时间 : ${birth.lunarText}`)
  push(`│ ├节气四柱 : ${birth.jieqiPillars.join(' ')}`)
  push(`│ ├非节气四柱 : ${birth.nonJieqiPillars.join(' ')}`)
  if (withDayun) push(`│ ├八字起运与大运 : ${dayunLine(birth)}`)
  push(`│ ├五行局数 : ${chart.bureau.name}`)
  push(`│ ├命盘类型 : 三合盘(${PLATE_NAME[chart.params.plate ?? 'heaven']})`)
  push(
    `│ └身主:${chart.bodyMaster}; 命主:${chart.lifeMaster}; 子年斗君:${BRANCHES[chart.douJun]}; 身宫:${BRANCHES[chart.bodyIndex]}`,
  )
  push('│')
  push('├命盘十二宫')
  push('│ │ ')
  for (let b = 0; b < 12; b++) {
    const last = b === 11
    push(`│ ${last ? '└' : '├'}${palaceTitle(pal[b])}`)
    const pre = last ? '│   ' : '│ │ '
    palaceLines(pal[b], opts.overlap?.[b]).forEach((ln) => push(pre + ln))
    if (!last) push('│ │ ')
  }
  push('│')
  push(`└[备注: ${opts.note?.trim() || '无'}]`)
  return L
}

// ───────────────────────── 大限底盘 ─────────────────────────

const READING_GUIDE = (yearPrefix: string | null, month = false) => [
  '【预计算数据阅读说明】',
  `· 宫位写作「宫干地支(本X/大X${yearPrefix ? `/${yearPrefix}X` : ''}${month ? '/月X' : ''})」：本 = 本命盘宫位，大 = 十年大限宫位${yearPrefix ? `，${yearPrefix} = 流年宫位` : ''}${month ? '，月 = 流月宫位' : ''}；X 为十二宫简称（命兄夫子财疾迁友官田福父）。`,
  '· 四化落点：「入」= 化星所在宫位；「照」= 禄权科照入对宫；「⚠️冲」= 化忌冲对宫，对宫所主人事同样受损，须重点提示。',
  '· 星曜后的括号依次为：亮度、生年四化、↓离心自化、↑向心自化。',
  `· 年份一律按农历年（正月初一换年）计，虚岁 = 年份 - 出生农历年 + 1${month ? '；流月为农历月' : ''}。`,
]

/** 大限头信息 + 指定宫位映射 + 宫干四化 + 流曜 */
const decadeBlock = (c: Ctx, d: Decade, palaces: [number, string][], markKey = false) => {
  const frames: Frame[] = [{ prefix: '大', base: d.branch }]
  const pal = c.chart.palaces
  const out: string[] = [
    `├大限区间 : ${d.ageStart}~${d.ageEnd}虚岁 | ${d.yearStart}~${d.yearEnd}年 | 大限命宫[${gz(d.stem, d.branch)}]叠本命${PALACE_TWO[pal[d.branch].nameIndex]}`,
    `├对应八字大运 : ${dayunOverlap(c.birth, d.yearStart, d.yearEnd)}`,
  ]
  out.push(palaces.length === 12 ? '├大限十二宫映射（★ 为重点宫位）' : '├大限财官七核心宫位映射')
  out.push(
    ...branchOut(
      '│ ',
      palaces.map(([idx, label]) => {
        const b = mod12(d.branch - idx)
        const star = markKey && LIFE_KEY.has(idx) ? '★' : ''
        return `${star}大限${label}[${gz(pal[b].stem, b)} | 叠本命${PALACE_TWO[pal[b].nameIndex]}] : 主辅星[${mainStars(pal[b])}] | 对宫[${gz(pal[opp(b)].stem, opp(b))} ${mainStars(pal[opp(b)])}]`
      }),
    ),
  )
  out.push(`├大限宫干四化 : ${mutagenInline(c, d.stem, frames)}`)
  out.push(`└大限流曜 : ${flowStarText('大', d.stem, d.branch)}`)
  return out
}

const childBlock = (c: Ctx) => [
  `├童限区间 : 1~${c.chart.bureau.num - 1}虚岁（${c.chart.bureau.name}，${c.chart.bureau.num}虚岁起第1大限）`,
  '└说明 : 童限逐岁换宫（命、财、疾、夫、福），尚未进入十年大限，逐年童限宫位见下方流年明细中的「大X」标注。',
]

// ───────────────────────── 流年 ─────────────────────────

interface YearCtx {
  frames: Frame[]
  period: Period
  yStem: number
  yBranch: number
}

const yearCtx = (c: Ctx, year: number, yearPrefix: string) => {
  const y = yearInfo(c.chart, c.birthYear, year)
  const period = periodOfAge(c, y.age)
  const frames: Frame[] = [{ prefix: '大', base: period.base }, { prefix: yearPrefix, base: y.branch }]
  const yc: YearCtx = { frames, period, yStem: y.stem, yBranch: y.branch }
  return { y, yc }
}

const yearHead = (c: Ctx, year: number) => {
  const { chart, birth } = c
  const y = yearInfo(chart, c.birthYear, year)
  const period = periodOfAge(c, y.age)
  const pal = chart.palaces
  const xp = (b: number) => `${gz(pal[b].stem, b)}(${PALACE_TWO[pal[b].nameIndex]})`
  const xiao = y.xiaoBefore === null ? `小限[┓${xp(y.xiaoAfter)}]` : `小限[┏${xp(y.xiaoBefore)} ┓${xp(y.xiaoAfter)}]`
  const hidden = BRANCH_MAIN_STEM[y.branch]
  const bazi = `八字流年[${STEMS[y.stem]}(${tenGod(birth.dayStem, y.stem)})${BRANCHES[y.branch]}(藏干本气${STEMS[hidden]}·${tenGod(birth.dayStem, hidden)})]`
  return `${year}年[${gz(y.stem, y.branch)}][${y.age}虚岁] : 所属${periodLabel(period)} | ${bazi} | ${xiao}`
}

/** 流年某宫透视行 */
const yearPalaceRow = (c: Ctx, yc: YearCtx, idx: number, label: string) => {
  const pal = c.chart.palaces
  const b = mod12(yc.yBranch - idx)
  const p = pal[b]
  const names = new Set(p.stars.map((s) => s.name))
  const hits = [
    ...mutagenHits(c.chart, yc.period.stem).filter((h) => names.has(h.star)).map((h) => `大${h.mutagen}(${h.star})`),
    ...mutagenHits(c.chart, yc.yStem).filter((h) => names.has(h.star)).map((h) => `流${h.mutagen}(${h.star})`),
  ]
  const flows = [
    ...(yc.period.decade ? flowStars(yc.period.stem, yc.period.base).filter((f) => f.branch === b).map((f) => `大${f.name}`) : []),
    ...flowStars(yc.yStem, yc.yBranch).filter((f) => f.branch === b).map((f) => `流${f.name}`),
  ]
  const dp = `大${PALACE_SHORT[relativeNameIndex(yc.period.base, b)]}`
  return `流年${label}[${gz(p.stem, b)} | 叠本${PALACE_TWO[p.nameIndex]}·${dp}] : 主辅星[${mainStars(p)}] | 运限四化[${hits.length ? hits.join(', ') : '无'}] | 流曜[${flows.length ? flows.join(', ') : '无'}] | 对宫[${gz(pal[opp(b)].stem, opp(b))} ${mainStars(pal[opp(b)])}]`
}

/** 流年天干四化子树 */
const yearMutagenRows = (c: Ctx, yc: YearCtx) =>
  mutagenDetail(c, yc.yStem, yc.frames).map((h) => `${h.star}化${h.mutagen} : ${h.text}`)

/** 流年某宫宫干飞化行（[人事宫序号, 简称, 用途说明]） */
const flyRow = (c: Ctx, yc: YearCtx, idx: number, short: string, hint: string) => {
  const b = mod12(yc.yBranch - idx)
  const stem = c.chart.palaces[b].stem
  const parts = mutagenDetail(c, stem, yc.frames, b).map((h) => `${h.star}化${h.mutagen}[${h.text}]`)
  return `流${short}宫干[${STEMS[stem]}]飞化（${gz(stem, b)}，${hint}） : ${parts.join(', ')}`
}

const FLY3: [number, string, string][] = [
  [0, '命', '看全年主轴与自身动向'],
  [8, '官', '看事业动向与回报'],
  [4, '财', '看资金流向、能否入库或破耗点'],
]
const FLY5: [number, string, string][] = [
  ...FLY3,
  [2, '夫', '看感情与合作对象'],
  [5, '疾', '看身体与压力点'],
]

/** 一个流年的完整子树（不含头行），返回已带 ├ / └ 的行 */
const yearSubtree = (c: Ctx, year: number, palaces: [number, string][], fly: [number, string, string][], yearPrefix: string) => {
  const { yc } = yearCtx(c, year, yearPrefix)
  const out: string[] = []
  out.push(`├流年天干四化（${STEMS[yc.yStem]}干，含对宫照 / 冲）`)
  out.push(...branchOut('│ ', yearMutagenRows(c, yc)))
  out.push(palaces.length === 12 ? '├流年十二宫完整叠宫透视' : '├流年七大核心宫位透视')
  out.push(...branchOut('│ ', palaces.map(([idx, label]) => yearPalaceRow(c, yc, idx, label))))
  out.push('└飞星派关键宫干飞化')
  out.push(...branchOut('  ', fly.map(([idx, short, hint]) => flyRow(c, yc, idx, short, hint))))
  return out
}

// ───────────────────────── 流月 ─────────────────────────

const MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
/** 流月展开宫位：命 / 官 / 财 / 夫 / 疾 */
const MONTH5: [number, string][] = [[0, '命宫'], [8, '官禄'], [4, '财帛'], [2, '夫妻'], [5, '疾厄']]

const monthRow = (c: Ctx, yc: YearCtx, m: number) => {
  const base = monthPalace(c.chart, yc.yBranch, m)
  const stem = monthStem(yc.yStem, m)
  const frames: Frame[] = [...yc.frames, { prefix: '月', base }]
  const pal = c.chart.palaces
  // 流月各宫只标本 / 大 / 年三层叠宫（自身即流月某宫）
  const cells = MONTH5.map(([idx, label]) => {
    const b = mod12(base - idx)
    return `流月${label}[${gz(pal[b].stem, b)}/${tags(c, b, yc.frames)}]`
  })
  const muts = mutagenHits(c.chart, stem).map((h) => {
    const at = `${BRANCHES[h.branch]}/${tags(c, h.branch, frames)}`
    const o = opp(h.branch)
    return h.mutagen === '忌'
      ? `忌(${h.star}入${at} ⚠️冲${BRANCHES[o]}/${tags(c, o, frames)})`
      : `${h.mutagen}(${h.star}入${at})`
  })
  return `流月${MONTH_NAMES[m - 1]}[${gz(stem, mod12(m + 1))}] : ${cells.join(' | ')} | 流月四化[${STEMS[stem]}干: ${muts.join(', ')}]`
}

// ───────────────────────── 各模式组装 ─────────────────────────

const anchorBlock = (rows: [string, string | undefined][]) => {
  const xs = rows.filter(([, v]) => v?.trim()).map(([k, v]) => `· ${k}：${v!.trim()}`)
  return xs.length ? ['【命主现实背景锚点】', ...xs, ''] : []
}

const buildCareer = (c: Ctx, opts: ExportOptions, nowYear: number) => {
  const span = opts.span === 3 ? 3 : 5
  const start = clampYear(c.birthYear, opts.startYear ?? nowYear)
  const years = Array.from({ length: span }, (_, i) => start + i)
  const L: string[] = [careerIntro(span), '']
  L.push(...anchorBlock([['当前职业 / 商业模式', opts.occupation], ['近期核心决策问题', opts.question]]))
  L.push('【本命盘完整信息】', ...natalTree(c, opts, true), '')
  L.push(...READING_GUIDE('流'), '')

  // 大限底盘 + 交运检测
  const periods: Period[] = []
  const switches: string[] = []
  years.forEach((yr, i) => {
    const age = yr - c.birthYear + 1
    const p = periodOfAge(c, age)
    if (!periods.some((x) => x.key === p.key)) {
      periods.push(p)
      if (i > 0) {
        switches.push(
          `⚠️ 重大交运提示：${yr}年（${age}虚岁）为十年大限切换交运年，事业重心与财富逻辑将发生底层转换！（由${periodLabel(periods[periods.length - 2])}转入${periodLabel(p)}）`,
        )
      }
    }
  })
  L.push('【当前所处十年大限底盘（含交运检测）】')
  L.push(`规划区间 : ${years[0]}~${years[span - 1]}年（${years[0] - c.birthYear + 1}~${years[span - 1] - c.birthYear + 1}虚岁），涉及 ${periods.map(periodLabel).join(' → ')}`)
  if (switches.length) L.push(...switches)
  else L.push('交运检测 : 区间内未发生大限切换，全程处于同一个十年大限气候之中。')
  for (const p of periods) {
    L.push('', periodLabel(p))
    L.push(...(p.decade ? decadeBlock(c, p.decade, CORE7) : childBlock(c)))
  }
  L.push('')

  L.push(`【未来 ${span} 年逐年事业财富全展开透视表（已预计算）】`)
  years.forEach((yr, i) => {
    if (i > 0) L.push('')
    L.push(yearHead(c, yr))
    L.push(...yearSubtree(c, yr, YEAR7, FLY3, '流'))
  })
  L.push('')

  L.push('【分析输出结构要求】')
  L.push('请严格按以下四节输出：')
  L.push('一、命格商业与财富基因诊断：命主适合的赛道、赚钱方式、合作模式与天生的财务盲区。')
  L.push(`二、未来 ${span} 年攻守节奏总览评分表：用 Markdown 表格输出，列为「年份 | 攻守定调 | 事业运 | 现金流 | 资产入库 | 核心机会 | 最大风险点」，每年一行，评分用 1~10 分。`)
  L.push('三、逐年事业与财富行动指南：逐年说明该做什么、不该做什么，包含合伙、团队、投资置产的具体建议，并注明所依据的叠宫或四化数据。')
  L.push('四、核心决策拍板建议与风控铁律：针对命主的现实背景与决策问题给出明确结论，并列出必须遵守的风控底线。')
  return L
}

const buildAnnual = (c: Ctx, opts: ExportOptions, nowYear: number) => {
  const year = clampYear(c.birthYear, opts.targetYear ?? nowYear)
  const { yc } = yearCtx(c, year, '年')
  const L: string[] = [annualIntro(year), '']
  L.push(...anchorBlock([['当前职业 / 状态', opts.occupation], ['今年重点关注事项', opts.question]]))
  L.push('【本命盘完整信息】', ...natalTree(c, opts, true), '')
  L.push(...READING_GUIDE('年', true), '')

  L.push('【所属大限概要】')
  L.push(periodLabel(yc.period))
  L.push(...(yc.period.decade ? decadeBlock(c, yc.period.decade, CORE7) : childBlock(c)))
  L.push('')

  L.push(`【${year} 年流年十二宫叠宫、四化冲照与宫干飞化（已预计算）】`)
  L.push(yearHead(c, year))
  L.push(...yearSubtree(c, year, ALL12, FLY5, '年'))
  L.push('')

  L.push(`【${year} 年十二流月逐月明细（农历正月至腊月，已预计算）】`)
  L.push(...branchOut('', Array.from({ length: 12 }, (_, i) => monthRow(c, yc, i + 1))))
  L.push('')

  L.push('【分析输出结构要求】')
  L.push('请严格按以下结构输出：')
  L.push(`一、${year} 年总基调：一句话定调全年，并说明所处大限气候对今年的加持或牵制。`)
  L.push('二、四大维度详批：事业、财运、感情、健康各成一节，每节给出机会点、风险点与对应月份。')
  L.push('三、1～12 月红绿灯行动日历表：用 Markdown 表格输出，列为「农历月份 | 红绿灯(🟢进攻 / 🟡观望 / 🔴防守) | 事业 | 财运 | 感情 | 健康 | 本月最该做的一件事」，十二个月各一行。')
  L.push('四、全年三件必须做与三件绝对不做的事。')
  return L
}

const buildLife = (c: Ctx, opts: ExportOptions) => {
  const L: string[] = [LIFE_INTRO, '']
  L.push('【本命盘完整信息】', ...natalTree(c, opts, true), '')
  L.push(...READING_GUIDE(null), '')
  L.push('【前八个十年大限全景（已预计算）】')
  c.ds.slice(0, 8).forEach((d, i) => {
    if (i > 0) L.push('')
    L.push(`第${d.index + 1}大限[${gz(d.stem, d.branch)}]`)
    L.push(...decadeBlock(c, d, ALL12, true))
  })
  L.push('')
  L.push('【分析输出结构要求】')
  L.push('请严格按以下结构输出：')
  L.push('一、命格总论：格局高低、性格底色与天赋所在。')
  L.push('二、分项详批：学业、事业赛道、财富层级、婚姻感情、六亲人际、健康隐患各成一节。')
  L.push('三、八大十年大运全景：逐个大限说明人生阶段主题、起伏走势与关键转折，并给出每个大限的攻守评分（1~10 分）。')
  L.push('四、一生最关键的三个转折期与给命主的总建议。')
  return L
}

export const buildPrompt = (birth: ResolvedBirth, chart: Chart, opts: ExportOptions): string => {
  const birthYear = birth.ziwei.lunarYear
  const c: Ctx = { birth, chart, ds: decades(chart, birthYear), birthYear }
  const nowYear = new Date().getFullYear()
  let L: string[]
  switch (opts.mode) {
    case 'career':
      L = buildCareer(c, opts, nowYear)
      break
    case 'annual':
      L = buildAnnual(c, opts, nowYear)
      break
    case 'life':
      L = buildLife(c, opts)
      break
    default:
      L = [...(opts.withIntro ? [PROMPT_INTRO, ''] : []), ...natalTree(c, opts, false)]
  }
  return toLang(L.join('\n'), opts.lang)
}

export { PALACE_NAMES }
