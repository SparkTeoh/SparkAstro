import { BRANCHES, STEMS, mod12, tenGod } from '../constants/base'
import { PALACE_NAMES, PALACE_SHORT, PALACE_TWO } from '../constants/stars'
import { addMinutes, fmtClock, fmtHM, resolveBirth, type ResolvedBirth } from '../calendar'
import { computeChart, starLabel, type Chart, type Palace, type Star } from '../ziwei'
import {
  childLimitBranch, decades, flowStars, monthPalace, monthStem, mutagenHits, relativeNameIndex, yearInfo,
  type Decade,
} from '../horoscopes'
import { toLang, type Lang } from '../i18n'

/** 四大运势详批模式（弹窗 2×2 卡片） */
export type PromptMode = 'life' | 'annual' | 'career' | 'natal'
/** 全部导出模式（四大运势详批 + 独立的前置时辰定盘印证） */
export type ExportMode = PromptMode | 'rectify'

export const PROMPT_MODES: PromptMode[] = ['life', 'annual', 'career', 'natal']
export const EXPORT_MODES: ExportMode[] = ['life', 'annual', 'career', 'natal', 'rectify']

/** 时辰定盘印证的候选范围：前后三时辰 / 与上一时辰二选一 / 与下一时辰二选一 */
export type RectifyScope = 'three' | 'prev' | 'next'

/** 起始 / 目标年份可选范围：出生年 ~ 出生年 + 95 */
export const YEAR_SPAN_LIMIT = 95

/** 当前状态（单选，可不选） */
export type StatusKey = 'employee' | 'business' | 'invest' | 'study'
/** 婚姻感情状态（单选，可不选） */
export type MaritalKey = 'single' | 'dating' | 'married' | 'divorced'
/** 子女状态（单选，可不选） */
export type KidsKey = 'hasKids' | 'noKids'
/** 重点关注方向（多选，不选 = 全面综合分析） */
export type FocusKey = 'wealth' | 'jobchange' | 'partner' | 'love' | 'health'

export interface Chip<K extends string> {
  key: K
  icon: string
  /** 不含图标的文案（写入导出文本） */
  text: string
}

export const STATUS_CHIPS: Chip<StatusKey>[] = [
  { key: 'employee', icon: '🏢', text: '上班受薪' },
  { key: 'business', icon: '🚀', text: '做生意 / 自由执业' },
  { key: 'invest', icon: '📈', text: '关注财务与资产' },
  { key: 'study', icon: '🌱', text: '求学进修 / 转型探索' },
]

export const MARITAL_CHIPS: Chip<MaritalKey>[] = [
  { key: 'single', icon: '🙂', text: '单身' },
  { key: 'dating', icon: '💑', text: '恋爱 / 有伴侣' },
  { key: 'married', icon: '💍', text: '已婚' },
  { key: 'divorced', icon: '🕊️', text: '离异 / 单亲' },
]

export const KIDS_CHIPS: Chip<KidsKey>[] = [
  { key: 'hasKids', icon: '👶', text: '有孩子' },
  { key: 'noKids', icon: '🌿', text: '暂无孩子' },
]

export const FOCUS_CHIPS: Chip<FocusKey>[] = [
  { key: 'wealth', icon: '💰', text: '事业突破与财运规划' },
  { key: 'jobchange', icon: '🔀', text: '转职跳槽 / 新机会评估' },
  { key: 'partner', icon: '🤝', text: '合作合伙 / 贵人与人际' },
  { key: 'love', icon: '❤️', text: '感情婚姻 / 正缘与相处' },
  { key: 'health', icon: '🌿', text: '身心健康 / 家庭与置产' },
]

/** 芯片在界面上的完整文案（图标 + 文字） */
export const chipLabel = (c: Chip<string>) => `${c.icon} ${c.text}`

/** 百业中立的现代命理师人设：去金融商学院暗示词，留足读盘空间 */
const PERSONA_LEAD =
  '你现在是一位深谙紫微斗数（三合、钦天四化、飞星）与子平八字的资深现代命理师，阅人无数，熟悉社会百业的真实运作与现代两性家庭关系，擅长把盘面象义化作平实通透的大白话。下方命盘与运限叠宫、四化冲照均已由程序精确算好，请直接据此解盘，无需自行重排。'

