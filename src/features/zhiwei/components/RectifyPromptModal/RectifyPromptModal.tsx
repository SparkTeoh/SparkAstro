import { useMemo, useState } from 'react'
import type { ResolvedBirth } from '../../core/calendar'
import { BRANCHES, mod12 } from '../../core/constants/base'
import { buildPrompt, type RectifyScope } from '../../core/exporter'
import type { Chart } from '../../core/ziwei'
import { downloadText } from '../../state/cases'
import { useLang, useT } from '../../state/lang'
import { EXPORT_UI_TEXT } from '../ExportPromptModal/config'
import { Modal } from '../Modal'
import { btnCls, inputCls, labelCls, primaryBtnCls, segCls } from '../theme'

interface Props {
  birth: ResolvedBirth
  chart: Chart
  onClose: () => void
}

const segBtn = (on: boolean) => `rounded-md border-[1.5px] px-3 py-1.5 text-[13px] ${segCls(on)}`

/** 独立的「🔍 AI 时辰定盘印证」弹窗（第 0 步前置校准，与四大运势详批解耦） */
export function RectifyPromptModal({ birth, chart, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const [rectifyScope, setRectifyScope] = useState<RectifyScope>('next')
  const [pastEvents, setPastEvents] = useState('')
  const [copied, setCopied] = useState('')

  const curHour = BRANCHES[birth.ziwei.hour] + '时'
  const prevHour = BRANCHES[mod12(birth.ziwei.hour - 1)] + '时'
  const nextHour = BRANCHES[mod12(birth.ziwei.hour + 1)] + '时'

  const text = useMemo(
    () => buildPrompt(birth, chart, { mode: 'rectify', lang, rectifyScope, pastEvents }),
    [birth, chart, lang, rectifyScope, pastEvents],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(EXPORT_UI_TEXT.copied)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      const legacy = document as unknown as { execCommand: (cmd: string) => boolean }
      const ok = legacy.execCommand('copy')
      ta.remove()
      setCopied(ok ? EXPORT_UI_TEXT.copied : EXPORT_UI_TEXT.copyFailed)
    }
    setTimeout(() => setCopied(''), 2500)
  }

  const download = () =>
    downloadText(`${birth.input.name || 'ziwei'}-${t('时辰定盘印证')}-AI提示词.txt`, text, 'text/plain;charset=utf-8')

  return (
    <Modal title={t('🔍 AI 时辰定盘印证')} onClose={onClose} wide>
      <div className="flex flex-col gap-3 text-[13px] text-[#003054]">
        <div className="flex flex-col gap-3 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-3">
          <div className="rounded-md border border-[#003054]/15 bg-[#FFFBEB] px-2.5 py-1.5 text-[12px] leading-[18px] text-[#003054]">
            {t(EXPORT_UI_TEXT.rectifyHint)}
          </div>
          <div>
            <span className={labelCls}>{t(EXPORT_UI_TEXT.rectifyScope)}</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t(EXPORT_UI_TEXT.rectifyScope)}>
              {(
                [
                  ['next', `当前 vs 下一时辰（${curHour} vs ${nextHour}，推荐）`],
                  ['prev', `当前 vs 上一时辰（${prevHour} vs ${curHour}）`],
                  ['three', `前后三时辰对比（${prevHour} / ${curHour} / ${nextHour}，时间模糊选此）`],
                ] as const
              ).map(([k, label]) => (
                <button key={k} aria-pressed={rectifyScope === k} className={segBtn(rectifyScope === k)} onClick={() => setRectifyScope(k)}>
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span className={labelCls}>{t(EXPORT_UI_TEXT.pastEvents)}</span>
            <textarea
              className={inputCls + ' min-h-[68px] resize-y py-1.5 leading-5'}
              rows={2}
              value={pastEvents}
              placeholder={t(EXPORT_UI_TEXT.pastEventsPlaceholder)}
              onChange={(e) => setPastEvents(e.target.value)}
            />
          </label>
        </div>

        <textarea
          readOnly
          value={text}
          aria-label={t('定盘提示词预览')}
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
