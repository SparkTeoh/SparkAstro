declare module 'lunar-javascript' {
  export interface JieQi {
    getName(): string
    getSolar(): Solar
  }
  export interface EightChar {
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
    toString(): string
  }
  export interface Lunar {
    getYear(): number
    getMonth(): number
    getDay(): number
    getYearInGanZhi(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getDayInGanZhi(): string
    getTimeZhi(): string
    getEightChar(): EightChar
    getPrevJie(wholeDay?: boolean): JieQi
    getNextJie(wholeDay?: boolean): JieQi
    getSolar(): Solar
  }
  export interface Solar {
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
    getMinute(): number
    getSecond(): number
    getLunar(): Lunar
    toYmdHms(): string
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar
    fromYmd(y: number, m: number, d: number): Solar
  }
  export const Lunar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar
    fromYmd(y: number, m: number, d: number): Lunar
  }
  export const LunarYear: {
    fromYear(y: number): { getLeapMonth(): number }
  }
}
