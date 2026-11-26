import { BRANCHES } from '../core/constants/base'
import { fmtHM, type BirthAlert } from '../core/calendar'

/** 跨时辰 / 交界时辰提醒文案（简体，显示时再转换） */
export const formatAlert = (a: BirthAlert, placeName: string, lon: number) => {
  const cb = BRANCHES[a.clockBranch] + '时'
  const tb = BRANCHES[a.trueBranch] + '时'
  if (a.type === 'cross') {
    const dayChanged = a.clock.d !== a.trueTime.d || a.clock.m !== a.trueTime.m || a.clock.y !== a.trueTime.y
    const ms = (x: typeof a.clock) => Date.UTC(x.y, x.m - 1, x.d, x.h, x.mi)
    const realDir = ms(a.trueTime) < ms(a.clock) ? '上一个' : '下一个'
    return `⚠️ 跨时辰提醒：您的钟表时间 ${fmtHM(a.clock)} 原属【${cb}】，按【${placeName} (${lon}°E)】调整真太阳时后为 ${fmtHM(a.trueTime)}，已进入${realDir}时辰【${tb}】${dayChanged ? '（公历日期亦已改变）' : ''}！当前已按【${tb}】排盘，建议检查核对（可使用命盘上方「◀ 上一时辰 / 下一时辰 ▶」对比前后时辰命盘）。`
  }
  const [b1, b2] = a.boundaryBranches!
  return `💡 交界时辰提示：换算后的真太阳时 ${fmtHM(a.trueTime)} 非常接近【${BRANCHES[b1]}时 / ${BRANCHES[b2]}时】交界（${a.boundary}），几分钟误差或州内不同城市位置可能影响时辰，建议用命盘上方「◀ 上一时辰 / 下一时辰 ▶」对比核对定盘。`
}
