import type { HourBarInfo } from '../../state/hourShift'
import { useT } from '../../state/lang'

interface Props {
  info: HourBarInfo
  onPrev: () => void
  onNext: () => void
  /** ↺ 回原时辰 */
  onReset: () => void
  /** ✓ 设为真实时辰 */
  onCommit: () => void
  /** 🔍 AI 帮我定盘 */
  onAiVerify?: () => void
}

const sideBtn =
  'flex min-h-[48px] min-w-[84px] flex-col items-center justify-center rounded-md border-[1.5px] border-[#003054] bg-[#FFFBEB] px-2 py-1 text-[#003054] hover:bg-[#F8961D] active:translate-x-[1px] active:translate-y-[1px] sm:min-w-[132px] sm:px-3'
const miniBtn = 'whitespace-nowrap rounded border-[1.5px] border-[#003054] px-2 py-[3px] text-[12px] font-bold text-[#003054]'

/** 命盘正上方的时辰定盘对比栏：一键左右切换相邻时辰，或唤起 AI 多盘定盘印证 */
export function HourCompareBar({ info, onPrev, onNext, onReset, onCommit, onAiVerify }: Props) {
  const t = useT()
  const comparing = info.offset !== 0
  return (
    <section
      aria-label={t('时辰定盘对比')}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border-[1.5px] border-[#003054] bg-white px-2 py-2 shadow-[3px_3px_0_#003054]"
    >
      <button className={sideBtn} onClick={onPrev} title={t(info.prevLabel)} aria-label={t(info.prevLabel)}>
        <span className="whitespace-nowrap text-[13px] font-bold sm:text-[14px]">{t('◀ 上一时辰')}</span>
        <span className="text-[12px] font-medium opacity-80">{t(`(${info.prev})`)}</span>
      </button>

      <div className="min-w-0 text-center" role="status" aria-live="polite">
        {comparing ? (
          <>
            <div className="text-[13px] font-bold leading-5 text-[#A85600] sm:text-[14px]">{t(info.title)}</div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <button className={miniBtn + ' bg-white hover:bg-[#FFFBEB]'} onClick={onReset}>
                {t('↺ 回原时辰')}
              </button>
              <button className={miniBtn + ' bg-[#F8961D] hover:bg-[#FFA940]'} onClick={onCommit}>
                {t('✓ 设为真实时辰')}
              </button>
              {onAiVerify && (
                <button className={miniBtn + ' bg-[#FFFBEB] hover:bg-[#F8961D]'} onClick={onAiVerify}>
                  🔍 {t('AI 帮我定盘')}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-[14px] font-bold leading-5 text-[#003054] sm:text-[15px]">{t(info.title)}</div>
            <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11.5px] leading-4 text-[#4A6072]">
              <span>{t('左右切换可对比相邻时辰定盘')}</span>
              {onAiVerify && (
                <button
                  type="button"
                  onClick={onAiVerify}
                  className="whitespace-nowrap rounded border border-[#003054]/40 bg-[#FFFBEB] px-1.5 py-[1px] text-[11.5px] font-bold text-[#003054] hover:border-[#003054] hover:bg-[#F8961D]"
                >
                  🔍 {t('AI 帮我定盘')}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <button className={sideBtn} onClick={onNext} title={t(info.nextLabel)} aria-label={t(info.nextLabel)}>
        <span className="whitespace-nowrap text-[13px] font-bold sm:text-[14px]">{t('下一时辰 ▶')}</span>
        <span className="text-[12px] font-medium opacity-80">{t(`(${info.next})`)}</span>
      </button>
    </section>
  )
}
