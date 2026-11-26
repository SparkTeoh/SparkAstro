import { useEffect, useMemo, useState } from 'react'
import { addMinutes, resolveBirth, type BirthInput } from './core/calendar'
import { computeChart, type PlateType } from './core/ziwei'
import type { Lang } from './core/i18n'
import { LangContext } from './state/lang'
import { toLang } from './core/i18n'
import { EMPTY_SELECTION, buildOverlay, overlapNames, type HoroSelection } from './state/overlay'
import { DEFAULT_INPUT, loadCases, loadLastInput, saveCases, saveLastInput, upsertCase, type SavedCase } from './state/cases'
import { formatAlert } from './state/alerts'
import { ChartGrid } from './components/ChartGrid/ChartGrid'
import type { ViewMode } from './components/ChartGrid/PalaceCell'
import { CenterPalace } from './components/CenterPalace/CenterPalace'
import { HoroscopePanel } from './components/HoroscopePanel/HoroscopePanel'
import { BirthInputModal } from './components/BirthInputModal/BirthInputModal'
import { CaseListDrawer } from './components/CaseListDrawer/CaseListDrawer'
import { EntryPage } from './components/EntryPage/EntryPage'
import { ExportPromptModal } from './components/ExportPromptModal/ExportPromptModal'

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

const navBtn = 'whitespace-nowrap rounded border border-stone-300 bg-white px-2 py-1.5 text-[13px] text-stone-700 hover:bg-stone-100'
const badge = 'rounded bg-amber-800 px-1.5 py-[1px] font-mono text-[11px] text-white'

export default function App({ backHref }: ZiweiAppProps = {}) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [view, setView] = useState<View>('entry')
  const [lastInput, setLastInput] = useState<BirthInput | null>(loadLastInput)
  const [input, setInput] = useState<BirthInput>(() => loadLastInput() ?? DEFAULT_INPUT)
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
    document.title = toLang('文墨天机 C5VUC 紫微斗数排盘', lang)
  }, [lang, backHref])

  const applyInput = (i: BirthInput) => {
    setInput(i)
    setLastInput(i)
    saveLastInput(i)
    setSel(EMPTY_SELECTION)
    setActive(null)
    setBannerClosed(false)
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

  const shiftClock = (minutes: number) => {
    const c = addMinutes(birth.clock, minutes)
    applyInput({ ...input, calendar: 'solar', isLeapMonth: false, year: c.y, month: c.m, day: c.d, hour: c.h, minute: c.mi })
  }

  const langBtn = (
    <button className={navBtn} onClick={() => setLang(lang === 'zh-Hans' ? 'zh-Hant' : 'zh-Hans')} title="简体 / 繁體" aria-label="简体 / 繁體">
      {lang === 'zh-Hans' ? '繁體' : '简体'}
    </button>
  )

  return (
    <LangContext.Provider value={lang}>
      <div className="zw-app-root min-h-screen bg-[#efe8d8] text-stone-800" style={ROOT_STYLE}>
        {view === 'entry' ? (
          <>
            <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-amber-900/20 bg-[#fbf6ea]/95 px-3 py-2 backdrop-blur">
              <div className="min-w-0">
                {backHref && (
                  <a href={backHref} className="whitespace-nowrap text-[12px] text-stone-500 no-underline hover:text-stone-800">
                    ← <span className="hidden min-[400px]:inline">sparkliang.com</span>
                  </a>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-[17px] font-bold text-amber-950">{t('紫微斗数排盘')}</h1>
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
            <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-amber-900/20 bg-[#fbf6ea]/95 px-2 py-2 backdrop-blur sm:px-3">
              <div className="flex items-center gap-1">
                {backHref && (
                  <a href={backHref} className="whitespace-nowrap px-1 text-[12px] text-stone-500 no-underline hover:text-stone-800" title={t('返回主站')}>
                    ← {t('主站')}
                  </a>
                )}
                <button className={navBtn + ' font-medium'} onClick={backToEntry}>
                  ← {t('重新排盘')}
                </button>
                <button className={navBtn} onClick={() => setEdit({ input, caseId: null })}>
                  {t('修改资料')}
                </button>
                <button className={navBtn} onClick={() => setShowCases(true)}>
                  {t('命例')}
                </button>
              </div>
              <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex">
                <h1 className="truncate text-[17px] font-bold text-amber-950">{input.name || t('紫微命盘')}</h1>
                <span className={badge}>C5VUC</span>
              </div>
              <div className="ml-auto flex gap-1">
                {langBtn}
                <button
                  className="whitespace-nowrap rounded bg-amber-700 px-2.5 py-1.5 text-[13px] font-bold text-white shadow-sm hover:bg-amber-800"
                  onClick={() => setShowExport(true)}
                >
                  ✨ {t('AI 详批')}
                  <span className="hidden sm:inline">{t('提示词')}</span>
                </button>
              </div>
            </header>

            <main className="mx-auto flex max-w-[1000px] flex-col gap-3 px-2 py-3 sm:px-4">
              <div className="flex items-center justify-center gap-2 md:hidden">
                <h1 className="truncate text-[15px] font-bold text-amber-950">{input.name || t('紫微命盘')}</h1>
                <span className={badge}>C5VUC</span>
              </div>
              {!bannerClosed && birth.alerts.length > 0 && (
                <div className="relative flex flex-col gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 pr-8 text-[12.5px] leading-5 text-rose-800">
                  {birth.alerts.map((a, i) => (
                    <div key={i} className={a.type === 'boundary' ? 'text-amber-800' : ''}>
                      {t(formatAlert(a, input.placeName, input.longitude))}
                    </div>
                  ))}
                  <button className="absolute right-2 top-1 text-lg text-rose-400 hover:text-rose-700" aria-label="close" onClick={() => setBannerClosed(true)}>
                    ×
                  </button>
                </div>
              )}

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
              <footer className="pb-4 text-center text-[11px] text-stone-500">
                {t('API 1.1.5 · App 2.5.29 · 安星码 C5VUC · 仅供研究与娱乐参考')}
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
