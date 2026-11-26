import { BRANCHES, STEMS } from '../../core/constants/base'
import { MUTAGEN_COLORS } from '../../core/constants/stars'
import type { Palace, Star } from '../../core/ziwei'
import type { Overlay } from '../../state/overlay'
import { useT } from '../../state/lang'
import { CELL_H, CELL_W } from './geometry'

export type ViewMode = 'flying' | 'sanhe' | 'sihua'

/** 四化模式保留的小星 */
const SIHUA_KEEP = new Set(['红鸾', '天喜', '天刑', '天姚'])

const visibleStars = (p: Palace, mode: ViewMode) =>
  p.stars.filter((s) => {
    if (s.kind !== 'minor') return true
    if (mode === 'flying') return false
    if (mode === 'sihua') return SIHUA_KEEP.has(s.name)
    return true
  })

const starColor = (s: Star) => {
  if (s.kind === 'major') return '#7C2D12'
  if (s.kind === 'aux') {
    if (['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].includes(s.name)) return '#334155'
    return '#1e3a8a'
  }
  return '#4b5563'
}

interface Props {
  palace: Palace
  mode: ViewMode
  overlay: Overlay
  active: boolean
  inTriad: boolean
  onClick: () => void
}

export function PalaceCell({ palace: p, mode, overlay, active, inTriad, onClick }: Props) {
  const t = useT()
  const stars = visibleStars(p, mode)
  const n = stars.length
  const colW = n > 11 ? Math.floor((CELL_W - 6) / n) : n > 8 ? 15 : 16
  const tags = overlay.palaceTags[p.branch]
  const flows = overlay.flowStars[p.branch]
  const gods = overlay.gods?.[p.branch]
  const isXiao = overlay.xiaoxian?.branch === p.branch
  /** 限流模式：隐藏本命静态流年 / 小限年龄序列与大限区间 */
  const horo = overlay.layers.length > 0
  const yearLabel = overlay.decadeYearLabels[p.branch]
  const vtags = [
    p.isBody && mode !== 'flying' ? { text: '身宫', color: '#C62828' } : null,
    p.isLaiyin && mode !== 'sanhe' ? { text: '来因', color: '#9333ea' } : null,
    isXiao ? { text: '小限', color: overlay.xiaoxian!.color } : null,
  ].filter((x) => x !== null)

  return (
    <div
      onClick={onClick}
      className="absolute cursor-pointer select-none overflow-hidden"
      style={{
        width: CELL_W,
        height: CELL_H,
        border: '1px solid #CBD5E1',
        // 焦点宫极淡暖米、三方四正纯白、其余宫极淡灰白
        background: active ? '#FFFBEB' : inTriad ? '#FFFFFF' : '#F8FAFC',
        boxShadow: active ? 'inset 0 0 0 1.5px #F8961D' : undefined,
      }}
    >
      {/* 上半区：星曜竖排列 */}
      <div className="absolute left-[3px] top-[3px] flex" style={{ width: CELL_W - 6 }}>
        {stars.map((s) => {
          const muts = overlay.starMutagens[s.name] ?? []
          const fs = s.kind === 'major' ? 14 : s.kind === 'aux' ? 13 : 11.5
          return (
            <div key={s.name} className="flex flex-col items-center" style={{ width: colW }}>
              {[...t(s.name)].map((ch, i) => (
                <span
                  key={i}
                  style={{ fontSize: fs, lineHeight: `${fs + 1}px`, color: starColor(s), fontWeight: s.kind === 'major' ? 700 : 500 }}
                >
                  {ch}
                </span>
              ))}
              <span style={{ fontSize: 10, lineHeight: '12px', color: '#9a3412', height: 12 }}>{t(s.brightness)}</span>
              {s.birthMutagen && (
                <span
                  className="rounded-sm text-white"
                  style={{ fontSize: 10, lineHeight: '13px', padding: '0 1px', background: '#C62828', marginTop: 1 }}
                >
                  {t(s.birthMutagen)}
                </span>
              )}
              {mode !== 'sanhe' &&
                [...s.selfOut.map((m) => ['↓', m]), ...s.selfIn.map((m) => ['↑', m])].map(([dir, m], i) => (
                  <span key={'s' + i} style={{ fontSize: 9, lineHeight: '11px', color: MUTAGEN_COLORS[m as '禄'], fontWeight: 700 }}>
                    {dir}
                    {t(m)}
                  </span>
                ))}
              {muts.map((m, i) => (
                <span
                  key={i}
                  className="rounded-sm text-white"
                  style={{ fontSize: 10, lineHeight: '13px', padding: '0 1px', background: m.color, marginTop: 1 }}
                >
                  {t(m.mutagen)}
                </span>
              ))}
            </div>
          )
        })}
      </div>

      {/* 中部：本命流年 / 小限年龄序列（仅三合模式、未进入限流时） */}
      {mode === 'sanhe' && !horo && (
        <div className="absolute left-[4px] text-[9.5px] leading-[12px] text-[#4A6072]" style={{ top: 112 }}>
          <div>
            {t('流年')}: {p.liunianAges.join(' ')}
          </div>
          <div>
            {t('小限')}: {p.xiaoxianAges.join(' ')}
          </div>
        </div>
      )}

      {/* 中右：身宫 / 来因 / 小限 框 + 运曜（大禄、年马…）竖排 */}
      {(vtags.length > 0 || flows.length > 0) && (
        <div className="absolute flex flex-row-reverse items-start gap-[2px]" style={{ right: 4, top: 82 }}>
          {vtags.length > 0 && (
            <div className="flex flex-col gap-[2px]">
              {vtags.map((v) => (
                <VTag key={v.text} text={t(v.text)} color={v.color} />
              ))}
            </div>
          )}
          {flows.map((f, i) => (
            <div key={i} className="flex flex-col items-center text-[10.5px] font-medium leading-[12px]" style={{ color: f.color }}>
              {[...t(f.text)].map((ch, k) => (
                <span key={k}>{ch}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 下半区左：三组十二神 */}
      <div className="absolute bottom-[3px] left-[4px] text-[10.5px] leading-[13px]">
        <div style={{ color: '#0e7490' }}>{t(p.boshi)}</div>
        <div style={{ color: '#475569' }}>{t(gods?.jiangqian ?? p.jiangqian)}</div>
        <div style={{ color: '#64748b' }}>{t(gods?.suiqian ?? p.suiqian)}</div>
      </div>

      {/* 下半区中：限流时 = 大限内流年标签 + 叠宫标签；本命时 = 大限区间 */}
      <div className="absolute bottom-[3px] flex flex-col items-center" style={{ left: 50, width: 70 }}>
        {horo ? (
          <>
            {yearLabel && <div className="mb-[2px] whitespace-nowrap text-[10.5px] leading-[13px] text-[#4A6072]">{t(yearLabel)}</div>}
            <div className="flex flex-wrap justify-center gap-x-[3px] text-[10.5px] font-bold leading-[13px]">
              {tags.map((tg, i) => (
                <span key={i} style={{ color: tg.color }}>
                  {t(tg.text)}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="text-[11px] leading-[14px] text-[#4A6072]">
            {p.decade[0]}~{p.decade[1]}
          </div>
        )}
      </div>

      {/* 下半区右：长生 + 宫名 + 宫干支 */}
      <div className="absolute bottom-[3px] right-[3px] flex items-end gap-[2px]">
        <div className="flex flex-col items-center text-[10px] leading-[11px] text-[#4A6072]">
          {[...t(p.changsheng)].map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
        <div className="text-[12px] font-bold leading-[14px]" style={{ color: '#C62828' }}>
          {t(p.name.replace('宫', ''))}
        </div>
        <div className="flex flex-col items-center text-[15px] font-bold leading-[16px] text-[#003054]">
          <span>{t(STEMS[p.stem])}</span>
          <span>{t(BRANCHES[p.branch])}</span>
        </div>
      </div>
    </div>
  )
}

function VTag({ text, color }: { text: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center text-[10px] leading-[11px]"
      style={{ border: `1px solid ${color}`, color, padding: '1px 1px', borderRadius: 2 }}
    >
      {[...text].map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </div>
  )
}
