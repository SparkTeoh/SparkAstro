import { useRef, useState } from 'react'
import { caseDesc, casesToJson, downloadText, mergeImportedCases, type SavedCase } from '../../state/cases'
import { useT } from '../../state/lang'
import { btnCls, inputCls, primaryBtnCls } from '../theme'

interface Props {
  cases: SavedCase[]
  onChange: (cases: SavedCase[]) => void
  onLoad: (c: SavedCase) => void
  onEdit: (c: SavedCase) => void
  /** 工具栏最左侧的额外按钮（如抽屉里的「保存当前命盘」） */
  extraAction?: { label: string; onClick: () => string | void }
  /** 列表为空时的提示（简体） */
  emptyText?: string
}

/** 已保存命例列表：搜索、打开、修改、删除、导入 / 导出 JSON。入口页与命例抽屉共用 */
export function CaseList({ cases, onChange, onLoad, onEdit, extraAction, emptyText = '暂无命例' }: Props) {
  const t = useT()
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const list = cases
    .filter((c) => !q || (c.input.name + caseDesc(c.input) + (c.note ?? '')).includes(q))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const remove = (c: SavedCase) => {
    if (!confirm(t(`确定删除命例「${c.input.name || '未命名'}」？此操作不可撤销。`))) return
    onChange(cases.filter((x) => x.id !== c.id))
  }

  const importJson = async (file: File) => {
    try {
      const { merged, count } = mergeImportedCases(cases, await file.text())
      onChange(merged)
      setMsg(`已导入 ${count} 条命例`)
    } catch {
      setMsg('导入失败：文件格式不正确，请选择由本页「导出 JSON」生成的文件。')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b border-[#CBD5E1] p-3">
        {cases.length > 5 && (
          <input className={inputCls + ' h-9'} placeholder={t('搜索姓名 / 日期 / 地区')} value={q} onChange={(e) => setQ(e.target.value)} />
        )}
        <div className="flex flex-wrap gap-1.5">
          {extraAction && (
            <button
              className={primaryBtnCls + ' mb-[3px] mr-[3px] px-3 py-1.5 text-[13px]'}
              onClick={() => {
                const m = extraAction.onClick()
                if (m) setMsg(m)
              }}
            >
              {t(extraAction.label)}
            </button>
          )}
          <button className={btnCls + ' py-1.5'} onClick={() => fileRef.current?.click()}>
            {t('导入 JSON')}
          </button>
          <button
            className={btnCls + ' py-1.5 disabled:opacity-40'}
            disabled={cases.length === 0}
            onClick={() => downloadText(`ziwei-cases-${new Date().toISOString().slice(0, 10)}.json`, casesToJson(cases), 'application/json')}
          >
            {t('导出 JSON')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importJson(file)
              e.target.value = ''
            }}
          />
        </div>
        {msg && (
          <div className="text-[12px] text-[#4A6072]" role="status">
            {t(msg)}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 && <div className="p-4 text-center text-[13px] text-[#94A3B8]">{t(q ? '没有匹配的命例' : emptyText)}</div>}
        {list.map((c) => (
          <div key={c.id} className="flex items-center gap-1 border-b border-[#E2E8F0] pr-2 last:border-b-0 hover:bg-[#FFFBEB]">
            <button className="min-w-0 flex-1 px-3 py-2.5 text-left" onClick={() => onLoad(c)}>
              <div className="truncate text-[15px] font-bold text-[#003054]">{c.input.name || t('未命名')}</div>
              <div className="truncate text-[12px] text-[#4A6072]">{t(caseDesc(c.input))}</div>
            </button>
            <button className="shrink-0 rounded px-2 py-2 text-[13px] text-[#A85600] hover:bg-[#FFFBEB]" onClick={() => onEdit(c)}>
              {t('修改')}
            </button>
            <button className="shrink-0 rounded px-2 py-2 text-[13px] text-[#C62828] hover:bg-[#FEF2F2]" onClick={() => remove(c)}>
              {t('删除')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
