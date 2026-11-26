import { Lunar, Solar } from 'lunar-javascript'
import {
  BRANCHES, LUNAR_MONTH_NAMES, STEMS, branchIndex, hourToBranch, isYangStem, lunarDayName, mod, mod12,
  ratStartStem, stemIndex, tenGod, tigerStartStem,
} from '../constants/base'

export interface DateTime {
  y: number
  m: number
  d: number
  h: number
  mi: number
}

export type Gender = 'male' | 'female'

export interface BirthInput {
  name: string
  gender: Gender
  calendar: 'solar' | 'lunar'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  isLeapMonth: boolean
  longitude: number
  tz: number // 标准时区小时，如 8、7.5
  dst: boolean
  placeId: string
  placeName: string
}

const toMs = (t: DateTime) => Date.UTC(t.y, t.m - 1, t.d, t.h, t.mi)
const fromMs = (ms: number): DateTime => {
  const d = new Date(ms)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() }
}
export const addMinutes = (t: DateTime, minutes: number) => fromMs(toMs(t) + minutes * 60000)

const pad2 = (n: number) => String(n).padStart(2, '0')
/** 文墨格式：日期不补零，分钟补零，如 1995-6-16 21:10 */
export const fmtWenmo = (t: DateTime) => `${t.y}-${t.m}-${t.d} ${t.h}:${pad2(t.mi)}`
export const fmtHM = (t: DateTime) => `${pad2(t.h)}:${pad2(t.mi)}`

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const dayOfYear = (t: DateTime) => {
  const start = Date.UTC(t.y, 0, 1)
  return Math.floor((Date.UTC(t.y, t.m - 1, t.d) - start) / 86400000) + 1
}

/** NOAA / Spencer 均时差（分钟） */
export const equationOfTime = (t: DateTime) => {
  const days = isLeapYear(t.y) ? 366 : 365
  const hour = t.h + t.mi / 60
  const g = ((2 * Math.PI) / days) * (dayOfYear(t) - 1 + (hour - 12) / 24)
  return (
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  )
}

export interface TrueSolarResult {
  time: DateTime // 取整到分钟（向下取整）
  exactMs: number
  lonMinutes: number
  eotMinutes: number
}

export const trueSolarTime = (clock: DateTime, longitude: number, tz: number, dst: boolean): TrueSolarResult => {
  const std = dst ? addMinutes(clock, -60) : clock
  const lonMinutes = (longitude - tz * 15) * 4
  const eotMinutes = equationOfTime(std)
  const exactMs = toMs(std) + (lonMinutes + eotMinutes) * 60000
  const time = fromMs(Math.floor(exactMs / 60000) * 60000)
  return { time, exactMs, lonMinutes, eotMinutes }
}

export const HOUR_NAMES = BRANCHES.map((b) => b + '时')

export interface BirthAlert {
  type: 'cross' | 'boundary'
  clockBranch: number
  trueBranch: number
  clock: DateTime
  trueTime: DateTime
  boundary?: string
  boundaryBranches?: [number, number]
}

export const detectAlerts = (clock: DateTime, trueTime: DateTime): BirthAlert[] => {
  const alerts: BirthAlert[] = []
  const cb = hourToBranch(clock.h)
  const tb = hourToBranch(trueTime.h)
  const clockDay = `${clock.y}-${clock.m}-${clock.d}`
  const trueDay = `${trueTime.y}-${trueTime.m}-${trueTime.d}`
  if (cb !== tb || clockDay !== trueDay) {
    alerts.push({ type: 'cross', clockBranch: cb, trueBranch: tb, clock, trueTime })
  }
  const minutesOfDay = trueTime.h * 60 + trueTime.mi
  for (let k = 0; k < 12; k++) {
    const bh = (2 * k + 1) * 60 // 01:00, 03:00 ... 23:00
    let diff = minutesOfDay - bh
    if (diff > 720) diff -= 1440
    if (diff < -720) diff += 1440
    if (Math.abs(diff) <= 15) {
      const after = (k + 1) % 12
      const before = k
      alerts.push({
        type: 'boundary', clockBranch: cb, trueBranch: tb, clock, trueTime,
        boundary: `${pad2((2 * k + 1) % 24)}:00`, boundaryBranches: [before, after],
      })
      break
    }
  }
  return alerts
}