/** 少即是多的四条核心准则：零行业诱导、零固定台词、不捆绑发挥 */
export const PROMPT_PRINCIPLES = [
  '【解盘准则】',
  '1. 客观坦诚，忠于盘格：实事求是，不迎合拍马屁，不说谁都适用的模糊套话；关键判断自然点明星曜四化依据。看事业与求财方向时，忠于本盘星曜独特的刚柔、动静、虚实特质推导适合的做事方式与领域，切勿对不同命盘套用同质化的万金油职业标签。',
  '2. 顺势赋能，不造焦虑：重在“知天时以顺势而为”。顺风期点明优势鼓励把握；逢化忌冲照或煞星波动期，客观讲清卡点并给出具体可行的应对建议，让人听完心里踏实、有方向。',
  '3. 同盘不同命，紧扣现实：若下方提供了命主的工作、婚育或过往近况，须结合现实底子校准各宫位象义，切勿脱离实际生搬硬套。',
  '4. 像当面聊天一样先交个底：不必套公文模板或生硬表格，第一轮先把核心底子与命主关心的事聊透即可；结尾自然点出一两个盘里值得深挖的细节，方便命主接着追问。',
].join('\n')

/** 通用全盘导语（natal 模式勾选「附带现代命理师解盘导语」时使用） */
export const PROMPT_INTRO =
  `${PERSONA_LEAD}本次命主想请你通盘看看性格天赋、事业财运、感情婚姻与人生关键阶段的顺逆节奏。`

const careerIntro = (n: number) =>
  `${PERSONA_LEAD}本次命主想看未来 ${n} 年的运势起伏、进退节奏与关键转折。`

const annualIntro = (year: number) =>
  `${PERSONA_LEAD}本次命主想细看 ${year} 年这一整年及农历十二个流月的顺逆节奏与发力时机。`

const LIFE_INTRO =
  `${PERSONA_LEAD}本次命主想通盘了解自己的一生总格局与前八个十年大运的起伏脉络（无需展开逐年流年）。`

