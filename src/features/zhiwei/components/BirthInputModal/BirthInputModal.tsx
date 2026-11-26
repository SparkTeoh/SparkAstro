import type { BirthInput } from '../../core/calendar'
import { useT } from '../../state/lang'
import { BirthForm } from '../BirthForm/BirthForm'
import { Modal } from '../Modal'

interface Props {
  initial: BirthInput
  onClose: () => void
  onSubmit: (i: BirthInput) => void
}

/** 命盘页「修改资料」弹窗：复用入口页同一套生辰表单 */
export function BirthInputModal({ initial, onClose, onSubmit }: Props) {
  const t = useT()
  return (
    <Modal title={t('修改资料')} onClose={onClose}>
      <BirthForm initial={initial} submitLabel="更新命盘" onSubmit={(i) => onSubmit(i)} onCancel={onClose} />
    </Modal>
  )
}