export interface DayunPillar {
  stem: number
  branch: number
  tenGod: string
  startAge: number
  startYear: number
}

export interface ResolvedBirth {
  input: BirthInput
  clock: DateTime // 公历钟表时间
  trueSolar: DateTime
  calc: DateTime // 晚子时顺延后的计算时间
  lateZi: boolean
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeap: boolean
  lunarText: string
  /** 紫微排盘用 */
  ziwei: { yearStem: number; yearBranch: number; month: number; day: number; hour: number; lunarYear: number }
  jieqiPillars: [string, string, string, string]
  nonJieqiPillars: [string, string, string, string]
  dayStem: number
  qiyun: { years: number; months: number; days: number; forward: boolean; text: string; jieName: string; jieTime: string }
  dayun: DayunPillar[]
  alerts: BirthAlert[]
}

const gz = (s: number, b: number) => STEMS[s] + BRANCHES[b]

export const lunarToSolarClock = (y: number, m: number, d: number, leap: boolean, h: number, mi: number): DateTime => {
  const s = Lunar.fromYmdHms(y, leap ? -m : m, d, h, mi, 0).getSolar()
  return { y: s.getYear(), m: s.getMonth(), d: s.getDay(), h: s.getHour(), mi: s.getMinute() }
}

export const solarToLunar = (t: DateTime) => {
  const l = Solar.fromYmdHms(t.y, t.m, t.d, t.h, t.mi, 0).getLunar()
  return { year: l.getYear(), month: Math.abs(l.getMonth()), day: l.getDay(), isLeap: l.getMonth() < 0, lunar: l }
}

