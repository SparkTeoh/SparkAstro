import type { ReactNode } from 'react'

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#003054]/45 p-3 sm:p-6" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl border-[1.5px] border-[#003054] bg-white shadow-[4px_4px_0_#003054]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-[1.5px] border-[#003054] px-4 py-2.5">
          <h2 className="text-[15px] font-bold text-[#003054]">{title}</h2>
          <button onClick={onClose} className="px-2 text-xl leading-none text-[#4A6072] hover:text-[#003054]" aria-label="close">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
