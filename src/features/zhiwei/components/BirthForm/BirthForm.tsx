import { useMemo, useState } from 'react'
import { fmtClock, resolveBirth, type BirthInput } from '../../core/calendar'
import { PLACES, findPlace, nearestPlace } from '../../core/constants/locations'
import { formatAlert } from '../../state/alerts'
import { useT } from '../../state/lang'
import { ghostBtnCls, labelCls, primaryBtnCls, segCls as segTone } from '../theme'

interface Props {
  initial: BirthInput
  /** 主按钮文案（简体，内部转换） */
  submitLabel: string
  /** save：是否勾选了「保存到我的命例」（未显示勾选框时恒为 false） */
  onSubmit: (input: BirthInput, save: boolean) => void
  onCancel?: () => void
  /** 是否显示「保存到我的命例」勾选框（入口页使用） */
  showSave?: boolean
  /** 正在编辑一条已保存命例时为 true：勾选框默认勾选并显示为「更新」 */
  editingSaved?: boolean
}

const GROUP_ORDER = ['马来西亚 · 西马', '马来西亚 · 东马', '新加坡', '港澳台', '中国大陆']
const CUSTOM = '__custom__'
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const YEAR_MIN = 1900
const YEAR_MAX = 2100

// 16px 字号避免 iOS 聚焦时自动放大页面；44px 高度方便触控
const fieldCls =
  'h-11 w-full rounded-md border border-[#94A3B8] bg-white px-2 text-[16px] text-[#003054] placeholder:text-[#94A3B8] focus:border-[#003054] focus:outline-none focus:ring-1 focus:ring-[#003054] sm:h-10 sm:text-[14px]'
const segCls = (on: boolean) =>
  `h-11 flex-1 whitespace-nowrap rounded-md border-[1.5px] px-4 text-[15px] font-medium transition-colors sm:h-10 sm:text-[14px] ${segTone(on)}`

/** 快速输入：1995-06-16 22:30 / 1995/6/16 22:30 / 199506162230 */
const parseQuickDate = (raw: string) => {
  const s = raw.trim()
  const m =
    /^(\d{4})\D+(\d{1,2})\D+(\d{1,2})(?:\D+(\d{1,2})(?:\D+(\d{1,2}))?)?\D*$/.exec(s) ??
    /^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})?)?$/.exec(s)
  if (!m) return null
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const hour = m[4] === undefined ? null : Number(m[4])
  const minute = m[5] === undefined ? null : Number(m[5])
  if (year < YEAR_MIN || year > YEAR_MAX || month < 1 || month > 12 || day < 1 || day > 31) return null
  if ((hour !== null && hour > 23) || (minute !== null && minute > 59)) return null
  return { year, month, day, hour, minute }
}

