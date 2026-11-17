import { useState, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getExplorerEntities, getExplorerRecords, getExplorerRecord, getExplorerOrphans, getAdminOrganizations } from '../../api/admin'
import {
  C, CIFRAS, TD, TH, card, PageHeader, Card, FilterBar, DebouncedSearch, Select, DateInput, Table, SortTh, Pager, Empty, Loading, ErrorBox,
  Badge, GhostBtn, RowBtn, ExportButtons, Unavailable, useUrlFilters, fmtNum, fmtDateTime, apiError,
} from './ui'

/* Explorador de entidades (solo lectura). Todo se resuelve en el servidor: paginación,
   filtros validados contra el schema y campos sensibles excluidos. */

const PRIORITY = ['id', 'number', 'name', 'title', 'email', 'sku', 'concept', 'action', 'status', 'type', 'role', 'plan', 'total', 'amount', 'currency', 'quantity', 'date', 'organizationId', 'orgId', 'createdAt']

function fmtValue(v, field) {
  if (v == null) return <span style={{ color: C.piedra }}>—</span>
  if (field?.type === 'DateTime') return fmtDateTime(v)
  if (field?.type === 'Boolean') return v ? 'sí' : 'no'
  if (field?.type === 'Json') return <code style={{ fontSize: 11 }}>{JSON.stringify(v).slice(0, 80)}</code>
  const s = String(v)
  return s.length > 60 ? s.slice(0, 60) + '…' : s
}

