import type { BirthInput } from '../core/calendar'
import { DEFAULT_PLACE_ID, findPlace } from '../core/constants/locations'

export interface SavedCase {
  id: string
  createdAt: number
  updatedAt: number
  input: BirthInput
  note?: string
}

const KEY = 'ziwei-c5vuc-cases'
const LAST_KEY = 'ziwei-c5vuc-last'

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* 存储不可用时忽略 */
  }
}

export const loadCases = (): SavedCase[] => {
  try {
    const v = JSON.parse(safeGet(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((c) => c && c.input) : []
  } catch {
    return []
  }
}
export const saveCases = (cases: SavedCase[]) => safeSet(KEY, JSON.stringify(cases))

const png = findPlace(DEFAULT_PLACE_ID)!
export const DEFAULT_INPUT: BirthInput = {
  name: '示例命例',
  gender: 'male',
  calendar: 'solar',
  year: 1995,
  month: 6,
  day: 16,
  hour: 22,
  minute: 30,
  isLeapMonth: false,
  longitude: png.lon,
  tz: 8,
  dst: false,
  placeId: png.id,
  placeName: png.name,
}

/** 上次排过的盘；从未排过盘时返回 null（入口页据此决定是否显示「上次排盘」） */
export const loadLastInput = (): BirthInput | null => {
  try {
    const v = JSON.parse(safeGet(LAST_KEY) ?? 'null')
    if (v && typeof v.year === 'number') return { ...DEFAULT_INPUT, ...v }
  } catch {
    /* ignore */
  }
  return null
}
export const saveLastInput = (i: BirthInput) => safeSet(LAST_KEY, JSON.stringify(i))

/** 入口页空白表单的初始值（不带姓名，避免出现陌生人的默认命盘） */
export const BLANK_INPUT: BirthInput = { ...DEFAULT_INPUT, name: '', year: 1990, month: 1, day: 1, hour: 12, minute: 0 }

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

const pad = (n: number) => String(n).padStart(2, '0')
/** 命例一行描述（简体，显示时再转换） */
export const caseDesc = (i: BirthInput) =>
  `${i.calendar === 'lunar' ? '农历' : '公历'} ${i.year}-${pad(i.month)}-${pad(i.day)} ${pad(i.hour)}:${pad(i.minute)} · ${i.gender === 'male' ? '男' : '女'} · ${i.placeName}`

const sameInput = (a: BirthInput, b: BirthInput) => JSON.stringify(a) === JSON.stringify(b)
export const findSameCase = (cases: SavedCase[], input: BirthInput) => cases.find((c) => sameInput(c.input, input))

/** 写入 / 更新命例：传入 id 时更新该条；否则若已有完全相同的生辰则只刷新时间，没有才新增 */
export const upsertCase = (cases: SavedCase[], input: BirthInput, id?: string | null, now = Date.now()): SavedCase[] => {
  const target = (id ? cases.find((c) => c.id === id) : undefined) ?? findSameCase(cases, input)
  if (target) return cases.map((c) => (c.id === target.id ? { ...c, input, updatedAt: now } : c))
  return [...cases, { id: newId(), createdAt: now, updatedAt: now, input }]
}

export const casesToJson = (cases: SavedCase[]) => JSON.stringify({ app: 'ziwei-c5vuc', version: 1, cases }, null, 2)

/** 解析导入的 JSON 并与现有命例合并（id 冲突时换新 id）；格式不对时抛错 */
export const mergeImportedCases = (cases: SavedCase[], json: string) => {
  const data = JSON.parse(json)
  const arr: SavedCase[] = Array.isArray(data) ? data : data?.cases
  if (!Array.isArray(arr)) throw new Error('bad format')
  const valid = arr.filter((c) => c && c.input && typeof c.input.year === 'number')
  const ids = new Set(cases.map((c) => c.id))
  return { merged: [...cases, ...valid.map((c) => (ids.has(c.id) ? { ...c, id: newId() } : c))], count: valid.length }
}

/** 浏览器下载文本文件 */
export const downloadText = (filename: string, text: string, type: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
