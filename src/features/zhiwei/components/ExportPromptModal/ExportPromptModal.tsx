import { useMemo, useState } from 'react'
import type { ResolvedBirth } from '../../core/calendar'
import {
  FOCUS_CHIPS, KIDS_CHIPS, MARITAL_CHIPS, STATUS_CHIPS, YEAR_SPAN_LIMIT, buildPrompt, chipLabel, clampYear,
  type FocusKey, type KidsKey, type MaritalKey, type PromptMode, type StatusKey,
} from '../../core/exporter'
import type { Chart } from '../../core/ziwei'
import { downloadText } from '../../state/cases'
import { useLang, useT } from '../../state/lang'
import { Modal } from '../Modal'
import { btnCls, inputCls, labelCls, primaryBtnCls, segCls } from '../theme'
import { EXPORT_MODE_CARDS, EXPORT_UI_TEXT } from './config'

interface Props {
  birth: ResolvedBirth
  chart: Chart
  /** 各宫限流叠宫全称（当前界面选中的运限） */
  overlap?: string[][]
  /** 初始选中的详批模式（默认 'life' 首次排盘必看） */
  initialMode?: PromptMode
  /** 切换到独立的「🔍 AI 时辰定盘印证」弹窗 */
  onSwitchToRectify?: () => void
  onClose: () => void
}

const chipCls = (on: boolean) => `rounded-full border-[1.5px] px-3 py-1.5 text-left text-[13px] leading-[18px] transition-colors ${segCls(on)}`
const segBtn = (on: boolean) => `rounded-md border-[1.5px] px-3 py-1.5 text-[13px] ${segCls(on)}`

