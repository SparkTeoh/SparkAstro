import { useMemo, useRef, useState } from 'react'
import { fmtClock, resolveBirth, type BirthInput } from '../../core/calendar'
import { isYangStem } from '../../core/constants/base'
import { BLANK_INPUT, type SavedCase } from '../../state/cases'
import { useT } from '../../state/lang'
import { BirthForm } from '../BirthForm/BirthForm'
import { CaseList } from '../CaseList/CaseList'
import { FaqAccordion } from '../FaqSection/FaqSection'
import { cardCls } from '../theme'

interface Props {
  cases: SavedCase[]
  /** 上次排过的盘；从未排过时为 null */
  lastInput: BirthInput | null
  onCasesChange: (cases: SavedCase[]) => void
  /** 提交表单：save 为是否写入命例库，caseId 为正在编辑的命例 id */
  onStart: (input: BirthInput, save: boolean, caseId: string | null) => void
  /** 直接打开一个现成的盘（上次排盘 / 已保存命例） */
  onOpen: (input: BirthInput) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 「上次排盘」一行摘要：阳男 · 公历 1995-06-16 22:30 · 真太阳时 21:10 · 槟城 */
const lastSummary = (i: BirthInput) => {
  try {
    const b = resolveBirth(i)
    const yin = isYangStem(b.ziwei.yearStem) ? '阳' : '阴'
    const c = b.clock
    return `${yin}${i.gender === 'male' ? '男' : '女'} · 公历 ${c.y}-${pad(c.m)}-${pad(c.d)} ${pad(c.h)}:${pad(c.mi)} · 真太阳时 ${fmtClock(b.trueSolar).split(' ')[1]} · ${i.placeName}`
  } catch {
    return null
  }
}

/** 排盘入口首页：居中的生辰资料卡片 + 最近排盘 / 已保存命例快捷入口 */
export function EntryPage({ cases, lastInput, onCasesChange, onStart, onOpen }: Props) {
  const t = useT()
  // 点「修改」把命例载入上方表单；formKey 变化时表单按新初值重建
  const [editing, setEditing] = useState<SavedCase | null>(null)
  const [formKey, setFormKey] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const summary = useMemo(() => (lastInput ? lastSummary(lastInput) : null), [lastInput])

  const startEdit = (c: SavedCase | null) => {
    setEditing(c)
    setFormKey((k) => k + 1)
    if (c) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const changeCases = (next: SavedCase[]) => {
    if (editing && !next.some((c) => c.id === editing.id)) startEdit(null)
    onCasesChange(next)
  }

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-3 py-5 sm:py-8">
      <div className="text-center">
        <p className="text-[13px] leading-6 text-[#4A6072]">{t('输入出生资料，按真太阳时排出 C5VUC 钦天三合标准紫微命盘')}</p>
      </div>

      <section ref={cardRef} className={cardCls + ' scroll-mt-16 p-4 sm:p-6'} aria-label={t('出生资料')}>
        {editing && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-[#F8961D] bg-[#FFFBEB] px-3 py-2 text-[13px] text-[#003054]">
            <span className="min-w-0 truncate">
              {t('正在修改命例：')}
              <b>{editing.input.name || t('未命名')}</b>
            </span>
            <button className="shrink-0 underline" onClick={() => startEdit(null)}>
              {t('取消修改')}
            </button>
          </div>
        )}
        <BirthForm
          key={formKey}
          initial={editing?.input ?? BLANK_INPUT}
          submitLabel="开始排盘 →"
          showSave
          editingSaved={!!editing}
          onSubmit={(input, save) => onStart(input, save, editing?.id ?? null)}
        />
      </section>

      {lastInput && summary && (
        <section aria-label={t('上次排盘')}>
          <h2 className="mb-1.5 px-1 text-[12px] font-bold text-[#4A6072]">{t('上次排盘')}</h2>
          <button
            className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-[#003054] bg-white px-4 py-3 text-left shadow-[3px_3px_0_#003054] hover:bg-[#FFFBEB]"
            onClick={() => onOpen(lastInput)}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold text-[#003054]">{lastInput.name || t('未命名')}</span>
              <span className="block truncate text-[12px] text-[#4A6072]">{t(summary)}</span>
            </span>
            <span className="shrink-0 text-[13px] font-bold text-[#A85600]">{t('打开 →')}</span>
          </button>
        </section>
      )}

      <section aria-label={t('已保存命例')}>
        <h2 className="mb-1.5 px-1 text-[12px] font-bold text-[#4A6072]">
          {t('已保存命例')}
          {cases.length > 0 && `（${cases.length}）`}
        </h2>
        <div className="flex max-h-[420px] flex-col overflow-hidden rounded-xl border-[1.5px] border-[#003054] bg-white">
          <CaseList
            cases={cases}
            onChange={changeCases}
            onLoad={(c) => onOpen(c.input)}
            onEdit={startEdit}
            emptyText="还没有保存的命例。排盘时勾选「保存到我的命例」，下次点名字就能直接打开。"
          />
        </div>
      </section>

      <FaqAccordion />

      <footer className="pb-4 text-center text-[11px] text-[#4A6072]">{t('资料只保存在本机浏览器 · 仅供传统文化研究与个人规划参考')}</footer>
    </main>
  )
}
