import { S2T_CHARS } from './charmap'

export type Lang = 'zh-Hans' | 'zh-Hant'

/**
 * 术数专用简 -> 繁 映射。
 * 1) 先做词组级替换（优先级最高，处理一简对多繁）；
 * 2) 再做单字替换；受保护字（丑、干、斗……）不在单字表里，原样保留。
 */
const PHRASES: [string, string][] = [
  ['钟表', '鐘錶'],
  ['备注', '備註'],
  ['注释', '註釋'],
  ['分钟', '分鐘'],
  ['吊客', '弔客'],
  ['飞廉', '飛廉'],
  ['蜚廉', '蜚廉'],
  ['皇后', '皇后'],
  ['历史', '歷史'],
  ['经历', '經歷'],
  ['公里', '公里'],
  ['关系', '關係'],
  ['联系', '聯繫'],
  ['批准', '批准'],
  ['天干', '天干'],
  ['干支', '干支'],
  ['斗数', '斗數'],
  ['斗君', '斗君'],
  ['台湾', '臺灣'],
  ['后天', '後天'],
  ['征战', '征戰'],
  ['复制', '複製'],
]

/** 受保护 / 一简多繁的单字默认取向 */
const CHAR_OVERRIDES: Record<string, string> = {
  丑: '丑',
  干: '干',
  斗: '斗',
  后: '後',
  历: '曆',
  台: '臺',
  系: '系',
  发: '發',
  里: '裡',
  面: '面',
  只: '只',
  余: '餘',
  征: '徵',
  借: '借',
  准: '準',
  钟: '鐘',
  表: '表',
  吊: '吊',
  蜚: '蜚',
  冲: '沖',
  于: '於',
  范: '範',
  制: '制',
  云: '雲',
  尽: '盡',
  咸: '咸',
  岁: '歲',
  凶: '凶',
  谷: '谷',
  松: '松',
}

const S2T: Record<string, string> = { ...S2T_CHARS, ...CHAR_OVERRIDES }

// 将词组替换为占位符，避免被单字表二次转换
const PH_START = 0xe000
export const toTraditional = (text: string) => {
  let out = text
  const saved: string[] = []
  for (const [s, t] of PHRASES) {
    if (out.includes(s)) {
      const token = String.fromCharCode(PH_START + saved.length)
      saved.push(t)
      out = out.split(s).join(token)
    }
  }
  let res = ''
  for (const ch of out) {
    const code = ch.charCodeAt(0)
    if (code >= PH_START && code < PH_START + saved.length) res += saved[code - PH_START]
    else res += S2T[ch] ?? ch
  }
  return res
}

export const toLang = (text: string, lang: Lang) => (lang === 'zh-Hant' ? toTraditional(text) : text)