export function ExportPromptModal({ birth, chart, overlap, initialMode = 'life', onSwitchToRectify, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const birthYear = birth.ziwei.lunarYear
  const [thisYear] = useState(() => clampYear(birthYear, new Date().getFullYear()))
  const yearOpts = useMemo(() => Array.from({ length: YEAR_SPAN_LIMIT + 1 }, (_, i) => birthYear + i), [birthYear])

  const [mode, setMode] = useState<PromptMode>(initialMode)
  const [startYear, setStartYear] = useState(thisYear)
  const [span, setSpan] = useState<3 | 5>(5)
  const [targetYear, setTargetYear] = useState(thisYear)
  const [status, setStatus] = useState<StatusKey | null>(null)
  const [marital, setMarital] = useState<MaritalKey | null>(null)
  const [kids, setKids] = useState<KidsKey | null>(null)
  const [occupation, setOccupation] = useState('')
  const [pastContext, setPastContext] = useState('')
  const [focus, setFocus] = useState<FocusKey[]>([])
  const [question, setQuestion] = useState('')
  const [withIntro, setWithIntro] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState('')

  const text = useMemo(
    () =>
      buildPrompt(birth, chart, {
        mode, lang, note, overlap, startYear, span, targetYear,
        status, marital, kids, occupation, pastContext, focus, question, withIntro,
      }),
    [birth, chart, mode, lang, note, overlap, startYear, span, targetYear, status, marital, kids, occupation, pastContext, focus, question, withIntro],
  )

  const toggleFocus = (k: FocusKey) => setFocus((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(EXPORT_UI_TEXT.copied)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      // 旧浏览器兜底：execCommand 已被标记弃用，经最小类型调用以免触发弃用提示
      const legacy = document as unknown as { execCommand: (cmd: string) => boolean }
      const ok = legacy.execCommand('copy')
      ta.remove()
      setCopied(ok ? EXPORT_UI_TEXT.copied : EXPORT_UI_TEXT.copyFailed)
    }
    setTimeout(() => setCopied(''), 2500)
  }

  const current = EXPORT_MODE_CARDS.find((m) => m.key === mode)!
  const download = () => downloadText(`${birth.input.name || 'ziwei'}-${t(current.file)}-AI提示词.txt`, text, 'text/plain;charset=utf-8')

  const yearSelect = (value: number, onChange: (y: number) => void) => (
    <select className={inputCls + ' h-9 w-auto'} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {yearOpts.map((y) => (
        <option key={y} value={y}>
          {y}
          {t('年')}（{y - birthYear + 1}
          {t('虚岁')}）
        </option>
      ))}
    </select>
  )

  /** 现实背景问诊卡（career / annual / life 共用） */
  const profileSection = (
    <>
      <div className="rounded-md border border-[#003054]/15 bg-[#FFFBEB] px-2.5 py-1.5 text-[12px] leading-[18px] text-[#003054]">
        {t(EXPORT_UI_TEXT.profileHint)}
      </div>
      <div>
        <span className={labelCls}>{t(EXPORT_UI_TEXT.status)}</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('当前状态')}>
          {STATUS_CHIPS.map((c) => (
            <button key={c.key} aria-pressed={status === c.key} className={chipCls(status === c.key)} onClick={() => setStatus(status === c.key ? null : c.key)}>
              {t(chipLabel(c))}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className={labelCls}>{t(EXPORT_UI_TEXT.family)}</span>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('婚姻与子女状态')}>
          {MARITAL_CHIPS.map((c) => (
            <button key={c.key} aria-pressed={marital === c.key} className={chipCls(marital === c.key)} onClick={() => setMarital(marital === c.key ? null : c.key)}>
              {t(chipLabel(c))}
            </button>
          ))}
          <span className="mx-0.5 text-[#94A3B8]" aria-hidden="true">|</span>
          {KIDS_CHIPS.map((c) => (
            <button key={c.key} aria-pressed={kids === c.key} className={chipCls(kids === c.key)} onClick={() => setKids(kids === c.key ? null : c.key)}>
              {t(chipLabel(c))}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label>
          <span className={labelCls}>{t(EXPORT_UI_TEXT.occupation)}</span>
          <input
            className={inputCls + ' h-9'}
            value={occupation}
            placeholder={t(EXPORT_UI_TEXT.occupationPlaceholder)}
            onChange={(e) => setOccupation(e.target.value)}
          />
        </label>
        <label>
          <span className={labelCls}>{t(EXPORT_UI_TEXT.pastContext)}</span>
          <input
            className={inputCls + ' h-9'}
            value={pastContext}
            placeholder={t(EXPORT_UI_TEXT.pastContextPlaceholder)}
            onChange={(e) => setPastContext(e.target.value)}
          />
        </label>
      </div>
    </>
  )

  const questionField = (
    <label>
      <span className={labelCls}>{t(EXPORT_UI_TEXT.question)}</span>
      <textarea
        className={inputCls + ' min-h-[60px] resize-y py-1.5 leading-5'}
        rows={2}
        value={question}
        placeholder={t(EXPORT_UI_TEXT.questionPlaceholder)}
        onChange={(e) => setQuestion(e.target.value)}
      />
    </label>
  )

  /** 点选芯片 + 万能提问框（career / annual 共用） */
  const chips = (
    <>
      {profileSection}
      <div>
        <span className={labelCls}>{t(EXPORT_UI_TEXT.focus)}</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('重点关注方向')}>
          {FOCUS_CHIPS.map((c) => (
            <button key={c.key} aria-pressed={focus.includes(c.key)} className={chipCls(focus.includes(c.key))} onClick={() => toggleFocus(c.key)}>
              {t(chipLabel(c))}
            </button>
          ))}
        </div>
      </div>
      {questionField}
    </>
  )

  const noteField = (
    <label>
      <span className={labelCls}>{t('备注（选填，写入命盘末尾 [备注]）')}</span>
      <input className={inputCls + ' h-9'} value={note} onChange={(e) => setNote(e.target.value)} />
    </label>
  )

  return (
    <Modal title={t('✨ AI 详批提示词')} onClose={onClose} wide>
      <div className="flex flex-col gap-3 text-[13px] text-[#003054]">
        {onSwitchToRectify && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#003054]/20 bg-[#FFFBEB] px-3 py-1.5 text-[12px] text-[#003054]">
            <span>{t(EXPORT_UI_TEXT.rectifyJumpPrefix)}</span>
            <button type="button" onClick={onSwitchToRectify} className="font-bold text-[#A85600] underline hover:text-[#003054]">
              {t(EXPORT_UI_TEXT.rectifyJumpBtn)}
            </button>
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('提示词模式')}>
          {EXPORT_MODE_CARDS.map((m) => (
            <button
              key={m.key}
              role="radio"
              aria-checked={mode === m.key}
              onClick={() => setMode(m.key)}
              className={`rounded-lg border-[1.5px] p-2.5 text-left transition-colors ${
                mode === m.key ? 'border-[#003054] bg-[#FFFBEB] shadow-[3px_3px_0_#003054]' : 'border-[#003054]/30 bg-white hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="text-[13.5px] font-bold text-[#003054]">
                {m.icon} {t(m.title)}
                {m.key === 'life' && <span className="ml-1">⭐</span>}
              </div>
              <div className="mt-0.5 text-[12px] leading-[17px] text-[#4A6072]">{t(m.desc)}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-3">
          {mode === 'career' && (
            <>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <label>
                  <span className={labelCls}>{t('起始年份')}</span>
                  {yearSelect(startYear, setStartYear)}
                </label>
                <div>
                  <span className={labelCls}>{t('规划跨度')}</span>
                  <div className="flex gap-1">
                    {([3, 5] as const).map((n) => (
                      <button key={n} aria-pressed={span === n} className={segBtn(span === n)} onClick={() => setSpan(n)}>
                        {t(`未来 ${n} 年`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {chips}
            </>
          )}
          {mode === 'annual' && (
            <>
              <div>
                <span className={labelCls}>{t('目标年份')}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {yearSelect(targetYear, setTargetYear)}
                  <button aria-pressed={targetYear === thisYear} className={segBtn(targetYear === thisYear)} onClick={() => setTargetYear(thisYear)}>
                    {t('今年')}
                  </button>
                  <button
                    aria-pressed={targetYear === clampYear(birthYear, thisYear + 1)}
                    className={segBtn(targetYear === clampYear(birthYear, thisYear + 1) && targetYear !== thisYear)}
                    onClick={() => setTargetYear(clampYear(birthYear, thisYear + 1))}
                  >
                    {t('明年')}
                  </button>
                </div>
              </div>
              {chips}
            </>
          )}
          {mode === 'life' && (
            <>
              {profileSection}
              {questionField}
              {noteField}
            </>
          )}
          {mode === 'natal' && (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-[#003054]" checked={withIntro} onChange={(e) => setWithIntro(e.target.checked)} />
                {t('附带现代命理师解盘导语')}
                <span className="text-[12px] text-[#4A6072]">{t('（不勾选则只输出纯净的命盘数据）')}</span>
              </label>
              {noteField}
            </>
          )}
        </div>

        <textarea
          readOnly
          value={text}
          aria-label={t('提示词预览')}
          className="h-[34vh] w-full rounded-md border border-[#94A3B8] bg-white p-2 font-mono text-[12px] leading-[17px] text-[#003054]"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pb-[3px] pr-[3px]">
          <span className="text-[12px] text-[#4A6072]" role="status">
            {text.length.toLocaleString()} {t('字')} {copied && <b className="ml-2 text-[#15803D]">{t(copied)}</b>}
          </span>
          <div className="flex items-center gap-2.5">
            <button className={btnCls + ' py-1.5'} onClick={download}>
              {t(EXPORT_UI_TEXT.download)}
            </button>
            <button className={primaryBtnCls + ' px-5 py-1.5 text-[14px]'} onClick={copy}>
              {t(EXPORT_UI_TEXT.copy)}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
