/**
 * Spark Liang 官网设计语言（自包含在 .zw-app-root 内，不依赖宿主全局 CSS）
 * 暖白底 #F1EFE9 · 纯白卡片 · #003054 深海蓝 1.5px 实线描边 + 实色偏移硬阴影 · #F8961D 闪电亮橙。
 * 铁律：橙底必须配 #003054 深海蓝粗体字，不配白字。
 */
export const INK = '#003054'
export const ORANGE = '#F8961D'
export const PAGE_BG = '#F1EFE9'

/** 大卡片：白底 + 深蓝描边 + 4px 硬阴影 */
export const cardCls = 'rounded-xl border-[1.5px] border-[#003054] bg-white shadow-[4px_4px_0_#003054]'
/** 次级面板：白底 + 深蓝描边（无阴影） */
export const panelCls = 'rounded-lg border-[1.5px] border-[#003054] bg-white'

/** 主按钮：橙底 + 深蓝粗体字 + 3px 硬阴影（尺寸由调用方补充） */
export const primaryBtnCls =
  'whitespace-nowrap rounded-md border-[1.5px] border-[#003054] bg-[#F8961D] font-bold text-[#003054] shadow-[3px_3px_0_#003054] transition-transform hover:bg-[#FFA940] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#003054] disabled:cursor-not-allowed disabled:border-[#94A3B8] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] disabled:shadow-none'
/** 次按钮：白底 + 深蓝描边 */
export const ghostBtnCls =
  'whitespace-nowrap rounded-md border-[1.5px] border-[#003054] bg-white font-medium text-[#003054] hover:bg-[#FFFBEB] disabled:cursor-not-allowed disabled:opacity-40'

/** 分段 / 芯片：激活 = 深蓝底白字，未激活 = 白底深蓝字 */
export const segCls = (on: boolean) =>
  on ? 'border-[#003054] bg-[#003054] font-bold text-white' : 'border-[#003054]/35 bg-white text-[#003054] hover:bg-[#FFFBEB]'

export const inputCls =
  'w-full rounded-md border border-[#94A3B8] bg-white px-2 py-1 text-[13px] text-[#003054] placeholder:text-[#94A3B8] focus:border-[#003054] focus:outline-none focus:ring-1 focus:ring-[#003054]'
export const btnCls = ghostBtnCls + ' px-3 py-1 text-[13px]'
export const primaryCls = primaryBtnCls + ' px-3 py-1 text-[13px]'

/** 小字标签 / 辅助说明 */
export const labelCls = 'mb-1 block text-[12px] text-[#4A6072]'
