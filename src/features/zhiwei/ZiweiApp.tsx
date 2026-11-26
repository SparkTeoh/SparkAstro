import { useEffect, useMemo, useState } from 'react'
import { resolveBirth, type BirthInput } from './core/calendar'
import { computeChart, type PlateType } from './core/ziwei'
import type { Lang } from './core/i18n'
import { LangContext } from './state/lang'
import { toLang } from './core/i18n'
import { EMPTY_SELECTION, buildOverlay, overlapNames, type HoroSelection } from './state/overlay'
import { DEFAULT_INPUT, findSameCase, loadCases, loadLastInput, saveCases, saveLastInput, upsertCase, type SavedCase } from './state/cases'
import { effectiveInput, hourBarInfo, hourShiftReducer, shiftInput, type HourShiftAction, type HourShiftState } from './state/hourShift'
import { formatAlert } from './state/alerts'
import { ChartGrid } from './components/ChartGrid/ChartGrid'
import type { ViewMode } from './components/ChartGrid/PalaceCell'
import { CenterPalace } from './components/CenterPalace/CenterPalace'
import { HoroscopePanel } from './components/HoroscopePanel/HoroscopePanel'
import { BirthInputModal } from './components/BirthInputModal/BirthInputModal'
import { CaseListDrawer } from './components/CaseListDrawer/CaseListDrawer'
import { EntryPage } from './components/EntryPage/EntryPage'
import { ExportPromptModal } from './components/ExportPromptModal/ExportPromptModal'
import { HourCompareBar } from './components/HourCompareBar/HourCompareBar'
import { ghostBtnCls, primaryBtnCls } from './components/theme'

const LANG_KEY = 'ziwei-c5vuc-lang'
const initialLang = (): Lang => {
  try {
    return localStorage.getItem(LANG_KEY) === 'zh-Hant' ? 'zh-Hant' : 'zh-Hans'
  } catch {
    return 'zh-Hans'
  }
}

export interface ZiweiAppProps {
  /** 传入时在顶栏最左侧渲染返回宿主站点的链接（嵌入宿主站点时使用） */
  backHref?: string
}

/** entry：排盘入口首页（默认首屏）；chart：命盘详情页 */
type View = 'entry' | 'chart'

/** 宿主嵌入时的根样式：自带字体栈与背景，不依赖全局 html/body 样式 */
const ROOT_STYLE = {
  fontFamily:
    "'PingFang SC', 'PingFang TC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', system-ui, sans-serif",
  WebkitTextSizeAdjust: '100%',
} as const

const navBtn = ghostBtnCls + ' px-2 py-1.5 text-[13px]'
const badge = 'rounded bg-[#003054] px-1.5 py-[1px] font-mono text-[11px] font-bold text-white'
const headerCls = 'sticky top-0 z-30 border-b-[1.5px] border-[#003054] bg-[#F1EFE9]/95 backdrop-blur'
const titleCls = 'truncate font-bold text-[#003054]'
const backLink = 'whitespace-nowrap text-[12px] text-[#4A6072] no-underline hover:text-[#003054]'
const PAGE_TITLE = '紫微斗数排盘'