/** 生辰资料表单：入口页卡片与「修改资料」弹窗共用 */
export function BirthForm({ initial, submitLabel, onSubmit, onCancel, showSave, editingSaved }: Props) {
  const t = useT()
  const [f, setF] = useState<BirthInput>(initial)
  const [advanced, setAdvanced] = useState(false)
  const [geoMsg, setGeoMsg] = useState('')
  const [quick, setQuick] = useState('')
  // 未手动点过勾选框时：填了姓名（或正在编辑已存命例）就默认保存
  const [saveChoice, setSaveChoice] = useState<boolean | null>(null)
  const save = saveChoice ?? (editingSaved || f.name.trim() !== '')
  const set = <K extends keyof BirthInput>(k: K, v: BirthInput[K]) => setF((x) => ({ ...x, [k]: v }))

  const place = findPlace(f.placeId)
  const preview = useMemo(() => {
    try {
      return resolveBirth(f)
    } catch {
      return null
    }
  }, [f])

  const before1982 = preview ? Date.UTC(preview.clock.y, preview.clock.m - 1, preview.clock.d) < Date.UTC(1982, 0, 1) : false
  const showWestMy = !!place?.westMalaysia && before1982

  const pickPlace = (id: string) => {
    if (id === CUSTOM) {
      setF((x) => ({ ...x, placeId: CUSTOM, placeName: '自定义' }))
      setAdvanced(true)
      return
    }
    const p = findPlace(id)!
    setF((x) => ({ ...x, placeId: p.id, placeName: p.name, longitude: p.lon, tz: p.tz }))
  }

  const useGeo = () => {
    if (!('geolocation' in navigator)) {
      setGeoMsg('当前浏览器不支持定位，请手动选择地区。')
      return
    }
    setGeoMsg('正在定位…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000) / 1000
        const lon = Math.round(pos.coords.longitude * 1000) / 1000
        const { place: near } = nearestPlace(lat, lon)
        const tz = Math.round((-new Date().getTimezoneOffset() / 60) * 2) / 2
        setF((x) => ({ ...x, placeId: CUSTOM, placeName: `当前位置（近${near.name}）`, longitude: lon, tz }))
        setGeoMsg(`已定位：${lon}°E, ${lat}°N（近${near.name}）`)
      },
      (err) => {
        const msg =
          err.code === 1
            ? '您拒绝了定位权限，请手动选择地区。'
            : err.code === 3
              ? '定位超时，请重试或手动选择地区。'
              : '无法获取位置（需 HTTPS 环境或设备支持），请手动选择地区。'
        setGeoMsg(msg)
      },
      { timeout: 10000, maximumAge: 600000 },
    )
  }

  const onQuick = (raw: string) => {
    setQuick(raw)
    const q = parseQuickDate(raw)
    if (!q) return
    setF((x) => ({
      ...x, year: q.year, month: q.month, day: Math.min(q.day, x.calendar === 'lunar' ? 30 : 31),
      hour: q.hour ?? x.hour, minute: q.minute ?? x.minute,
    }))
  }
  const quickBad = quick.trim() !== '' && !parseQuickDate(quick)

  const groups = GROUP_ORDER.map((g) => ({ g, items: PLACES.filter((p) => p.group === g) }))

  return (
    <form
      className="flex flex-col gap-4 text-[13px] text-[#003054]"
      onSubmit={(e) => {
        e.preventDefault()
        if (preview) onSubmit({ ...f, name: f.name.trim() }, !!showSave && save)
      }}
    >
      <div className="flex gap-3">
        <label className="min-w-0 flex-1">
          <span className={labelCls}>{t('姓名')}</span>
          <input
            className={fieldCls}
            value={f.name}
            placeholder={t('输入姓名或称呼（选填）')}
            onChange={(e) => set('name', e.target.value)}
          />
        </label>
        <div className="w-[132px] shrink-0">
          <span className={labelCls}>{t('性别')}</span>
          <div className="flex gap-1">
            {(['male', 'female'] as const).map((g) => (
              <button type="button" key={g} aria-pressed={f.gender === g} onClick={() => set('gender', g)} className={segCls(f.gender === g)}>
                {t(g === 'male' ? '男' : '女')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <span className={labelCls}>{t('出生日期与钟表时间')}</span>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex w-[168px] shrink-0 gap-1">
            {(['solar', 'lunar'] as const).map((c) => (
              <button type="button" key={c} aria-pressed={f.calendar === c} onClick={() => set('calendar', c)} className={segCls(f.calendar === c)}>
                {t(c === 'solar' ? '公历' : '农历')}
              </button>
            ))}
          </div>
          {f.calendar === 'lunar' && (
            <label className="flex h-11 items-center gap-1.5 text-[14px] sm:h-10">
              <input type="checkbox" className="h-4 w-4 accent-[#003054]" checked={f.isLeapMonth} onChange={(e) => set('isLeapMonth', e.target.checked)} />
              {t('闰月')}
            </label>
          )}
        </div>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-1.5">
          <Sel label={t('年')} value={f.year} opts={range(YEAR_MIN, YEAR_MAX)} onChange={(v) => set('year', v)} />
          <Sel label={t('月')} value={f.month} opts={range(1, 12)} onChange={(v) => set('month', v)} />
          <Sel label={t('日')} value={f.day} opts={range(1, f.calendar === 'lunar' ? 30 : 31)} onChange={(v) => set('day', v)} />
          <Sel label={t('时')} value={f.hour} opts={range(0, 23)} onChange={(v) => set('hour', v)} />
          <Sel label={t('分')} value={f.minute} opts={range(0, 59)} onChange={(v) => set('minute', v)} />
        </div>
        <input
          className={`${fieldCls} mt-2 ${quickBad ? 'border-[#C62828]' : ''}`}
          inputMode="numeric"
          value={quick}
          aria-label={t('快速输入出生日期时间')}
          placeholder={t('或快速输入：1995-06-16 22:30 / 199506162230')}
          onChange={(e) => onQuick(e.target.value)}
        />
      </div>

      <div>
        <span className={labelCls}>{t('出生地（用于换算真太阳时）')}</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className={fieldCls} value={place ? f.placeId : CUSTOM} onChange={(e) => pickPlace(e.target.value)}>
            {groups.map(({ g, items }) => (
              <optgroup key={g} label={t(g)}>
                {items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(p.name)} {p.en} ({p.lon}°E)
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={CUSTOM}>{t(place ? '自定义经度…' : f.placeName)}</option>
          </select>
          <button
            type="button"
            className={ghostBtnCls + ' h-11 shrink-0 px-3 text-[14px] sm:h-10 sm:text-[13px]'}
            onClick={useGeo}
          >
            📍 {t('使用当前位置')}
          </button>
        </div>
        {geoMsg && <div className="mt-1 text-[12px] text-[#4A6072]">{t(geoMsg)}</div>}

        {showWestMy && (
          <label className="mt-2 flex items-start gap-2 rounded-md border border-[#F8961D] bg-[#FFFBEB] p-2 text-[12px] leading-5 text-[#003054]">
            <input type="checkbox" className="mt-[3px] h-4 w-4 shrink-0 accent-[#003054]" checked={f.tz === 7.5} onChange={(e) => set('tz', e.target.checked ? 7.5 : 8)} />
            <span>{t('1982年以前西马标准钟表时间为 UTC+7:30（标准经线 112.5°）。勾选则按 UTC+7:30 换算。')}</span>
          </label>
        )}

        <button type="button" className="mt-2 py-1 text-[12px] text-[#A85600] underline" aria-expanded={advanced} onClick={() => setAdvanced((a) => !a)}>
          {t(advanced ? '收起高级选项' : '高级选项（经度 / 时区 / 夏令时）')}
        </button>
        {advanced && (
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label>
              <span className={labelCls}>{t('经度 (°E)')}</span>
              <input
                className={fieldCls}
                type="number"
                step="0.001"
                value={f.longitude}
                onChange={(e) => setF((x) => ({ ...x, longitude: Number(e.target.value), placeId: CUSTOM, placeName: x.placeId === CUSTOM ? x.placeName : '自定义' }))}
              />
            </label>
            <label>
              <span className={labelCls}>{t('时区 (UTC+)')}</span>
              <select className={fieldCls} value={f.tz} onChange={(e) => set('tz', Number(e.target.value))}>
                {[5.5, 7, 7.5, 8, 9, 10].map((z) => (
                  <option key={z} value={z}>
                    UTC+{Math.floor(z)}:{z % 1 ? '30' : '00'}（{z * 15}°）
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 flex items-center gap-1.5 sm:col-span-1 sm:items-end sm:pb-2.5">
              <input type="checkbox" className="h-4 w-4 accent-[#003054]" checked={f.dst} onChange={(e) => set('dst', e.target.checked)} />
              {t('夏令时（-60分钟）')}
            </label>
          </div>
        )}
      </div>

      {preview ? (
        <div className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] p-3 text-[12.5px] leading-6" aria-live="polite">
          <div>
            {t('真太阳时')}：<b className="text-[14px] text-[#003054]">{fmtClock(preview.trueSolar)}</b>
            <span className="ml-2 text-[#4A6072]">
              （{t('钟表时间')} {fmtClock(preview.clock)}）
            </span>
          </div>
          <div>
            {t('农历')}：{t(preview.lunarText)}
          </div>
          <div>
            {t('节气四柱')}：{t(preview.jieqiPillars.join(' '))}
          </div>
          {preview.alerts.map((a, i) => (
            <div
              key={i}
              className={`mt-1.5 rounded border p-2 leading-5 ${a.type === 'cross' ? 'border-[#C62828] bg-[#FEF2F2] font-medium text-[#C62828]' : 'border-[#F8961D] bg-[#FFFBEB] text-[#A85600]'}`}
            >
              {t(formatAlert(a, f.placeName, f.longitude))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-[#C62828] bg-[#FEF2F2] p-3 text-[12.5px] text-[#C62828]" role="alert">
          {t('这个日期不存在，请检查年月日（例如农历小月没有三十日、该年没有这个闰月）。')}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {showSave ? (
          <label className="flex items-center gap-2 py-1 text-[14px] text-[#003054]">
            <input type="checkbox" className="h-4 w-4 accent-[#003054]" checked={save} onChange={(e) => setSaveChoice(e.target.checked)} />
            {t(editingSaved ? '更新本机已保存的命例' : '记住在本机浏览器（不上传服务器）')}
          </label>
        ) : (
          <span />
        )}
        <div className="ml-auto flex gap-2.5 pb-[3px] pr-[3px]">
          {onCancel && (
            <button type="button" className={ghostBtnCls + ' h-11 px-4 text-[14px]'} onClick={onCancel}>
              {t('取消')}
            </button>
          )}
          <button
            type="submit"
            disabled={!preview}
            className={primaryBtnCls + ' h-11 px-6 text-[16px]'}
          >
            {t(submitLabel)}
          </button>
        </div>
      </div>

      <p className="rounded-md border border-[#003054]/10 bg-[#F8FAFC] px-3 py-2 text-[12px] leading-[1.6] text-[#4A6072]">
        🔒 {t('隐私安心承诺：排盘纯在你的手机/电脑本地运行，本站无后台数据库、绝不上传或收集任何生辰资料；姓名栏可留空或填代号（如 A 先生），完全不影响排盘准确度。')}
      </p>
    </form>
  )
}

function Sel({ label, value, opts, onChange }: { label: string; value: number; opts: number[]; onChange: (v: number) => void }) {
  return (
    <label>
      <span className="mb-0.5 block text-center text-[11px] text-[#94A3B8]">{label}</span>
      <select className={fieldCls + ' px-1'} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
