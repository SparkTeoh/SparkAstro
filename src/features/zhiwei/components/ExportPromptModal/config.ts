import type { PromptMode } from '../../core/exporter'

/** 四大详批模式卡片（2×2 对称排布，讲清每个模式的使用时机；简体基准，显示时再转换） */
export const EXPORT_MODE_CARDS: { key: PromptMode; icon: string; title: string; desc: string; file: string }[] = [
  {
    key: 'life',
    icon: '🧭',
    title: '一生总格局 + 八大十年大运',
    desc: '首次排盘必看：先摸清天生适合什么赛道、怎么搞钱最顺、感情相处模式，以及每十年大运的高低起伏',
    file: '一生总格局',
  },
  {
    key: 'annual',
    icon: '📅',
    title: '年度精批 + 12 流月节奏',
    desc: '看今年或明年：聚焦最近一整年的事业、财运、感情与健康重点，理清农历 1～12 月哪几个月适合发力、哪几个月宜稳守',
    file: '年度精批',
  },
  {
    key: 'career',
    icon: '🎯',
    title: '未来 3～5 年运势与规划',
    desc: '做关键决策与布局：正在考虑转职跳槽、创业扩张、买房置产或结婚生子时用，逐年对比哪一年该冲、哪一年该蓄力',
    file: '未来运势规划',
  },
  {
    key: 'natal',
    icon: '📄',
    title: '纯净命盘数据',
    desc: '双人合盘 / 自由提问：适合导出两份命盘发给 AI 做夫妻感情合盘、合伙人合盘，或搭配你自己的提示词自由提问',
    file: '命盘数据',
  },
]

/** 弹窗内的固定文案（简体，显示时再转换；测试据此检查繁体无残留） */
export const EXPORT_UI_TEXT = {
  rectifyJumpPrefix: '不确定出生时间，或刚因真太阳时跨了时辰？',
  rectifyJumpBtn: '🔍 先去 AI 时辰定盘印证 →',
  profileHint: '💡 命理师问诊卡（选填）：同盘不同命，告诉 AI 你的真实工作、婚育与近况，分析会精准贴合现实而非空泛套话',
  rectifyHint: '💡 看不懂星曜没关系！因真太阳时常把钟表时间往回退一个时辰，默认优先对比「当前时辰 vs 下一时辰（原手表时辰）」；若父母记忆时间较模糊，也可切换其他范围。',
  rectifyScope: '候选时辰对比范围',
  pastEvents: '📝 过往关键年份大事记（选填，用于铁证验盘；留空则由 AI 盲测出题考你）',
  pastEventsPlaceholder: '可留空直接复制！若想一步到位验盘，可填 2～3 件过去真实发生过的年份大事（例：2020年换工作搬家，2022年创业亏了一笔钱，2024年结婚生子）',
  status: '当前状态（单选，可点选也可再次点击取消，不选亦正常生成）',
  family: '婚姻与子女状态（选填，点选后可避免感情与家庭宫位误判）',
  occupation: '💼 具体工作 / 行业角色（选填）',
  occupationPlaceholder: '例：经营两家餐饮店 / 科技公司主管 / 房产经纪 / 全职妈妈兼做电商',
  pastContext: '📊 过去 1～3 年经营或生活近况（选填，供验盘校准与定调）',
  pastContextPlaceholder: '例：前两年生意稳步增长，今年成本上升现金流偏紧；刚换工作半年还在适应期…',
  focus: '重点关注方向（可多选，不选则默认全面综合分析）',
  question: '✍️ 我具体想问的问题 / 补充背景（选填）',
  questionPlaceholder: '如果有具体纠结的事，直接用大白话写在这里（例：未来两年适合结婚买房吗？想换跑道可行吗？）',
  download: '下载 .txt',
  copy: '一键复制',
  copied: '已复制到剪贴板',
  copyFailed: '复制失败，请在下方文本框内手动全选复制',
} as const