const rectifyIntro = (count: number, hasEvents: boolean) =>
  `${PERSONA_LEAD}命主的出生时间存在时辰不确定（或刚好落在时辰交界处），普通人自己看不懂盘面差异，需要你帮忙做「时辰定盘印证」。下面已由程序按 C5VUC 标准精确排出了 ${count} 张候选时辰的命盘核心结构与过往关键流年核验数据（请直接引用这些预计算数据，不要自行重新排盘或心算四化）。\n\n` +
  '【定盘对比铁律（请严格执行）】\n' +
  '· 严禁说两头讨好、放之四海皆准的模糊套话（拒绝巴纳姆效应）！你必须把这几张候选盘并排放在一起，只抓它们之间「反差最强烈、最非黑即白」的 5 个硬特征，用大白话写成一份让命主一眼就能对号入座的核对清单：\n' +
  '  1. 内在性格与遇事本能（看命宫、身宫、福德宫：遇事是风风火火先冲再说，还是反复权衡容易内耗？抗压模式有何本质反差？）\n' +
  '  2. 原生家庭与早年印记（看父母宫、田宅宫与首限：与父母谁更投缘或更有距离感？早年家风管教与成长环境有何不同？）\n' +
  '  3. 赚钱直觉与花钱习惯（看财帛宫、官禄宫、田宅宫：手松重体验还是极重存钱安全感？偏稳健受薪还是偏折腾博弈？）\n' +
  '  4. 感情与人际互动模式（看夫妻宫、交友宫：在亲密关系里习惯照顾主导还是需要独立空间？容易卡在什么互动痛点？）\n' +
  '  5. 过往关键流年体感盲测（结合下方预计算的过往流年叠宫与四化冲照，直接点明：“如果你是 A 盘，在 20XX 年大概率经历了……；如果你是 B 盘，反而在 20XX 年经历了……”）。\n' +
  (hasEvents
    ? '· 命主已在下方提供了几件过往真实发生的大事：请严禁为了圆场而强行附会！务必逐一诚实比对这些年份事件与哪一张候选盘的流年叠宫、四化冲照真正咬合，明确给出各候选盘的匹配度排序与你的定盘倾向；若还差一两个细节才能百分百拍板，结尾请再追问 1～2 个一锤定音的核对问题。'
    : '· 命主尚未填写过往事件（纯盲测模式）：请在对比完上述 5 大反差后，在结尾像经验老道的命理师当面定盘一样，向命主列出 4～5 道简短直白的核对选择题（并请命主顺手补充一两件过去真实发生过的年份大事），约定下一轮直接帮命主拍板锁定真实时辰。')

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
 * 宫位子树（树状结构，已含 ├ / └ / │ 树枝符号，调用方只需加外层缩进前缀）
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
  /** career / annual / life：当前状态芯片（单选，可不选） */
  status?: StatusKey | null
  /** career / annual / life：婚姻感情状态芯片（单选，可不选） */
  marital?: MaritalKey | null
  /** career / annual / life：子女状态芯片（单选，可不选） */
  kids?: KidsKey | null
  /** career / annual / life：具体工作 / 行业与角色（选填） */
  occupation?: string
  /** career / annual / life：过去 1～3 年经营 / 发展与生活近况（选填） */
  pastContext?: string
  /** career / annual：重点关注方向芯片（多选；不选 = 全面综合分析，核心宫位全部展开） */
  focus?: FocusKey[]
  /** career / annual / life：命主具体想问的问题 / 补充背景（留空不输出） */
  question?: string
  /** rectify：候选时辰对比范围（默认 next：当前真太阳时辰 vs 下一时辰/原钟表时辰） */
  rectifyScope?: RectifyScope
  /** rectify：过往关键年份大事记（选填，用于验盘校准；留空走纯盲测模式） */
  pastEvents?: string
  /** natal：是否附带通用大师解盘导语（默认不附带） */
  withIntro?: boolean
  /** 测试或外部指定当前公历年（默认当年） */
  nowYear?: number
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

const focusHas = (focus: FocusKey[] | undefined, k: FocusKey) => !focus?.length || focus.includes(k)

/**
 * 按勾选的关注方向动态扩展核心宫位（人事宫序号）。
 * 基础：命 / 官 / 财 / 迁 / 田；合作 +兄 / 友；感情 +夫 / 福 / 子；健康家庭 +疾 / 父。
 * 未勾选任何方向 = 全面综合分析，全部展开。使用原生中性宫名，不加商业/金融括号暗示。
 */
export const corePalaceIndexes = (focus?: FocusKey[]) => {
  const idx = [0, 8, 4, 6, 9]
  if (focusHas(focus, 'partner')) idx.push(1, 7)
  if (focusHas(focus, 'love')) idx.push(2, 10, 3)
  if (focusHas(focus, 'health')) idx.push(5, 11)
  return idx
}
const corePalaces = (focus?: FocusKey[]): [number, string][] =>
  corePalaceIndexes(focus).map((i) => [i, PALACE_TWO[i]])

const ALL12: [number, string][] = PALACE_TWO.map((n, i) => [i, n])
/** life 模式重点宫位：命 / 官 / 财 / 夫 / 田 / 福 / 疾 */
const LIFE_KEY = new Set([0, 8, 4, 2, 9, 10, 5])

const flowStarText = (prefix: string, stem: number, branch: number) =>
  flowStars(stem, branch).map((f) => `${prefix}${f.name}[${BRANCHES[f.branch]}]`).join(', ')

/** 树状输出小工具：把若干行挂到同一父节点下，自动选用 ├ / └ */
const branchOut = (pre: string, rows: string[]) => rows.map((r, i) => `${pre}${i === rows.length - 1 ? '└' : '├'}${r}`)

// ───────────────────────── 本命盘（树状结构） ─────────────────────────

