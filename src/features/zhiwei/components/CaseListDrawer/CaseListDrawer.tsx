import type { BirthInput } from '../../core/calendar'
import { findSameCase, upsertCase, type SavedCase } from '../../state/cases'
import { useT } from '../../state/lang'
import { CaseList } from '../CaseList/CaseList'

interface Props {
  cases: SavedCase[]
  current: BirthInput
  onChange: (cases: SavedCase[]) => void
  onLoad: (c: SavedCase) => void
  onEdit: (c: SavedCase) => void
  onClose: () => void
}

/** 命盘页的命例抽屉：快速切换其他人的盘，或把当前未保存的盘存入命例 */
export function CaseListDrawer({ cases, current, onChange, onLoad, onEdit, onClose }: Props) {
  const t = useT()
  const saveCurrent = () => {
    if (findSameCase(cases, current)) return '当前命盘已在命例中'
    onChange(upsertCase(cases, current))
    return '已保存当前命盘'
  }

  return (
    <div className="fixed inset-0 z-40 flex bg-[#003054]/45" onClick={onClose}>
      <div className="flex h-full w-full max-w-sm flex-col border-r-[1.5px] border-[#003054] bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-[1.5px] border-[#003054] px-4 py-2.5">
          <h2 className="text-[15px] font-bold text-[#003054]">{t('命例列表')}</h2>
          <button onClick={onClose} className="px-2 text-xl leading-none text-[#4A6072]" aria-label="close">
            ×
          </button>
        </div>
        <CaseList
          cases={cases}
          onChange={onChange}
          onLoad={onLoad}
          onEdit={onEdit}
          extraAction={{ label: '保存当前命盘', onClick: saveCurrent }}
        />
      </div>
    </div>
  )
}
