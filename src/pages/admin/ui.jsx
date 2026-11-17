/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BuscarIcon } from '../../components/DuIcons'
import { downloadAdminExport } from '../../api/admin'
import { useToast } from '../../components/Toast'

/* Piezas compartidas del panel Sistema, siguiendo el sistema de diseño DU
   (tokens C, Tarjeta D, SECTION_TITLE, tablas con cabecera C.linea). */

export const C = { bg: '#0B0B0C', s1: '#141415', s2: '#1E1E20', s3: '#26262A', linea: '#2C2C2F', crema: '#F2EDE3', arena: '#B9B4AA', piedra: '#8C877E', ok: '#7DBE93', warn: '#E2B663', err: '#E58373', info: '#8EB1DE' }
export const CIFRAS = "'DanteUP Cifras', Geist, sans-serif"
export const CTRL_H = 34
export const card = { background: C.s1, border: `1px solid ${C.linea}`, borderRadius: '0 16px 16px 0' }
export const SECTION_TITLE = { fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: 0 }
export const TH = { background: C.linea, color: C.crema, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 14px', textAlign: 'left', whiteSpace: 'nowrap' }
export const TD = { padding: '10px 14px', borderBottom: `1px solid ${C.linea}`, fontSize: 13, color: C.crema, verticalAlign: 'middle' }

export const PLAN_STYLE = {
  free:       { label: 'Free',       bg: 'rgba(242,237,227,0.07)', color: C.piedra },
  pro:        { label: 'Pro',        bg: 'rgba(142,177,222,0.12)', color: C.info },
  enterprise: { label: 'Enterprise', bg: 'rgba(125,190,147,0.12)', color: C.ok },
}
export const ORG_STATUS_STYLE = {
  active:    { label: 'Activa',     bg: 'rgba(125,190,147,0.12)', color: C.ok },
  suspended: { label: 'Suspendida', bg: 'rgba(229,131,115,0.12)', color: C.err },
}
export const ROLE_LABEL = { owner: 'Dueño', admin: 'Admin', member: 'Miembro' }
export const MEMBERSHIP_STATUS = { active: 'activo', invited: 'invitado', disabled: 'deshabilitado' }
export const USER_KIND = {
  owner: { label: 'Dueño',       bg: 'rgba(242,237,227,0.1)',  color: C.crema,  title: 'Dueño de al menos una empresa' },
  team:  { label: 'Solo equipo', bg: 'rgba(142,177,222,0.12)', color: C.info,   title: 'No tiene empresa propia: es miembro o admin de empresas de otros' },
  none:  { label: 'Sin empresa', bg: 'rgba(140,135,126,0.15)', color: C.piedra, title: 'No pertenece activamente a ninguna empresa' },
}
export const PROJECT_STATUS = { pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso', finished: 'Terminado', cancelled: 'Cancelado' }
export const QUOTE_STATUS = { draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado', signed: 'Firmado', rejected: 'Rechazado', expired: 'Vencido' }

/* ── formato ───────────────────────────────────────────────────────────── */
export function fmtBytes(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}
export const fmtDate = d => (d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')
export const fmtDateTime = d => (d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')
export const fmtNum = n => (n == null ? '—' : Number(n).toLocaleString('es-AR'))
export function fmtMoney(n, currency = 'ARS') {
  try { return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0) }
  catch { return `${currency} ${fmtNum(Math.round(n || 0))}` }
}
export function fmtAgo(d) {
  if (!d) return '—'
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'hace instantes'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`
  return fmtDate(d)
}
export function fmtDuration(sec) {
  if (sec == null) return '—'
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60)
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`
}
export const apiError = (err, fallback = 'No se pudieron cargar los datos.') => err?.response?.data?.error || fallback

/* ── piezas visuales ───────────────────────────────────────────────────── */
export function Badge({ bg, color, label, title }) {
  return (
    <span title={title} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '0 6px 6px 0', fontSize: 10.5, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}
export const StyleBadge = ({ map, value }) => { const s = map[value]; return s ? <Badge {...s} /> : <Badge bg={C.s3} color={C.piedra} label={value || '—'} /> }

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: C.crema, margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 11.5, color: C.piedra, margin: '3px 0 0' }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function Card({ title, action, children, padding = '20px 20px', style }) {
  return (
    <div style={{ ...card, padding, minWidth: 0, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          {title && <p style={SECTION_TITLE}>{title}</p>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Kpi({ label, value, sub, color, to }) {
  const body = (
    <div style={{ ...card, padding: '14px 16px', minWidth: 0, height: '100%' }}>
      <p style={SECTION_TITLE}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: CIFRAS, color: color || C.crema, margin: '6px 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.piedra, margin: 0, lineHeight: 1.45 }}>{sub}</p>}
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{body}</Link> : body
}

export function Row({ label, value, last, valueColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${C.linea}` }}>
      <span style={{ fontSize: 13, color: C.arena }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: CIFRAS, color: valueColor || C.crema, textAlign: 'right', minWidth: 0, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}

export function Empty({ text = 'No hay datos.' }) {
  return <div style={{ ...card, padding: '28px 20px', textAlign: 'center', fontSize: 13, color: C.piedra }}>{text}</div>
}
export function Loading({ text = 'Cargando…' }) {
  return <div style={{ ...card, padding: '28px 20px', textAlign: 'center', fontSize: 13, color: C.piedra }}>{text}</div>
}
export function ErrorBox({ error, onRetry }) {
  return (
    <div style={{ ...card, padding: '22px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: C.err, margin: '0 0 10px' }}>{error}</p>
      {onRetry && <GhostBtn onClick={onRetry}>Reintentar</GhostBtn>}
    </div>
  )
}
export function Unavailable({ children }) {
  return <p style={{ fontSize: 12, color: C.piedra, margin: 0, padding: '10px 12px', background: C.s2, borderRadius: '0 8px 8px 0', border: `1px dashed ${C.linea}` }}>{children}</p>
}

/* ── botones y controles ───────────────────────────────────────────────── */
const btnBase = { height: CTRL_H, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: '0 9px 9px 0', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s, color 0.12s, border-color 0.12s', whiteSpace: 'nowrap' }
export function PrimaryBtn({ children, disabled, ...p }) {
  return <button {...p} disabled={disabled} style={{ ...btnBase, background: C.crema, color: C.bg, border: 'none', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>
}
export function GhostBtn({ children, disabled, danger, ...p }) {
  const color = danger ? C.err : C.piedra
  return (
    <button {...p} disabled={disabled}
      style={{ ...btnBase, background: 'none', border: `1px solid ${danger ? 'rgba(229,131,115,0.4)' : C.linea}`, color, fontWeight: 500, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.color = danger ? C.err : C.arena; e.currentTarget.style.borderColor = danger ? C.err : C.arena } }}
      onMouseLeave={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = danger ? 'rgba(229,131,115,0.4)' : C.linea }}>
      {children}
    </button>
  )
}
export function RowBtn({ children, ...p }) {
  return (
    <button {...p} style={{ background: C.linea, color: C.crema, fontSize: 11.5, border: 'none', borderRadius: '0 7px 7px 0', padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
      onMouseEnter={e => e.currentTarget.style.background = C.s3} onMouseLeave={e => e.currentTarget.style.background = C.linea}>
      {children}
    </button>
  )
}
export function RowLink({ to, children }) {
  return <Link to={to} style={{ background: C.linea, color: C.crema, fontSize: 11.5, borderRadius: '0 7px 7px 0', padding: '4px 10px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }}>{children}</Link>
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
      <BuscarIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.piedra, pointerEvents: 'none' }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="du-input" style={{ height: CTRL_H, width: '100%', paddingLeft: 34, fontSize: 13 }} />
    </div>
  )
}
export function Select({ value, onChange, options, title, style }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="du-input" title={title}
      style={{ height: CTRL_H, width: 'auto', fontSize: 13, paddingRight: 28, flex: '0 0 auto', maxWidth: '100%', ...style }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}
export function DateInput({ value, onChange, title }) {
  return <input type="date" value={value} onChange={e => onChange(e.target.value)} title={title} className="du-input" style={{ height: CTRL_H, width: 'auto', fontSize: 13, flex: '0 0 auto', colorScheme: 'dark' }} />
}
export function FilterBar({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>{children}</div>
}

/* ── filtros en la URL (los links de alertas abren la vista ya filtrada) ── */
export function useUrlFilters(defaults = {}) {
  const [sp, setSp] = useSearchParams()
  const filters = { ...defaults }
  for (const [k, v] of sp.entries()) filters[k] = v
  function set(patch, { resetPage = true } = {}) {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null || v === defaults[k]) next.delete(k)
      else next.set(k, String(v))
    }
    if (resetPage && !('page' in patch)) next.delete('page')
    setSp(next, { replace: true })
  }
  return [filters, set]
}

// Búsqueda con espera (no consulta al backend en cada tecla)
export function DebouncedSearch({ value, onChange, placeholder }) {
  const [local, setLocal] = useState(value || '')
  // Si el valor externo cambia (ej. "limpiar filtros"), se sincroniza durante el render
  const [prev, setPrev] = useState(value)
  if (prev !== value) { setPrev(value); setLocal(value || '') }
  useEffect(() => {
    if ((value || '') === local) return
    const t = setTimeout(() => onChange(local), 350)
    return () => clearTimeout(t)
  }, [local]) // eslint-disable-line react-hooks/exhaustive-deps
  return <SearchInput value={local} onChange={setLocal} placeholder={placeholder} />
}

/* ── tabla con paginación del servidor ─────────────────────────────────── */
export function SortTh({ label, field, sort, order, onSort, align }) {
  const active = sort === field
  return (
    <th style={{ ...TH, textAlign: align || 'left', cursor: field ? 'pointer' : 'default', userSelect: 'none' }}
      onClick={field ? () => onSort(field, active && order === 'desc' ? 'asc' : 'desc') : undefined}>
      {label}{active ? (order === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  )
}

export function Table({ children, minWidth = 640 }) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth, borderCollapse: 'collapse' }}>{children}</table>
      </div>
    </div>
  )
}

export function Pager({ data, onPage }) {
  if (!data) return null
  const { page, pages, total, pageSize } = data
  const from = total ? (page - 1) * pageSize + 1 : 0
  const to = Math.min(page * pageSize, total)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11.5, color: C.piedra }}>{fmtNum(from)}–{fmtNum(to)} de {fmtNum(total)}</span>
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GhostBtn disabled={page <= 1} onClick={() => onPage(page - 1)}>← Anterior</GhostBtn>
          <span style={{ fontSize: 12, color: C.arena, fontFamily: CIFRAS }}>{page} / {pages}</span>
          <GhostBtn disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente →</GhostBtn>
        </div>
      )}
    </div>
  )
}

/* ── exportación ───────────────────────────────────────────────────────── */
export function ExportButtons({ dataset, params }) {
  const toast = useToast()
  const [busy, setBusy] = useState(null)
  async function run(format) {
    setBusy(format)
    try {
      const n = await downloadAdminExport(dataset, { ...params, format })
      toast(`Exportación lista (${fmtNum(n)} filas)`, 'success')
    } catch (err) {
      toast(apiError(err, 'No se pudo exportar'), 'error')
    } finally { setBusy(null) }
  }
  return (
    <>
      <GhostBtn onClick={() => run('csv')} disabled={!!busy}>{busy === 'csv' ? 'Exportando…' : 'CSV'}</GhostBtn>
      <GhostBtn onClick={() => run('xlsx')} disabled={!!busy}>{busy === 'xlsx' ? 'Exportando…' : 'Excel'}</GhostBtn>
    </>
  )
}

/* ── gráficos (SVG simple, datos reales del backend) ───────────────────── */
function bucketLabel(key, unit) {
  const d = new Date(key + 'T12:00:00Z')
  if (unit === 'month') return d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

// Barras agrupadas: series = [{ key, label, color }]
export function BarChart({ data, series, unit, height = 150, format = fmtNum }) {
  if (!data?.length) return <Unavailable>Sin datos en el período.</Unavailable>
  const max = Math.max(1, ...data.flatMap(d => series.map(s => d[s.key] || 0)))
  const W = 600, H = height, padB = 18, slot = W / data.length, bw = Math.max(2, (slot * 0.72) / series.length)
  const labelEvery = Math.ceil(data.length / 8)
  const total = series.map(s => data.reduce((a, d) => a + (d[s.key] || 0), 0))
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
        <line x1="0" y1={H - padB} x2={W} y2={H - padB} stroke={C.linea} />
        {data.map((d, i) => series.map((s, j) => {
          const v = d[s.key] || 0
          const h = (v / max) * (H - padB - 6)
          return (
            <rect key={`${i}-${s.key}`} x={i * slot + slot * 0.14 + j * bw} y={H - padB - h} width={bw - 1} height={Math.max(h, v ? 1 : 0)} fill={s.color} rx="1">
              <title>{`${bucketLabel(d.bucket, unit)} · ${s.label}: ${format(v)}`}</title>
            </rect>
          )
        }))}
        {data.map((d, i) => i % labelEvery === 0 && (
          <text key={d.bucket} x={i * slot + slot / 2} y={H - 4} textAnchor="middle" fontSize="10" fill={C.piedra}>{bucketLabel(d.bucket, unit)}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
        {series.map((s, j) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.arena }}>
            <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />
            {s.label}: <b style={{ fontFamily: CIFRAS, color: C.crema }}>{format(total[j])}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

// Distribución horizontal: items = [{ label, value, color? }]
export function Distribution({ items, format = fmtNum }) {
  const total = items.reduce((a, x) => a + x.value, 0)
  if (!total) return <Unavailable>Sin datos.</Unavailable>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map(x => (
        <div key={x.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: C.arena }}>{x.label}</span>
            <span style={{ color: C.crema, fontFamily: CIFRAS, fontWeight: 600 }}>{format(x.value)} <span style={{ color: C.piedra, fontWeight: 400 }}>· {Math.round((x.value / total) * 100)}%</span></span>
          </div>
          <div style={{ height: 6, background: C.s3, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(x.value / total) * 100}%`, height: '100%', background: x.color || C.arena }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── ocupación de la base / disco ──────────────────────────────────────── */
const LEVEL_COLOR = { ok: C.ok, warn: C.warn, err: C.err }
export function CapacityBar({ capacity, compact }) {
  if (!capacity) return null
  if (!capacity.available) return <Unavailable>Capacidad total no disponible: {capacity.reason}</Unavailable>
  const pct = Math.min(100, capacity.usedPct * 100)
  const color = LEVEL_COLOR[capacity.level]
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: compact ? 11 : 12, marginBottom: 5 }}>
        <span style={{ color: C.arena }}>{capacity.source === 'disk' ? 'Disco del servidor' : 'Capacidad de la base'}</span>
        <span style={{ color, fontFamily: CIFRAS, fontWeight: 600 }}>{pct.toFixed(1)}% · {fmtBytes(capacity.freeBytes)} libres de {fmtBytes(capacity.totalBytes)}</span>
      </div>
      <div style={{ position: 'relative', height: compact ? 6 : 9, background: C.s3, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
        {/* Marcas de alerta (80 %) y crítico (90 %) */}
        <div title="Alerta 80%" style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: 1, background: C.warn, opacity: 0.7 }} />
        <div title="Crítico 90%" style={{ position: 'absolute', left: '90%', top: 0, bottom: 0, width: 1, background: C.err, opacity: 0.7 }} />
      </div>
      {!compact && (
        <p style={{ fontSize: 11, color: C.piedra, margin: '6px 0 0', lineHeight: 1.5 }}>
          {capacity.source === 'disk' && capacity.dbBytes != null && <>La base ocupa {fmtBytes(capacity.dbBytes)} ({(capacity.dbPctOfDisk * 100).toFixed(2)}% del disco). </>}
          {capacity.note} Alerta al 80 %, crítico al 90 %.
        </p>
      )}
    </div>
  )
}

/* ── modal de confirmación con motivo (acciones administrativas) ───────── */
export function ReasonModal({ title, message, confirmLabel, danger, requireReason, busy, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const valid = !requireReason || reason.trim().length >= 3
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '0 16px' }} onClick={onClose}>
      <div style={{ ...card, background: C.s2, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: C.linea, padding: '16px 22px', borderRadius: '0 16px 0 0' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>{title}</p>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: C.arena, margin: 0, lineHeight: 1.5 }}>{message}</p>
          {requireReason !== undefined && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.arena, display: 'block', marginBottom: 6 }}>Motivo {requireReason ? '(obligatorio, queda en la auditoría)' : '(opcional)'}</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={500} autoFocus className="du-input" style={{ height: 'auto', padding: '10px 14px', width: '100%', resize: 'vertical' }} />
            </div>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${C.linea}`, padding: '12px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
          <button disabled={!valid || busy} onClick={() => onConfirm(reason.trim())}
            style={{ ...btnBase, border: 'none', background: danger ? C.err : C.crema, color: C.bg, opacity: !valid || busy ? 0.5 : 1, cursor: !valid || busy ? 'not-allowed' : 'pointer' }}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── actividad ─────────────────────────────────────────────────────────── */
const KIND_LABEL = { quote: 'Presupuesto', project: 'Proyecto', client: 'Cliente', task: 'Tarea', cash: 'Caja', audit: 'Sistema' }
export function ActivityList({ items, showOrg = true, showUser = true }) {
  if (!items?.length) return <Unavailable>Sin actividad registrada.</Unavailable>
  return (
    <div>
      {items.map((a, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i === items.length - 1 ? 'none' : `1px solid ${C.linea}` }}>
          <Badge bg={C.s3} color={C.arena} label={KIND_LABEL[a.kind] || a.kind} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12.5, color: C.crema, margin: 0, overflowWrap: 'anywhere' }}>
              {a.action}{a.detail ? <span style={{ color: C.piedra }}> · {String(a.detail).slice(0, 120)}</span> : null}
            </p>
            <p style={{ fontSize: 11, color: C.piedra, margin: '2px 0 0' }}>
              {showUser && (a.userName || 'Sistema')}{showUser && showOrg && a.organizationName ? ' · ' : ''}{showOrg && a.organizationName}{(showUser || showOrg) ? ' · ' : ''}{fmtAgo(a.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