const natalTree = (c: Ctx, opts: ExportOptions, withDayun: boolean) => {
  const { birth, chart } = c
  const pal = chart.palaces
  const L: string[] = []
  const push = (s: string) => L.push(s)
  push('紫微斗数命盘数据')
  push('│')
  push('├排盘标准 : 三合钦天四化通用盘')
  push('├安星参数 : C5VUC')
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
  push(`│ ├钟表时间 : ${fmtClock(birth.clock)}`)
  push(`│ ├真太阳时 : ${fmtClock(birth.trueSolar)}`)
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
const decadeBlock = (c: Ctx, d: Decade, palaces: [number, string][], title: string, markKey = false) => {
  const frames: Frame[] = [{ prefix: '大', base: d.branch }]
  const pal = c.chart.palaces
  const out: string[] = [
    `├大限区间 : ${d.ageStart}~${d.ageEnd}虚岁 | ${d.yearStart}~${d.yearEnd}年 | 大限命宫[${gz(d.stem, d.branch)}]叠本命${PALACE_TWO[pal[d.branch].nameIndex]}`,
    `├对应八字大运 : ${dayunOverlap(c.birth, d.yearStart, d.yearEnd)}`,
  ]
  out.push(`├${title}`)
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

type FlyRow = [number, string, string]
const FLY_BASE: FlyRow[] = [
  [0, '命', '看全年主轴与自身动向'],
  [8, '官', '看事业动向与回报'],
  [4, '财', '看资金流向、能否入库或破耗点'],
]
const FLY_LOVE: FlyRow = [2, '夫', '看感情互动与正缘动向']
const FLY_HEALTH: FlyRow = [5, '疾', '看身体与压力点']
const FLY_ALL: FlyRow[] = [...FLY_BASE, FLY_LOVE, FLY_HEALTH]

/** 按关注方向动态追加流夫 / 流疾宫干飞化 */
const flyRows = (focus?: FocusKey[]): FlyRow[] => [
  ...FLY_BASE,
  ...(focusHas(focus, 'love') ? [FLY_LOVE] : []),
  ...(focusHas(focus, 'health') ? [FLY_HEALTH] : []),
]

/** 一个流年的完整子树（不含头行），返回已带 ├ / └ 的行 */
const yearSubtree = (c: Ctx, year: number, palaces: [number, string][], title: string, fly: FlyRow[], yearPrefix: string) => {
  const { yc } = yearCtx(c, year, yearPrefix)
  const out: string[] = []
  out.push(`├流年天干四化（${STEMS[yc.yStem]}干，含对宫照 / 冲）`)
  out.push(...branchOut('│ ', yearMutagenRows(c, yc)))
  out.push(`├${title}`)
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

/** 【命主背景与核心关注问题】：全部未填时整块不输出 */
const backgroundBlock = (opts: ExportOptions, showDefaultFocus = true) => {
  const st = STATUS_CHIPS.find((s) => s.key === opts.status)
  const ma = MARITAL_CHIPS.find((m) => m.key === opts.marital)
  const kd = KIDS_CHIPS.find((k) => k.key === opts.kids)
  const occ = opts.occupation?.trim()
  const past = opts.pastContext?.trim()
  const fs = FOCUS_CHIPS.filter((f) => opts.focus?.includes(f.key))
  const q = opts.question?.trim()
  if (!st && !ma && !kd && !occ && !past && !fs.length && !q) return []
  const rows = ['【命主背景与核心关注问题】']
  if (st) rows.push(`· 当前状态：${st.text}`)
  if (occ) rows.push(`· 具体工作与行业角色：${occ}`)
  const family = [ma?.text, kd?.text].filter(Boolean).join('，')
  if (family) rows.push(`· 婚姻与家庭状态：${family}`)
  if (past) rows.push(`· 过去 1～3 年经营与生活近况：${past}`)
  if (showDefaultFocus || fs.length) {
    rows.push(`· 重点关注方向：${fs.length ? fs.map((f) => f.text).join('；') : '未特别指定，请做全面综合分析'}`)
  }
  if (q) rows.push(`· 命主具体想问的问题 / 补充背景：${q}`)
  return [...rows, '']
}

const buildCareer = (c: Ctx, opts: ExportOptions, nowYear: number) => {
  const span = opts.span === 3 ? 3 : 5
  const start = clampYear(c.birthYear, opts.startYear ?? nowYear)
  const years = Array.from({ length: span }, (_, i) => start + i)
  const palaces = corePalaces(opts.focus)
  const fly = flyRows(opts.focus)
  const L: string[] = [careerIntro(span), '', PROMPT_PRINCIPLES, '']
  L.push(...backgroundBlock(opts))
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
          `⚠️ 重大交运提示：${yr}年（${age}虚岁）为十年大限切换交运年，人生重心与运势逻辑将发生底层转换！（由${periodLabel(periods[periods.length - 2])}转入${periodLabel(p)}）`,
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
    L.push(...(p.decade ? decadeBlock(c, p.decade, palaces, `大限核心宫位映射（${palaces.length} 宫）`) : childBlock(c)))
  }
  L.push('')

  L.push(`【未来 ${span} 年逐年运势全展开透视表（已预计算）】`)
  years.forEach((yr, i) => {
    if (i > 0) L.push('')
    L.push(yearHead(c, yr))
    L.push(...yearSubtree(c, yr, palaces, `流年核心宫位透视（${palaces.length} 宫）`, fly, '流'))
  })
  return L
}

const buildAnnual = (c: Ctx, opts: ExportOptions, nowYear: number) => {
  const year = clampYear(c.birthYear, opts.targetYear ?? nowYear)
  const { yc } = yearCtx(c, year, '年')
  const dPalaces = corePalaces(opts.focus)
  const L: string[] = [annualIntro(year), '', PROMPT_PRINCIPLES, '']
  L.push(...backgroundBlock(opts))
  L.push('【本命盘完整信息】', ...natalTree(c, opts, true), '')
  L.push(...READING_GUIDE('年', true), '')

  L.push('【所属大限概要】')
  L.push(periodLabel(yc.period))
  L.push(...(yc.period.decade ? decadeBlock(c, yc.period.decade, dPalaces, `大限核心宫位映射（${dPalaces.length} 宫）`) : childBlock(c)))
  L.push('')

  L.push(`【${year} 年流年十二宫叠宫、四化冲照与宫干飞化（已预计算）】`)
  L.push(yearHead(c, year))
  L.push(...yearSubtree(c, year, ALL12, '流年十二宫完整叠宫透视', FLY_ALL, '年'))
  L.push('')

  L.push(`【${year} 年十二流月逐月明细（农历正月至腊月，已预计算）】`)
  L.push(...branchOut('', Array.from({ length: 12 }, (_, i) => monthRow(c, yc, i + 1))))
  return L
}

const buildLife = (c: Ctx, opts: ExportOptions) => {
  const L: string[] = [LIFE_INTRO, '', PROMPT_PRINCIPLES, '']
  L.push(...backgroundBlock(opts, false))
  L.push('【本命盘完整信息】', ...natalTree(c, opts, true), '')
  L.push(...READING_GUIDE(null), '')
  L.push('【前八个十年大限全景（已预计算）】')
  c.ds.slice(0, 8).forEach((d, i) => {
    if (i > 0) L.push('')
    L.push(`第${d.index + 1}大限[${gz(d.stem, d.branch)}]`)
    L.push(...decadeBlock(c, d, ALL12, '大限十二宫映射（★ 为重点宫位）', true))
  })
  return L
}

// ───────────────────────── 时辰定盘印证（多盘对比 + 过往流年核验） ─────────────────────────

/** 定盘按重要性排列十二宫：命 / 福 / 官 / 财 / 夫 / 父 / 田 / 迁 / 疾 / 子 / 兄 / 友 */
const RECTIFY_PALACE_ORDER = [0, 10, 8, 4, 2, 11, 9, 6, 5, 3, 1, 7]
/** 过往流年核验聚焦六大高体感宫位：命 / 官 / 财 / 夫 / 田 / 疾 */
const RECTIFY_YEAR_PALACES: [number, string][] = [
  [0, '命宫'], [8, '官禄'], [4, '财帛'], [2, '夫妻'], [9, '田宅'], [5, '疾厄'],
]
const RECTIFY_FLY: FlyRow[] = [...FLY_BASE, FLY_LOVE]

const shiftedCandidate = (baseBirth: ResolvedBirth, baseChart: Chart, offsetHours: number) => {
  if (offsetHours === 0) return { birth: baseBirth, chart: baseChart }
  const c = addMinutes(baseBirth.clock, offsetHours * 120)
  const birth = resolveBirth({
    ...baseBirth.input,
    calendar: 'solar',
    isLeapMonth: false,
    year: c.y,
    month: c.m,
    day: c.d,
    hour: c.h,
    minute: c.mi,
  })
  const chart = computeChart({ ...birth.ziwei, gender: baseBirth.input.gender, plate: baseChart.params.plate })
  return { birth, chart }
}

/** 提取过往核验年份：最近 5 个已过完整年份 + 用户在过往大事记里提到的具体年份（最多取 8 个） */
export const pickVerifyYears = (birthYear: number, nowYear: number, pastEvents?: string): number[] => {
  const set = new Set<number>()
  for (let y = nowYear - 5; y <= nowYear - 1; y++) {
    if (y >= birthYear) set.add(y)
  }
  if (pastEvents) {
    for (const m of pastEvents.matchAll(/\b(19\d{2}|20\d{2})\b/g)) {
      const y = Number(m[1])
      if (y >= birthYear && y <= nowYear) set.add(y)
    }
  }
  if (!set.size) set.add(Math.max(birthYear, nowYear))
  return [...set].sort((a, b) => a - b).slice(-8)
}

const candidateBlock = (label: string, tag: string, cand: { birth: ResolvedBirth; chart: Chart }, nowYear: number, pastEvents?: string) => {
  const { birth, chart } = cand
  const birthYear = birth.ziwei.lunarYear
  const c: Ctx = { birth, chart, ds: decades(chart, birthYear), birthYear }
  const pal = chart.palaces
  const lifeP = pal[chart.lifeIndex]
  const bodyP = pal[chart.bodyIndex]
  const laiyinP = chart.laiyin !== null ? pal[chart.laiyin] : pal.find((x) => x.isLaiyin) ?? null
  const laiyinTag = laiyinP ? ` | 来因[${gz(laiyinP.stem, laiyinP.branch)}·${PALACE_TWO[laiyinP.nameIndex]}]` : ''
  const curAge = Math.max(1, nowYear - birthYear + 1)
  const curPeriod = periodOfAge(c, curAge)
  const years = pickVerifyYears(birthYear, nowYear, pastEvents)

  const out: string[] = [
    `【${label}｜${BRANCHES[birth.ziwei.hour]}时盘（${tag} · 真太阳时 ${fmtHM(birth.trueSolar)}）】`,
    `├时间换算 : 钟表 ${fmtClock(birth.clock)} -> 真太阳时 ${fmtClock(birth.trueSolar)} | 农历 : ${birth.lunarText}`,
    `├盘局锚点 : 节气四柱[${birth.jieqiPillars.join(' ')}] | ${chart.bureau.name} | 命宫[${gz(lifeP.stem, lifeP.branch)}] | 身宫[${gz(bodyP.stem, bodyP.branch)}·${PALACE_TWO[bodyP.nameIndex]}]${laiyinTag} | 命主:${chart.lifeMaster} 身主:${chart.bodyMaster}`,
    `├八字大运 : ${dayunLine(birth)}`,
    '├本命十二宫主辅星与四化结构（按定盘关键度排序）',
  ]
  const palaceRows = RECTIFY_PALACE_ORDER.map((nameIdx) => {
    const p = pal.find((x) => x.nameIndex === nameIdx)!
    const marks = `${p.isBody ? '[身宫]' : ''}${p.isLaiyin ? '[来因]' : ''}`
    return `${PALACE_NAMES[nameIdx]}[${gz(p.stem, p.branch)}]${marks} : 主辅星[${mainStars(p)}] | 对宫[${gz(pal[opp(p.branch)].stem, opp(p.branch))} ${mainStars(pal[opp(p.branch)])}]`
  })
  out.push(...branchOut('│ ', palaceRows))

  if (curPeriod.decade) {
    const d = curPeriod.decade
    out.push(
      `├当前所处大限 : 第${d.index + 1}大限[${gz(d.stem, d.branch)}]（${d.ageStart}~${d.ageEnd}虚岁，${d.yearStart}~${d.yearEnd}年）叠本命${PALACE_TWO[pal[d.branch].nameIndex]} | 大限四化 : ${mutagenInline(c, d.stem, [{ prefix: '大', base: d.branch }])}`,
    )
  } else {
    out.push(`├当前所处运限 : 童限（${curAge}虚岁）`)
  }

  out.push(`└过往关键流年核验轨迹（${years[0]}~${years[years.length - 1]}年，已预计算）`)
  years.forEach((yr, i) => {
    const last = i === years.length - 1
    const pre = last ? '    ' : '  │ '
    const { yc } = yearCtx(c, yr, '流')
    out.push(`  ${last ? '└' : '├'}${yearHead(c, yr)}`)
    out.push(`${pre}├流年四化 : ${mutagenInline(c, yc.yStem, yc.frames)}`)
    out.push(`${pre}├重点叠宫 : ${RECTIFY_YEAR_PALACES.map(([idx, nm]) => yearPalaceRow(c, yc, idx, nm)).join(' ； ')}`)
    out.push(`${pre}└关键飞化 : ${RECTIFY_FLY.map(([idx, s, h]) => flyRow(c, yc, idx, s, h)).join(' ； ')}`)
  })
  return out
}

const buildRectify = (c: Ctx, opts: ExportOptions, nowYear: number) => {
  const scope: RectifyScope = opts.rectifyScope ?? 'next'
  const offsets: { offset: number; tag: string }[] =
    scope === 'next'
      ? [
          { offset: 0, tag: '当前真太阳时辰候选' },
          { offset: 1, tag: '下一时辰 / 原钟表时辰候选' },
        ]
      : scope === 'prev'
        ? [
            { offset: -1, tag: '上一时辰候选' },
            { offset: 0, tag: '当前真太阳时辰候选' },
          ]
        : [
            { offset: -1, tag: '上一时辰候选' },
            { offset: 0, tag: '当前真太阳时辰候选' },
            { offset: 1, tag: '下一时辰候选' },
          ]
  const letters = ['A', 'B', 'C']
  const events = opts.pastEvents?.trim()
  const L: string[] = [rectifyIntro(offsets.length, !!events), '', PROMPT_PRINCIPLES, '']
  L.push(...backgroundBlock(opts, false))
  if (events) {
    L.push('【命主提供的过往真实大事记（请据此严格核验各候选盘，切勿强行附会）】', events, '')
  }
  L.push(
    '紫微斗数命盘数据',
    '│',
    '├排盘标准 : 三合钦天四化通用盘',
    '├安星参数 : C5VUC',
    '├符号定义',
    '│ ├(↓:离心自化)',
    '│ ├(↑:向心自化，从对宫化入)',
    '│ ├(┏ : 生日前小限)',
    '│ └( ┓: 生日后小限)',
    `└定盘模式 : 共 ${offsets.length} 张候选时辰命盘并排核验（性别:${c.birth.input.gender === 'male' ? '男' : '女'} | 出生地经度:${c.birth.input.longitude}）`,
    '',
    ...READING_GUIDE('流'),
    '',
  )
  offsets.forEach(({ offset, tag }, idx) => {
    if (idx > 0) L.push('')
    const cand = shiftedCandidate(c.birth, c.chart, offset)
    L.push(...candidateBlock(`候选盘 ${letters[idx]}`, tag, cand, nowYear, events))
  })
  return L
}

export const buildPrompt = (birth: ResolvedBirth, chart: Chart, opts: ExportOptions): string => {
  const birthYear = birth.ziwei.lunarYear
  const c: Ctx = { birth, chart, ds: decades(chart, birthYear), birthYear }
  const nowYear = opts.nowYear ?? new Date().getFullYear()
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
    case 'rectify':
      L = buildRectify(c, opts, nowYear)
      break
    default:
      L = [...(opts.withIntro ? [PROMPT_INTRO, '', PROMPT_PRINCIPLES, ''] : []), ...natalTree(c, opts, false)]
  }
  return toLang(L.join('\n'), opts.lang)
}

export { PALACE_NAMES }
