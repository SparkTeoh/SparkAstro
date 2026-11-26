import { useMemo, useState } from 'react'
import type { ResolvedBirth } from '../../core/calendar'
import { YEAR_SPAN_LIMIT, buildPrompt, clampYear, type ExportMode } from '../../core/exporter'
import type { Chart } from '../../core/ziwei'
import { downloadText } from '../../state/cases'
import { useLang, useT } from '../../state/lang'
import { Modal, btnCls, inputCls, primaryCls } from '../Modal'

interface Props {
  birth: ResolvedBirth
  chart: Chart
  /** 各宫限流叠宫全称（当前界面选中的运限） */
  overlap?: string[][]
  onClose: () => void
}

const MODES: { key: ExportMode; icon: string; title: string; desc: string; file: string }[] = [
  { key: 'career', icon: '💼', title: '未来 3～5 年事业与财富战略规划', desc: '三盘叠宫、七大财官宫位、冲忌与飞化全部预计算（推荐）', file: '事业财富战略' },
  { key: 'annual', icon: '📅', title: '年度精批 + 12 流月节奏日历', desc: '单一年份深度规划，逐月红绿灯行动表', file: '年度精批' },
  { key: 'life', icon: '🧭', title: '一生总格局 + 八大十年大运全景', desc: '命格底色与人生大周期，不含逐年流年', file: '一生总格局' },
  { key: 'natal', icon: '📄', title: '纯净本命盘数据', desc: '文墨原版格式，方便自己写提问词（合盘、单项提问等）', file: '本命盘' },
]

const fieldLabel = 'mb-1 block text-[12px] text-stone-500'
const segCls = (on: boolean) =>
  `rounded border px-3 py-1.5 text-[13px] ${on ? 'border-amber-700 bg-amber-700 font-medium text-white' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'}`