export default function App({ backHref }: ZiweiAppProps = {}) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [view, setView] = useState<View>('entry')
  const [lastInput, setLastInput] = useState<BirthInput | null>(loadLastInput)
  /** baseInput：正式设定的原始生辰；hourOffset：时辰对比栏的临时偏移 */
  const [shift, setShift] = useState<HourShiftState>(() => ({ baseInput: loadLastInput() ?? DEFAULT_INPUT, hourOffset: 0 }))
  const { baseInput, hourOffset } = shift
  /** 当前实际用于排盘的生辰（effectiveInput） */
  const input = useMemo(() => {
    try {
      return effectiveInput(shift)
    } catch {
      return shift.baseInput
    }
  }, [shift])
  const [plate, setPlate] = useState<PlateType>('heaven')
  const [mode, setMode] = useState<ViewMode>('sanhe')
  const [sel, setSel] = useState<HoroSelection>(EMPTY_SELECTION)
  const [active, setActive] = useState<number | null>(null)
  const [cases, setCases] = useState<SavedCase[]>(loadCases)
  /** 「修改资料」弹窗：caseId 非空表示正在修改一条已保存命例，提交时同步更新命例库 */
  const [edit, setEdit] = useState<{ input: BirthInput; caseId: string | null } | null>(null)
  const [showCases, setShowCases] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [bannerClosed, setBannerClosed] = useState(false)
  const t = (s: string) => toLang(s, lang)

  const birth = useMemo(() => {
    try {
      return resolveBirth(input)
    } catch {
      return resolveBirth(DEFAULT_INPUT)
    }
  }, [input])
  const chart = useMemo(() => computeChart({ ...birth.ziwei, gender: input.gender, plate }), [birth, input.gender, plate])
  const overlay = useMemo(() => buildOverlay(chart, birth.ziwei.lunarYear, sel), [chart, birth, sel])
  // 焦点优先级：手动锁定宫位 > 流时 > 流日 > 流月 > 流年 > 大限命宫 > 本命宫
  const activePalace = active ?? overlay.layers[overlay.layers.length - 1]?.base ?? chart.lifeIndex
  const horoActive = sel.decade !== null || sel.year !== null
  const overlap = useMemo(() => (overlay.layers.length ? overlapNames(overlay.layers) : undefined), [overlay])
  const hourInfo = useMemo(() => hourBarInfo(shift), [shift])
  const changeSel = (s: HoroSelection) => {
    setSel(s)
    setActive(null)
  }

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* ignore */
    }
    // 嵌入宿主站点时不改写宿主的 <html lang> 与页面标题
    if (backHref) return
    document.documentElement.lang = lang
    document.title = toLang(`${PAGE_TITLE} · C5VUC`, lang)
  }, [lang, backHref])

  /** 换盘后重置限流选择、焦点宫位与提醒横幅 */
  const resetChartView = () => {
    setSel(EMPTY_SELECTION)
    setActive(null)
    setBannerClosed(false)
  }
  /** 正式设定一份生辰：同步重置 baseInput 与 hourOffset = 0 */
  const applyInput = (i: BirthInput) => {
    setShift({ baseInput: i, hourOffset: 0 })
    setLastInput(i)
    saveLastInput(i)
    resetChartView()
  }
  /** 时辰对比栏：上一时辰 / 下一时辰 / 回原时辰（只改临时偏移，不动原始生辰） */
  const shiftHour = (a: HourShiftAction) => {
    setShift((s) => hourShiftReducer(s, a))
    resetChartView()
  }
  /** ✓ 设为真实时辰：把偏移后的生辰固化为原始生辰；若原生辰是已保存命例则同步更新该命例 */
  const commitHour = () => {
    if (hourOffset === 0) return
    const linked = findSameCase(cases, baseInput)
    if (linked) updateCases(upsertCase(cases, input, linked.id))
    applyInput(input)
  }
  const updateCases = (c: SavedCase[]) => {
    setCases(c)
    saveCases(c)
  }
  /** 进入命盘详情页 */
  const openChart = (i: BirthInput) => {
    applyInput(i)
    setView('chart')
    window.scrollTo(0, 0)
  }
  /** 回到排盘入口首页 */
  const backToEntry = () => {
    setShowCases(false)
    setShowExport(false)
    setEdit(null)
    setView('entry')
    window.scrollTo(0, 0)
  }

  /** 中宫 日↑/日↓/时↑/时↓：在当前生效生辰上直接偏移并固化 */
  const shiftClock = (minutes: number) => applyInput(shiftInput(input, minutes))

  const langBtn = (
    <button className={navBtn} onClick={() => setLang(lang === 'zh-Hans' ? 'zh-Hant' : 'zh-Hans')} title="简体 / 繁體" aria-label="简体 / 繁體">
      {lang === 'zh-Hans' ? '繁體' : '简体'}
    </button>
  )

  return (
    <LangContext.Provider value={lang}>
      <div className="zw-app-root min-h-screen bg-[#F1EFE9] text-[#003054]" style={ROOT_STYLE}>
        {view === 'entry' ? (
          <>
            <header className={headerCls + ' grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2'}>
              <div className="min-w-0">
                {backHref && (
                  <a href={backHref} className={backLink}>
                    ← <span className="hidden min-[400px]:inline">sparkliang.com</span>
                  </a>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <h1 className={titleCls + ' text-[17px]'}>{t(PAGE_TITLE)}</h1>
                <span className={badge}>C5VUC</span>
              </div>
              <div className="flex justify-end">{langBtn}</div>
            </header>
            <EntryPage
              cases={cases}
              lastInput={lastInput}
              onCasesChange={updateCases}
              onOpen={openChart}
              onStart={(i, save, caseId) => {
                if (save) updateCases(upsertCase(cases, i, caseId))
                openChart(i)
              }}
            />
          </>
        ) : (
          <>
            <header className={headerCls + ' flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-2 py-2 sm:px-3'}>
              <div className="flex items-center gap-1">
                {backHref && (
                  <a href={backHref} className={backLink + ' px-1'} title={t('返回主站')}>
                    ← {t('主站')}
                  </a>
                )}
                <button className={navBtn} onClick={backToEntry}>
                  ← {t('重新排盘')}
                </button>
                <button className={navBtn} onClick={() => setEdit({ input: baseInput, caseId: null })}>
                  {t('修改资料')}
                </button>
                <button className={navBtn} onClick={() => setShowCases(true)}>
                  {t('命例')}
                </button>
              </div>
              <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex">
                <h1 className={titleCls + ' text-[17px]'}>{input.name || t(PAGE_TITLE)}</h1>
                <span className={badge}>C5VUC</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 pb-[3px] pr-[3px]">
                {langBtn}
                <button className={primaryBtnCls + ' px-2.5 py-1.5 text-[13px]'} onClick={() => setShowExport(true)}>
                  ✨ {t('AI 详批')}
                  <span className="hidden sm:inline">{t('提示词')}</span>
                </button>
              </div>
            </header>

            <main className="mx-auto flex max-w-[1000px] flex-col gap-3 px-2 py-3 sm:px-4">
              <div className="flex items-center justify-center gap-2 md:hidden">
                <h1 className={titleCls + ' text-[15px]'}>{input.name || t(PAGE_TITLE)}</h1>
                <span className={badge}>C5VUC</span>
              </div>
              {!bannerClosed && birth.alerts.length > 0 && (
                <div className="relative flex flex-col gap-1 rounded-lg border-[1.5px] border-[#C62828] bg-[#FEF2F2] px-3 py-2 pr-8 text-[12.5px] font-medium leading-5 text-[#C62828]">
                  {birth.alerts.map((a, i) => (
                    <div key={i} className={a.type === 'boundary' ? 'text-[#A85600]' : ''}>
                      {t(formatAlert(a, input.placeName, input.longitude))}
                    </div>
                  ))}
                  <button className="absolute right-2 top-1 text-lg text-[#C62828]/60 hover:text-[#C62828]" aria-label="close" onClick={() => setBannerClosed(true)}>
                    ×
                  </button>
                </div>
              )}

              <HourCompareBar
                info={hourInfo}
                onPrev={() => shiftHour({ type: 'prev' })}
                onNext={() => shiftHour({ type: 'next' })}
                onReset={() => shiftHour({ type: 'reset' })}
                onCommit={commitHour}
              />

              <ChartGrid
                chart={chart}
                mode={mode}
                overlay={overlay}
                activePalace={activePalace}
                onSelectPalace={setActive}
                center={
                  <CenterPalace
                    birth={birth}
                    chart={chart}
                    plate={plate}
                    onPlate={setPlate}
                    onShiftDay={(d) => shiftClock(d * 1440)}
                    onShiftHour={(d) => shiftClock(d * 120)}
                    horoActive={horoActive}
                    onBackToNatal={() => changeSel(EMPTY_SELECTION)}
                  />
                }
              />

              <HoroscopePanel
                chart={chart}
                birthLunarYear={birth.ziwei.lunarYear}
                sel={sel}
                onChange={changeSel}
                mode={mode}
                onMode={setMode}
              />
              <footer className="pb-4 text-center text-[11px] text-[#4A6072]">
                {t('紫微斗数排盘 · C5VUC 钦天三合标准 · 仅供传统文化研究与个人规划参考')}
              </footer>
            </main>

            {edit && (
              <BirthInputModal
                initial={edit.input}
                onClose={() => setEdit(null)}
                onSubmit={(i) => {
                  if (edit.caseId) updateCases(upsertCase(cases, i, edit.caseId))
                  applyInput(i)
                  setEdit(null)
                }}
              />
            )}
            {showCases && (
              <CaseListDrawer
                cases={cases}
                current={input}
                onChange={updateCases}
                onLoad={(c) => {
                  applyInput(c.input)
                  setShowCases(false)
                }}
                onEdit={(c) => {
                  setShowCases(false)
                  setEdit({ input: c.input, caseId: c.id })
                }}
                onClose={() => setShowCases(false)}
              />
            )}
            {showExport && <ExportPromptModal birth={birth} chart={chart} overlap={overlap} onClose={() => setShowExport(false)} />}
          </>
        )}
      </div>
    </LangContext.Provider>
  )
}