export const resolveBirth = (input: BirthInput): ResolvedBirth => {
  const clock: DateTime =
    input.calendar === 'lunar'
      ? lunarToSolarClock(input.year, input.month, input.day, input.isLeapMonth, input.hour, input.minute)
      : { y: input.year, m: input.month, d: input.day, h: input.hour, mi: input.minute }
  const ts = trueSolarTime(clock, input.longitude, input.tz, input.dst)
  const trueSolar = ts.time
  const lateZi = trueSolar.h === 23
  const calc = lateZi ? addMinutes({ ...trueSolar, h: 0 }, 24 * 60) : trueSolar

  const solar = Solar.fromYmdHms(calc.y, calc.m, calc.d, calc.h, calc.mi, 0)
  const lunar = solar.getLunar()
  const lunarYear = lunar.getYear()
  const rawMonth = lunar.getMonth()
  const isLeap = rawMonth < 0
  const lunarMonth = Math.abs(rawMonth)
  const lunarDay = lunar.getDay()
  const hourBranch = hourToBranch(calc.h)

  // 年干支（以正月初一换年）
  const lyGz = lunar.getYearInGanZhi()
  let yStem = stemIndex(lyGz[0])
  let yBranch = branchIndex(lyGz[1])
  let zwYear = lunarYear
  // 闰月月中分界
  let zwMonth = lunarMonth
  if (isLeap && lunarDay > 15) {
    zwMonth = lunarMonth + 1
    if (zwMonth > 12) {
      zwMonth = 1
      yStem = mod(yStem + 1, 10)
      yBranch = mod12(yBranch + 1)
      zwYear += 1
    }
  }

  // 文墨天机按折算后的排盘月（月中分界后）输出月份名，不带「闰」字
  const monthName = LUNAR_MONTH_NAMES[zwMonth - 1] + '月'
  const lunarText = `${gz(yStem, yBranch)}年${monthName}${lunarDayName(lunarDay)}日${BRANCHES[hourBranch]}时`

  const ec = lunar.getEightChar()
  const jieqiPillars: [string, string, string, string] = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()]
  const dayStem = stemIndex(ec.getDay()[0])
  // 非节气四柱
  const nonMonthBranch = mod12(zwMonth + 1)
  const nonMonthStem = mod(tigerStartStem(yStem) + zwMonth - 1, 10)
  const timeStem = mod(ratStartStem(dayStem) + hourBranch, 10)
  const nonJieqiPillars: [string, string, string, string] = [
    gz(yStem, yBranch), gz(nonMonthStem, nonMonthBranch), ec.getDay(), gz(timeStem, hourBranch),
  ]

  // 八字起运
  const bzYearStem = stemIndex(jieqiPillars[0][0])
  const forward = isYangStem(bzYearStem) === (input.gender === 'male')
  const realLunar = Solar.fromYmdHms(trueSolar.y, trueSolar.m, trueSolar.d, trueSolar.h, trueSolar.mi, 0).getLunar()
  const jie = forward ? realLunar.getNextJie(true) : realLunar.getPrevJie(true)
  const js = jie.getSolar()
  const jieMs = Date.UTC(js.getYear(), js.getMonth() - 1, js.getDay(), js.getHour(), js.getMinute(), js.getSecond())
  const birthMs = toMs(trueSolar)
  const diffMin = Math.abs(jieMs - birthMs) / 60000
  const fullDays = Math.floor(diffMin / 1440)
  const remMin = diffMin - fullDays * 1440
  const years = Math.floor(fullDays / 3)
  let months = (fullDays % 3) * 4
  const hourDays = (remMin / 60) * 5
  months += Math.floor(hourDays / 30)
  const days = Math.round(hourDays % 30)
  const qiyunText = `出生后 ${years}年${months}月${days}天 八字起运`

  // 起运日期 = 出生日 + X年Y月Z天
  const startDate = new Date(Date.UTC(trueSolar.y + years, trueSolar.m - 1 + months, trueSolar.d + days))
  const firstYear = startDate.getUTCFullYear()
  const monthPillarStem = stemIndex(jieqiPillars[1][0])
  const monthPillarBranch = branchIndex(jieqiPillars[1][1])
  const dayun: DayunPillar[] = []
  for (let i = 1; i <= 8; i++) {
    const s = mod(monthPillarStem + (forward ? i : -i), 10)
    const b = mod12(monthPillarBranch + (forward ? i : -i))
    const startYear = firstYear + (i - 1) * 10
    dayun.push({ stem: s, branch: b, tenGod: tenGod(dayStem, s), startYear, startAge: startYear - trueSolar.y + 1 })
  }

  return {
    input, clock, trueSolar, calc, lateZi, lunarYear, lunarMonth, lunarDay, isLeap, lunarText,
    ziwei: { yearStem: yStem, yearBranch: yBranch, month: zwMonth, day: lunarDay, hour: hourBranch, lunarYear: zwYear },
    jieqiPillars, nonJieqiPillars, dayStem,
    qiyun: { years, months, days, forward, text: qiyunText, jieName: jie.getName(), jieTime: js.toYmdHms() },
    dayun,
    alerts: detectAlerts(clock, trueSolar),
  }
}

/** 某公历年对应的农历生日（公历日期），用于小限生日前后判定 */
export const lunarBirthdayInYear = (lunarYear: number, month: number, day: number) => {
  try {
    const s = Lunar.fromYmd(lunarYear, month, Math.min(day, 29)).getSolar()
    return { y: s.getYear(), m: s.getMonth(), d: s.getDay() }
  } catch {
    return null
  }
}

/** 某农历日期的日干支 */
export const lunarDayGanZhi = (lunarYear: number, month: number, day: number) => {
  try {
    return Lunar.fromYmd(lunarYear, month, day).getDayInGanZhi()
  } catch {
    return null
  }
}