function FieldFilter({ entity, onAdd }) {
  const filterable = entity.fields.filter(f => !f.isList && ['String', 'Int', 'Float', 'Decimal', 'Boolean'].includes(f.type) || f.kind === 'enum')
  const [field, setField] = useState('')
  const [value, setValue] = useState('')
  const def = filterable.find(f => f.name === field)
  const add = () => { if (field && value !== '') { onAdd(field, value); setField(''); setValue('') } }
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <Select value={field} onChange={v => { setField(v); setValue('') }} options={[['', 'Filtrar por campo…'], ...filterable.map(f => [f.name, f.name])]} />
      {def && (def.enumValues || def.type === 'Boolean'
        ? <Select value={value} onChange={setValue} options={[['', 'Valor…'], ...(def.enumValues || ['true', 'false']).map(v => [v, v]), ...(def.isRequired ? [] : [['__null', '(vacío)']])]} />
        : <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Valor exacto" className="du-input" style={{ height: 34, width: 180, fontSize: 13 }} />)}
      {def && <GhostBtn onClick={add} disabled={value === ''}>Agregar</GhostBtn>}
    </div>
  )
}

function Structure({ entity }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <Table minWidth={420}>
          <thead><tr>{['Campo', 'Tipo', 'Atributos'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {entity.fields.map(f => (
              <tr key={f.name}>
                <td style={{ ...TD, fontFamily: CIFRAS }}>{f.name}</td>
                <td style={{ ...TD, color: C.arena }}>{f.type}{f.isList ? '[]' : ''}{f.isRequired ? '' : '?'}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {f.isId && <Badge bg="rgba(242,237,227,0.1)" color={C.crema} label="PK" />}
                    {f.isUnique && <Badge bg={C.s3} color={C.arena} label="único" />}
                    {f.isForeignKey && <Badge bg="rgba(142,177,222,0.12)" color={C.info} label="FK" />}
                    {f.hasDefault && <Badge bg={C.s3} color={C.piedra} label="default" />}
                    {f.enumValues && <span style={{ fontSize: 11, color: C.piedra }}>{f.enumValues.join(' · ')}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p style={{ fontSize: 11, color: C.piedra, margin: '8px 0 0' }}>Los campos sensibles (contraseñas, hashes, tokens y firmas) no se muestran ni se exportan.</p>
      </div>
      <Card title={`Relaciones (${entity.relations.length})`}>
        {entity.relations.length ? entity.relations.map((r, i) => (
          <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: i === entity.relations.length - 1 ? 'none' : `1px solid ${C.linea}`, fontSize: 13 }}>
            <span style={{ color: C.crema, fontFamily: CIFRAS }}>{r.name}</span>
            <span style={{ color: C.arena }}>{r.isList ? '1 → N' : 'N → 1'} {r.target}{r.fromFields.length ? ` (${r.fromFields.join(', ')})` : ''}</span>
          </div>
        )) : <Unavailable>Sin relaciones.</Unavailable>}
      </Card>
    </div>
  )
}

function RecordPanel({ entity, id, entities, onClose, onOpen, onNavigate }) {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-explorer-record', entity, id], queryFn: () => getExplorerRecord(entity, id) })
  const fields = entities.find(e => e.name === entity)?.fields || []
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 520, height: '100%', background: C.s1, borderLeft: `1px solid ${C.linea}`, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: C.linea, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.crema, margin: 0 }}>{entity}</p>
            <p style={{ fontSize: 11, color: C.arena, margin: 0, fontFamily: CIFRAS }}>{id}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.arena, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? <Loading /> : error ? <ErrorBox error={apiError(error)} /> : (
            <>
              {Object.entries(data.record).map(([k, v]) => {
                const f = fields.find(x => x.name === k)
                return (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 12.5 }}>
                    <span style={{ width: 150, flexShrink: 0, color: C.arena, fontFamily: CIFRAS }}>{k}</span>
                    <span style={{ color: C.crema, overflowWrap: 'anywhere', minWidth: 0 }}>
                      {f?.type === 'Json' ? <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap' }}>{JSON.stringify(v, null, 2)}</pre> : v == null ? <span style={{ color: C.piedra }}>—</span> : f?.type === 'DateTime' ? fmtDateTime(v) : String(v)}
                    </span>
                  </div>
                )
              })}
              <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '18px 0 8px' }}>Relaciones</p>
              {data.relations.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.linea}`, fontSize: 12.5 }}>
                  <span style={{ color: C.arena }}>{r.name} <span style={{ color: C.piedra }}>→ {r.target}</span></span>
                  {r.isList
                    ? (r.count > 0 && r.backField
                        ? <RowBtn onClick={() => onNavigate(r.target, { [`f.${r.backField}`]: id })}>{fmtNum(r.count)} registros →</RowBtn>
                        : <span style={{ color: C.piedra }}>{fmtNum(r.count)}</span>)
                    : (r.value?.id
                        ? <RowBtn onClick={() => onOpen(r.target, r.value.id)}>{r.value.name || r.value.title || r.value.email || (r.value.number != null ? `#${r.value.number}` : r.value.id)} →</RowBtn>
                        : <span style={{ color: C.piedra }}>—</span>)}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Orphans({ onNavigate }) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ['admin-orphans'], queryFn: getExplorerOrphans })
  if (isLoading) return <Loading text="Revisando integridad…" />
  if (error) return <ErrorBox error={apiError(error)} onRetry={refetch} />
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 12, color: C.piedra, margin: 0 }}>Referencias que la base no puede garantizar con claves foráneas y cruces entre empresas (aislamiento multi-tenant).</p>
        <GhostBtn onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Revisando…' : 'Volver a revisar'}</GhostBtn>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.checks.map(c => (
          <div key={c.key} style={{ ...card, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: c.error ? C.err : c.count ? C.warn : C.ok, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.crema, flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 14, fontFamily: CIFRAS, fontWeight: 600, color: c.error ? C.err : c.count ? C.warn : C.ok }}>{c.error ? 'error' : `${c.count}${c.capped ? '+' : ''}`}</span>
            </div>
            {c.error && <p style={{ fontSize: 12, color: C.err, margin: '6px 0 0' }}>{c.error}</p>}
            {c.count > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {c.rows.slice(0, 12).map(r => <RowBtn key={r.id} onClick={() => onNavigate(c.entity, null, r.id)}>{String(r.detail ?? r.id).slice(0, 40)}</RowBtn>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminExplorer() {
  const [f, set] = useUrlFilters({ entity: 'Organization', view: 'data', page: '1' })
  const [open, setOpen] = useState(null) // { entity, id }
  const [allCols, setAllCols] = useState(false)
  const { data: entities, isLoading: le, error: ee, refetch: re } = useQuery({ queryKey: ['admin-entities'], queryFn: getExplorerEntities, staleTime: 120_000 })
  const { data: orgs } = useQuery({ queryKey: ['admin-orgs-options'], queryFn: () => getAdminOrganizations({ pageSize: 100, sort: 'name', order: 'asc' }), staleTime: 300_000 })
  const entity = entities?.find(e => e.name === f.entity)

  const fieldFilters = Object.fromEntries(Object.entries(f).filter(([k]) => k.startsWith('f.')))
  const params = { q: f.q, orgId: f.orgId, from: f.from, to: f.to, dateField: f.dateField, sort: f.sort, order: f.order, ...fieldFilters }
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-explorer', f.entity, params, f.page],
    queryFn: () => getExplorerRecords(f.entity, { ...params, page: f.page, pageSize: 25 }),
    enabled: !!entity && f.view === 'data',
    placeholderData: keepPreviousData,
  })

  const columns = useMemo(() => {
    if (!entity) return []
    const fs = entity.fields.filter(x => !x.isList)
    if (allCols) return fs
    const pri = PRIORITY.map(n => fs.find(x => x.name === n)).filter(Boolean)
    return pri.length >= 4 ? pri.slice(0, 9) : fs.slice(0, 9)
  }, [entity, allCols])

  function selectEntity(name, extra = {}) {
    const clear = Object.fromEntries(Object.keys(f).filter(k => k.startsWith('f.')).map(k => [k, '']))
    set({ ...clear, entity: name, view: 'data', q: '', sort: '', order: '', from: '', to: '', dateField: '', ...extra })
  }
  // Navegación desde relaciones / integridad: abre la entidad filtrada o un registro puntual
  function navigate(target, filters, recordId) {
    setOpen(null)
    if (recordId) { selectEntity(target); setOpen({ entity: target, id: recordId }) }
    else selectEntity(target, filters)
  }

  if (le) return <><PageHeader title="Explorador" /><Loading /></>
  if (ee) return <><PageHeader title="Explorador" /><ErrorBox error={apiError(ee)} onRetry={re} /></>

  const dateFields = entity?.fields.filter(x => x.type === 'DateTime').map(x => x.name) || []
  const sortProps = { sort: f.sort || (entity?.fields.some(x => x.name === 'createdAt') ? 'createdAt' : 'id'), order: f.order || 'desc', onSort: (sort, order) => set({ sort, order }) }

  return (
    <div>
      <PageHeader title="Explorador de datos" subtitle="Entidades reales de la base · solo lectura · paginación y filtros en el servidor"
        actions={entity && f.view === 'data' && <ExportButtons dataset={`entity:${entity.name}`} params={params} />} />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Entidades (desktop) */}
        <div className="hidden xl:block">
          <div style={{ ...card, width: 210, padding: '8px 0', maxHeight: '75vh', overflowY: 'auto' }}>
            {entities.map(e => (
              <button key={e.name} onClick={() => selectEntity(e.name)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 6, padding: '6px 14px', background: e.name === f.entity && f.view !== 'orphans' ? C.s2 : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: e.name === f.entity && f.view !== 'orphans' ? C.crema : C.arena, textAlign: 'left' }}>
                <span>{e.name}</span><span style={{ color: C.piedra, fontFamily: CIFRAS }}>{fmtNum(e.count)}</span>
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${C.linea}`, margin: '6px 0' }} />
            <button onClick={() => set({ view: 'orphans' })}
              style={{ width: '100%', padding: '6px 14px', background: f.view === 'orphans' ? C.s2 : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: f.view === 'orphans' ? C.crema : C.arena, textAlign: 'left' }}>
              Integridad y huérfanos
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Entidades (mobile/tablet) */}
          <div className="xl:hidden" style={{ marginBottom: 10 }}>
            <Select value={f.view === 'orphans' ? '__orphans' : f.entity} onChange={v => v === '__orphans' ? set({ view: 'orphans' }) : selectEntity(v)}
              options={[...entities.map(e => [e.name, `${e.name} (${fmtNum(e.count)})`]), ['__orphans', 'Integridad y huérfanos']]} style={{ width: '100%' }} />
          </div>

          {f.view === 'orphans' ? <Orphans onNavigate={navigate} /> : !entity ? <Empty text="Entidad desconocida." /> : (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[['data', 'Registros'], ['structure', 'Estructura']].map(([v, l]) => (
                  <button key={v} onClick={() => set({ view: v })}
                    style={{ height: 30, padding: '0 12px', border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0', background: f.view === v ? C.s3 : 'transparent', color: f.view === v ? C.crema : C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: C.piedra, alignSelf: 'center' }}>{entity.name} · {fmtNum(entity.count)} registros</span>
              </div>

              {f.view === 'structure' ? <Structure entity={entity} /> : (
                <>
                  <FilterBar>
                    <DebouncedSearch value={f.q} onChange={q => set({ q })} placeholder="Buscar en campos de texto…" />
                    {entity.orgScoped && <Select value={f.orgId || ''} onChange={orgId => set({ orgId })} style={{ maxWidth: 220 }} options={[['', 'Todas las empresas'], ...(orgs?.items || []).map(o => [o.id, o.name])]} />}
                    {dateFields.length > 0 && <>
                      {dateFields.length > 1 && <Select value={f.dateField || ''} onChange={dateField => set({ dateField })} options={[['', dateFields.includes('createdAt') ? 'createdAt' : dateFields[0]], ...dateFields.filter(d => d !== (dateFields.includes('createdAt') ? 'createdAt' : dateFields[0])).map(d => [d, d])]} title="Campo de fecha" />}
                      <DateInput value={f.from || ''} onChange={from => set({ from })} title="Desde" />
                      <DateInput value={f.to || ''} onChange={to => set({ to })} title="Hasta" />
                    </>}
                  </FilterBar>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <FieldFilter entity={entity} onAdd={(field, value) => set({ [`f.${field}`]: value })} />
                    {Object.entries(fieldFilters).map(([k, v]) => (
                      <button key={k} onClick={() => set({ [k]: '' })} title="Quitar filtro"
                        style={{ height: 28, padding: '0 10px', background: C.s3, border: 'none', borderRadius: '0 7px 7px 0', color: C.crema, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {k.slice(2)} = {v === '__null' ? '(vacío)' : v} ×
                      </button>
                    ))}
                    <label style={{ marginLeft: 'auto', fontSize: 12, color: C.arena, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={allCols} onChange={e => setAllCols(e.target.checked)} /> Todas las columnas
                    </label>
                  </div>

                  {isLoading ? <Loading /> : error ? <ErrorBox error={apiError(error)} onRetry={refetch} /> : !data.items.length ? <Empty text="No hay registros que coincidan." /> : (
                    <div style={{ opacity: isFetching ? 0.6 : 1 }}>
                      <Table minWidth={Math.max(640, columns.length * 130)}>
                        <thead>
                          <tr>
                            {columns.map(col => <SortTh key={col.name} label={col.name} field={col.type === 'Json' ? undefined : col.name} {...sortProps} />)}
                            {data.items[0]?.__orgName !== undefined && <th style={TH}>empresa</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((r, i) => (
                            <tr key={r.id ?? i} onClick={() => r.id && setOpen({ entity: entity.name, id: r.id })} style={{ cursor: r.id ? 'pointer' : 'default' }}
                              onMouseEnter={e => e.currentTarget.style.background = C.s2} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              {columns.map(col => <td key={col.name} style={{ ...TD, fontSize: 12.5, whiteSpace: 'nowrap', fontFamily: ['Int', 'Float', 'Decimal'].includes(col.type) ? CIFRAS : 'inherit' }}>{fmtValue(r[col.name], col)}</td>)}
                              {r.__orgName !== undefined && <td style={{ ...TD, fontSize: 12.5, color: C.arena, whiteSpace: 'nowrap' }}>{r.__orgName || '—'}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <Pager data={data} onPage={page => set({ page }, { resetPage: false })} />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {open && <RecordPanel entity={open.entity} id={open.id} entities={entities} onClose={() => setOpen(null)} onOpen={(e, id) => setOpen({ entity: e, id })} onNavigate={(t, flt) => navigate(t, flt)} />}
    </div>
  )
}
