import type { ExportMode } from '../../core/exporter'

/** 四大模式卡片（简体，显示时再转换） */
export const EXPORT_MODE_CARDS: { key: ExportMode; icon: string; title: string; desc: string; file: string }[] = [
  { key: 'career', icon: '🎯', title: '未来 3～5 年运势与规划', desc: '事业财运、转职创业、感情置产等核心课题逐年推演（预计算零误差）', file: '未来运势规划' },
  { key: 'annual', icon: '📅', title: '年度精批 + 12 流月日历', desc: '聚焦今年或明年，排出一整年 1～12 月节奏参考', file: '年度精批' },
  { key: 'life', icon: '🧭', title: '一生总格局 + 八大十年大运', desc: '全面摸清天生优势、适合赛道与每十年大运起伏', file: '一生总格局' },
  { key: 'natal', icon: '📄', title: '纯净命盘数据', desc: '仅导出结构化排盘数据，方便自由向 AI 提问', file: '命盘数据' },
]

/** 弹窗内的固定文案（简体，显示时再转换；测试据此检查繁体无残留） */
export const EXPORT_UI_TEXT = {
  status: '当前状态（单选，可点选也可再次点击取消，不选亦正常生成）',
  focus: '重点关注方向（可多选，不选则默认全面综合分析）',
  question: '✍️ 我具体想问的问题 / 补充背景（选填）',
  questionPlaceholder: '如果有具体纠结的事，直接用大白话写在这里（例：未来两年适合结婚买房吗？想换跑道可行吗？）',
  download: '下载 .txt',
  copy: '一键复制',
  copied: '已复制到剪贴板',
  copyFailed: '复制失败，请在下方文本框内手动全选复制',
} as const
