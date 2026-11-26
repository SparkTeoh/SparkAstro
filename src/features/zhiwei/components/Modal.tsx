import type { ReactNode } from 'react'

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-lg bg-[#fffdf8] shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-2">
          <h2 className="text-[15px] font-bold text-stone-800">{title}</h2>
          <button onClick={onClose} className="px-2 text-xl leading-none text-stone-500 hover:text-stone-800" aria-label="close">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export const inputCls =
  'w-full rounded border border-stone-300 bg-white px-2 py-1 text-[13px] text-stone-800 focus:border-amber-600 focus:outline-none'
export const btnCls = 'rounded border border-stone-300 bg-white px-3 py-1 text-[13px] text-stone-700 hover:bg-stone-100'
export const primaryCls = 'rounded bg-amber-700 px-3 py-1 text-[13px] font-medium text-white hover:bg-amber-800'