export function ExportPromptModal({ birth, chart, overlap, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const birthYear = birth.ziwei.lunarYear
  const [thisYear] = useState(() => clampYear(birthYear, new Date().getFullYear()))
  const yearOpts = useMemo(() => Array.from({ length: YEAR_SPAN_LIMIT + 1 }, (_, i) => birthYear + i), [birthYear])

  const [mode, setMode] = useState<ExportMode>('career')
  const [startYear, setStartYear] = useState(thisYear)
  const [span, setSpan] = useState<3 | 5>(5)
  const [targetYear, setTargetYear] = useState(thisYear)
  const [occupation, setOccupation] = useState('')
  const [question, setQuestion] = useState('')
  const [withIntro, setWithIntro] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState('')

  const text = useMemo(
    () => buildPrompt(birth, chart, { mode, lang, note, overlap, startYear, span, targetYear, occupation, question, withIntro }),
    [birth, chart, mode, lang, note, overlap, startYear, span, targetYear, occupation, question, withIntro],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('已复制到剪贴板')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      // 旧浏览器兜底：execCommand 已被标记弃用，经最小类型调用以免触发弃用提示
      const legacy = document as unknown as { execCommand: (cmd: string) => boolean }
      const ok = legacy.execCommand('copy')
      ta.remove()
      setCopied(ok ? '已复制到剪贴板' : '复制失败，请在下方文本框内手动全选复制')
    }
    setTimeout(() => setCopied(''), 2500)
  }

  const current = MODES.find((m) => m.key === mode)!
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

  const anchors = (l1: string, p1: string, l2: string, p2: string) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <label>
        <span className={fieldLabel}>{t(l1)}</span>
        <input className={inputCls + ' h-9'} value={occupation} placeholder={t(p1)} onChange={(e) => setOccupation(e.target.value)} />
      </label>
      <label>
        <span className={fieldLabel}>{t(l2)}</span>
        <input className={inputCls + ' h-9'} value={question} placeholder={t(p2)} onChange={(e) => setQuestion(e.target.value)} />
      </label>
    </div>
  )

  const noteField = (
    <label>
      <span className={fieldLabel}>{t('备注（选填，写入命盘末尾 [备注]）')}</span>
      <input className={inputCls + ' h-9'} value={note} onChange={(e) => setNote(e.target.value)} />
    </label>
  )

  return (
    <Modal title={t('✨ AI 详批提示词')} onClose={onClose} wide>
      <div className="flex flex-col gap-3 text-[13px] text-stone-700">
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t('提示词模式')}>
          {MODES.map((m) => (
            <button
              key={m.key}
              role="radio"
              aria-checked={mode === m.key}
              onClick={() => setMode(m.key)}
              className={`rounded-lg border p-2.5 text-left transition-colors ${
                mode === m.key ? 'border-amber-700 bg-amber-50 ring-1 ring-amber-700' : 'border-stone-300 bg-white hover:bg-stone-50'
              }`}
            >
              <div className="text-[13.5px] font-bold text-stone-800">
                {m.icon} {t(m.title)}
                {m.key === 'career' && <span className="ml-1 text-amber-600">⭐</span>}
              </div>
              <div className="mt-0.5 text-[12px] leading-[17px] text-stone-500">{t(m.desc)}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 rounded-lg border border-stone-200 bg-stone-50 p-3">
          {mode === 'career' && (
            <>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <label>
                  <span className={fieldLabel}>{t('起始年份')}</span>
                  {yearSelect(startYear, setStartYear)}
                </label>
                <div>
                  <span className={fieldLabel}>{t('规划跨度')}</span>
                  <div className="flex gap-1">
                    {([3, 5] as const).map((n) => (
                      <button key={n} aria-pressed={span === n} className={segCls(span === n)} onClick={() => setSpan(n)}>
                        {t(`未来 ${n} 年`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {anchors(
                '当前职业 / 商业模式（选填）',
                '例：自媒体 IP 与课程创业 / 企业高管 / 自由职业',
                '近期核心决策问题（选填）',
                '例：未来3年适合扩团队做新业务，还是稳守现金流买资产？',
              )}
            </>
          )}
          {mode === 'annual' && (
            <>
              <div>
                <span className={fieldLabel}>{t('目标年份')}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {yearSelect(targetYear, setTargetYear)}
                  <button aria-pressed={targetYear === thisYear} className={segCls(targetYear === thisYear)} onClick={() => setTargetYear(thisYear)}>
                    {t('今年')}
                  </button>
                  <button
                    aria-pressed={targetYear === clampYear(birthYear, thisYear + 1)}
                    className={segCls(targetYear === clampYear(birthYear, thisYear + 1) && targetYear !== thisYear)}
                    onClick={() => setTargetYear(clampYear(birthYear, thisYear + 1))}
                  >
                    {t('明年')}
                  </button>
                </div>
              </div>
              {anchors('当前职业 / 状态（选填）', '例：创业第三年 / 准备换工作 / 在读', '今年重点关注事项（选填）', '例：要不要换城市发展 / 感情能否稳定')}
            </>
          )}
          {mode === 'natal' && (
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={withIntro} onChange={(e) => setWithIntro(e.target.checked)} />
              {t('附带通用大师解盘导语')}
              <span className="text-[12px] text-stone-500">{t('（不勾选则只输出干净的命盘数据）')}</span>
            </label>
          )}
          {(mode === 'life' || mode === 'natal') && noteField}
        </div>

        <textarea
          readOnly
          value={text}
          aria-label={t('提示词预览')}
          className="h-[38vh] w-full rounded border border-stone-300 bg-white p-2 font-mono text-[12px] leading-[17px] text-stone-800"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] text-stone-500" role="status">
            {text.length.toLocaleString()} {t('字')} {copied && <b className="ml-2 text-emerald-700">{t(copied)}</b>}
          </span>
          <div className="flex gap-2">
            <button className={btnCls + ' py-1.5'} onClick={download}>
              {t('下载 .txt')}
            </button>
            <button className={primaryCls + ' px-4 py-1.5'} onClick={copy}>
              {t('一键复制')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
