import type { ReactNode } from 'react'
import { BRANCHES, BRANCH_ELEMENT, STEMS, STEM_ELEMENT, branchIndex, isYangStem, stemIndex, tenGod } from '../../core/constants/base'
import { MUTAGEN_COLORS } from '../../core/constants/stars'
import { fmtWenmo, type ResolvedBirth } from '../../core/calendar'
import type { Chart, PlateType } from '../../core/ziwei'
import { useT } from '../../state/lang'

const ELEMENT_COLOR: Record<string, string> = { 木: '#15803d', 火: '#dc2626', 土: '#92400e', 金: '#b45309', 水: '#1d4ed8' }

interface Props {
  birth: ResolvedBirth
  chart: Chart
  plate: PlateType
  onPlate: (p: PlateType) => void
  onShiftDay: (d: number) => void
  onShiftHour: (d: number) => void
  /** 是否处于限流（选中大限 / 流年）状态：隐藏改生辰按钮，改为「返回本命盘」 */
  horoActive?: boolean
  onBackToNatal?: () => void
}

export function CenterPalace({ birth, chart, plate, onPlate, onShiftDay, onShiftHour, horoActive, onBackToNatal }: Props) {
  const t = useT()
  const g = birth.input.gender
  const yin = isYangStem(chart.params.yearStem) ? '阳' : '阴'
  const genderText = `${yin}${g === 'male' ? '男' : '女'}`

  return (
    <div className="flex h-full flex-col gap-[3px] px-2 py-[5px] text-[11px] leading-[14px] text-stone-700">
      <div className="flex items-baseline justify-between">
        <span className="truncate text-[14px] font-bold text-stone-900" style={{ maxWidth: 150 }}>
          {birth.input.name || t('未命名')}
        </span>
        <span>
          {t(genderText)} · <b className="text-amber-800">{t(chart.bureau.name)}</b> · {t(birth.input.placeName)}
        </span>
      </div>
      <div>
        {t('真太阳时')}: <b>{fmtWenmo(birth.trueSolar)}</b>
      </div>
      <div>
        {t('钟表时间')}: {fmtWenmo(birth.clock)}
      </div>
      <div>
        {t('农历')}: {t(birth.lunarText)}
        {birth.lateZi && <span className="ml-1 text-rose-600">{t('(晚子时按次日)')}</span>}
      </div>
      <div>
        {t('命主')}: {t(chart.lifeMaster)} · {t('身主')}: {t(chart.bodyMaster)} · {t('子年斗君')}: {t(BRANCHES[chart.douJun])} ·{' '}
        {t('身宫')}: {t(BRANCHES[chart.bodyIndex])}
      </div>

      <div className="mt-[2px] flex gap-2">
        <Pillars label={t('节气四柱')} pillars={birth.jieqiPillars} dayStem={birth.dayStem} gender={g} />
        <Pillars label={t('非节气四柱')} pillars={birth.nonJieqiPillars} dayStem={birth.dayStem} gender={g} />
      </div>

      <div className="mt-[1px] text-[10.5px] text-stone-600">
        {t(birth.qiyun.text)}（{t(birth.qiyun.forward ? '顺行' : '逆行')}·{t(birth.qiyun.jieName)}）
      </div>
      <div className="flex justify-between">
        {birth.dayun.map((d, i) => (
          <div key={i} className="flex flex-col items-center leading-[12px]">
            <div className="flex items-center">
              <div className="flex flex-col items-center text-[13px] font-bold leading-[14px]">
                <span style={{ color: ELEMENT_COLOR[STEM_ELEMENT[d.stem]] }}>{t(STEMS[d.stem])}</span>
                <span style={{ color: ELEMENT_COLOR[BRANCH_ELEMENT[d.branch]] }}>{t(BRANCHES[d.branch])}</span>
              </div>
              <div className="ml-[1px] flex flex-col text-[8.5px] leading-[9px] text-stone-500">
                {[...t(d.tenGod)].map((ch, k) => (
                  <span key={k}>{ch}</span>
                ))}
              </div>
            </div>
            <span className="text-[9px] text-stone-500">
              {d.startAge}
              {t('岁')}
            </span>
            <span className="text-[9px] text-stone-400">{d.startYear}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-center gap-1">
        {horoActive ? (
          <Btn onClick={() => onBackToNatal?.()}>{t('返回本命盘')}</Btn>
        ) : (
          <>
        <Btn onClick={() => onShiftDay(-1)}>{t('日↑')}</Btn>
        <Btn onClick={() => onShiftDay(1)}>{t('日↓')}</Btn>
        <select
          className="rounded border border-amber-700/40 bg-amber-50 px-1 py-[1px] text-[11px] text-amber-900"
          value={plate}
          onChange={(e) => onPlate(e.target.value as PlateType)}
        >
          <option value="heaven">{t('天盘')}</option>
          <option value="earth">{t('地盘')}</option>
          <option value="human">{t('人盘')}</option>
        </select>
        <Btn onClick={() => onShiftHour(-1)}>{t('时↑')}</Btn>
        <Btn onClick={() => onShiftHour(1)}>{t('时↓')}</Btn>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 text-[9.5px] text-stone-500">
        <span>{t('↓离心自化')}</span>
        <span>{t('↑向心自化')}</span>
        {(['禄', '权', '科', '忌'] as const).map((m) => (
          <span key={m} className="flex items-center gap-[2px]">
            <i className="inline-block h-[3px] w-3" style={{ background: MUTAGEN_COLORS[m] }} />
            {t(m)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Btn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-amber-700/40 bg-amber-50 px-[6px] py-[1px] text-[11px] text-amber-900 hover:bg-amber-100"
    >
      {children}
    </button>
  )
}

function Pillars({ label, pillars, dayStem, gender }: { label: string; pillars: string[]; dayStem: number; gender: string }) {
  const t = useT()
  return (
    <div className="flex-1 rounded border border-stone-200 px-1 py-[2px]">
      <div className="text-[9.5px] text-stone-500">{label}</div>
      <div className="flex justify-around">
        {pillars.map((p, i) => {
          const s = stemIndex(p[0])
          const b = branchIndex(p[1])
          const god = i === 2 ? (gender === 'male' ? '元男' : '元女') : tenGod(dayStem, s)
          return (
            <div key={i} className="flex flex-col items-center leading-[15px]">
              <span className="text-[8.5px] leading-[10px] text-stone-500">{t(god)}</span>
              <span className="text-[14px] font-bold" style={{ color: ELEMENT_COLOR[STEM_ELEMENT[s]] }}>
                {t(p[0])}
              </span>
              <span className="text-[14px] font-bold" style={{ color: ELEMENT_COLOR[BRANCH_ELEMENT[b]] }}>
                {t(p[1])}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
