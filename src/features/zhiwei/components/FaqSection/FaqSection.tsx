import { useState } from 'react'
import { useT } from '../../state/lang'
import { Modal } from '../Modal'
import { primaryBtnCls } from '../theme'
import { FAQ_ITEMS } from './faqData'

interface ListProps {
  /** 默认展开第几条（首页折叠卡传 null，弹窗内默认展开第 0 条） */
  defaultOpen?: number | null
  /** 在命盘页弹窗内可提供一键跳转「AI 时辰定盘印证」 */
  onStartRectify?: () => void
}

function FaqList({ defaultOpen = null, onStartRectify }: ListProps) {
  const t = useT()
  const [open, setOpen] = useState<number | null>(defaultOpen)
  return (
    <div className="divide-y divide-[#003054]/15">
      {FAQ_ITEMS.map((item, i) => {
        const expanded = open === i
        return (
          <div key={i} className="px-4 py-3">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : i)}
              className="flex w-full items-start justify-between gap-3 text-left text-[13.5px] font-bold leading-5 text-[#003054] hover:text-[#A85600]"
            >
              <span>
                <span className="mr-1.5 font-mono text-[12px] text-[#A85600]">Q{i + 1}.</span>
                {t(item.q)}
              </span>
              <span className="mt-0.5 shrink-0 font-mono text-[15px] font-bold leading-none text-[#003054]" aria-hidden="true">
                {expanded ? '−' : '+'}
              </span>
            </button>
            {expanded && (
              <div className="mt-2 flex flex-col gap-1.5 pl-6 text-[12.5px] leading-[1.65] text-[#4A6072]">
                {item.a.map((p, j) => (
                  <p key={j}>{t(p)}</p>
                ))}
                {i === 4 && onStartRectify && (
                  <div className="pt-1 pb-[3px] pr-[3px]">
                    <button type="button" className={primaryBtnCls + ' px-3 py-1 text-[12.5px]'} onClick={onStartRectify}>
                      🔍 {t('立即打开 AI 时辰定盘印证 →')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** 排盘首页底部的折叠手风琴卡片 */
export function FaqAccordion() {
  const t = useT()
  return (
    <section aria-label={t('排盘须知与常见问题')}>
      <h2 className="mb-1.5 px-1 text-[12px] font-bold text-[#4A6072]">{t('📖 排盘须知与常见问题')}</h2>
      <div className="overflow-hidden rounded-xl border-[1.5px] border-[#003054] bg-white">
        <FaqList defaultOpen={null} />
      </div>
    </section>
  )
}

/** 顶栏「❓ 须知」按钮弹出的完整 FAQ 窗口 */
export function FaqModal({ onClose, onStartRectify }: { onClose: () => void; onStartRectify?: () => void }) {
  const t = useT()
  return (
    <Modal title={t('📖 排盘须知与常见问题')} onClose={onClose} wide>
      <div className="-mx-4 -my-3">
        <FaqList defaultOpen={0} onStartRectify={onStartRectify} />
      </div>
    </Modal>
  )
}
