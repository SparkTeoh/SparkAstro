import { addMinutes, fmtHM, resolveBirth, type BirthInput } from '../core/calendar'
import { BRANCHES, mod12 } from '../core/constants/base'

/** 一个时辰 = 120 分钟 */
export const HOUR_STEP_MINUTES = 120

/**
 * 时辰对比状态：
 * baseInput = 用户正式设定的原始生辰（入口页提交 / 修改资料 / 加载命例）；
 * hourOffset = 相对原始生辰偏移的时辰数（0 = 原时辰，-1 = 上一时辰，+1 = 下一时辰）。
 */
export interface HourShiftState {
  baseInput: BirthInput
  hourOffset: number
}

export type HourShiftAction =
  | { type: 'prev' }
  | { type: 'next' }
  /** ↺ 回原时辰：分秒不差回到原输入 */
  | { type: 'reset' }
  /** ✓ 设为真实时辰：把当前偏移后的生辰固化为新的原始生辰 */
  | { type: 'commit' }
  /** 正式设定一份新的生辰 */
  | { type: 'set'; input: BirthInput }
  /** 中宫 日↑/日↓/时↑/时↓：在当前生效生辰上直接偏移并固化 */
  | { type: 'shift'; minutes: number }

/** 把生辰按钟表时间偏移若干分钟，结果统一为公历输入 */
export const shiftInput = (input: BirthInput, minutes: number): BirthInput => {
  const c = addMinutes(resolveBirth(input).clock, minutes)
  return { ...input, calendar: 'solar', isLeapMonth: false, year: c.y, month: c.m, day: c.d, hour: c.h, minute: c.mi }
}

/** 当前实际用于排盘的生辰：偏移为 0 时就是原始输入本身（同一引用） */
export const effectiveInput = (s: HourShiftState): BirthInput =>
  s.hourOffset === 0 ? s.baseInput : shiftInput(s.baseInput, s.hourOffset * HOUR_STEP_MINUTES)

export const hourShiftReducer = (s: HourShiftState, a: HourShiftAction): HourShiftState => {
  switch (a.type) {
    case 'prev':
      return { ...s, hourOffset: s.hourOffset - 1 }
    case 'next':
      return { ...s, hourOffset: s.hourOffset + 1 }
    case 'reset':
      return s.hourOffset === 0 ? s : { ...s, hourOffset: 0 }
    case 'commit':
      return s.hourOffset === 0 ? s : { baseInput: effectiveInput(s), hourOffset: 0 }
    case 'set':
      return { baseInput: a.input, hourOffset: 0 }
    case 'shift':
      return { baseInput: shiftInput(effectiveInput(s), a.minutes), hourOffset: 0 }
  }
}

/** 时辰对比栏文案（简体，显示时再转换） */
export interface HourBarInfo {
  offset: number
  /** 当前排盘所用时辰，如「申时」 */
  current: string
  prev: string
  next: string
  /** 当前排盘的真太阳时 HH:mm */
  trueSolar: string
  prevLabel: string
  nextLabel: string
  /** 主行：「当前：申时（真太阳时 15:58）」或「对比中：未时（较原时间 -1 时辰）」 */
  title: string
}

export const hourBarInfo = (s: HourShiftState): HourBarInfo => {
  const birth = resolveBirth(effectiveInput(s))
  const cur = birth.ziwei.hour
  const name = (b: number) => BRANCHES[mod12(b)] + '时'
  const current = name(cur)
  const prev = name(cur - 1)
  const next = name(cur + 1)
  const trueSolar = fmtHM(birth.trueSolar)
  const offset = s.hourOffset
  return {
    offset, current, prev, next, trueSolar,
    prevLabel: `◀ 上一时辰 (${prev})`,
    nextLabel: `下一时辰 (${next}) ▶`,
    title:
      offset === 0
        ? `当前：${current}（真太阳时 ${trueSolar}）`
        : `对比中：${current}（较原时间 ${offset > 0 ? '+' : ''}${offset} 时辰）`,
  }
}
