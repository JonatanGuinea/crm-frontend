import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminBackups, runAdminBackup } from '../../api/admin'
import { useToast } from '../../components/Toast'
import {
  C, CIFRAS, TD, TH, PageHeader, Card, Kpi, Row, Table, Loading, ErrorBox, Unavailable, PrimaryBtn, ReasonModal, Badge,
  fmtBytes, fmtDateTime, fmtAgo, apiError,
} from './ui'

/* Backups reales: bucket privado "backups" de Supabase (dump JSON comprimido de todas las tablas)
   + historial de ejecuciones en la auditoría. La restauración NO se hace desde la web. */

export default function AdminBackups() {
  const qc = useQueryClient()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const [now] = useState(() => Date.now())
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin-backups'], queryFn: getAdminBackups })
  const run = useMutation({
    mutationFn: runAdminBackup,
    onSuccess: r => {
      toast(`Backup completado: ${r.filename} (${fmtBytes(r.sizeBytes)})`, 'success')
      qc.invalidateQueries({ queryKey: ['admin-backups'] })
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setConfirm(false)
    },
    onError: err => { toast(apiError(err, 'El backup falló'), 'error'); qc.invalidateQueries({ queryKey: ['admin-backups'] }); setConfirm(false) },
  })

  if (isLoading) return <><PageHeader title="Backups" /><Loading /></>
  if (error) return <><PageHeader title="Backups" /><ErrorBox error={apiError(error)} onRetry={refetch} /></>

  const last = data.files[0]
  const ageH = last ? (now - new Date(last.updatedAt || last.createdAt)) / 3.6e6 : null
  const lastFail = data.history.find(h => !h.success)
  const today = new Date(now).toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader title="Backups y recuperación" subtitle="Respaldos reales de la base de producción en Supabase Storage (bucket privado)"
        actions={<PrimaryBtn onClick={() => setConfirm(true)} disabled={run.isPending || !data.ok || !data.manualRun?.allowed}>{run.isPending ? 'Ejecutando backup…' : 'Ejecutar backup ahora'}</PrimaryBtn>} />

      {data.manualRun && !data.manualRun.allowed && <div style={{ marginBottom: 14 }}><Unavailable>{data.manualRun.reason}</Unavailable></div>}
      {!data.ok && <div style={{ marginBottom: 14 }}><Unavailable>No se pudo leer el bucket: {data.error}</Unavailable></div>}
      {lastFail && (!last || new Date(lastFail.createdAt) > new Date(last.updatedAt || last.createdAt)) && (
        <div style={{ padding: '10px 14px', marginBottom: 14, background: 'rgba(229,131,115,0.08)', borderLeft: `3px solid ${C.err}`, borderRadius: '0 10px 10px 0', fontSize: 13, color: C.crema }}>
          El último intento de backup falló ({fmtDateTime(lastFail.createdAt)}): {lastFail.meta?.error || 'error desconocido'}.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
        <Kpi label="Último backup" value={last ? fmtAgo(last.updatedAt || last.createdAt) : 'Ninguno'} color={ageH == null ? C.err : ageH > 30 ? C.warn : C.ok} sub={last ? fmtDateTime(last.updatedAt || last.createdAt) : 'El bucket está vacío'} />
        <Kpi label="Tamaño" value={last ? fmtBytes(last.sizeBytes) : '—'} sub={last?.name} />
        <Kpi label="Estado" value={ageH == null ? 'Sin respaldo' : ageH > 30 ? 'Atrasado' : 'Al día'} color={ageH == null ? C.err : ageH > 30 ? C.warn : C.ok} sub={data.schedule} />
        <Kpi label="Retenidos" value={data.files.length} sub="Los backups de más de 7 días se borran solos" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.arena, margin: '0 0 8px' }}>Archivos en el bucket</p>
          {data.files.length ? (
            <Table minWidth={420}>
              <thead><tr>{['Archivo', 'Fecha', 'Tamaño'].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {data.files.map(f => (
                  <tr key={f.name}>
                    <td style={{ ...TD, fontFamily: CIFRAS, fontSize: 12.5 }}>{f.name}</td>
                    <td style={{ ...TD, fontSize: 12.5, color: C.arena }}>{fmtDateTime(f.updatedAt || f.createdAt)}</td>
                    <td style={{ ...TD, fontSize: 12.5, fontFamily: CIFRAS }}>{fmtBytes(f.sizeBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <Unavailable>No hay archivos.</Unavailable>}
        </div>
        <Card title="Historial de ejecuciones">
          {data.history.length ? data.history.map((h, i) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i === data.history.length - 1 ? 'none' : `1px solid ${C.linea}` }}>
              {h.success ? <Badge bg="rgba(125,190,147,0.12)" color={C.ok} label="OK" /> : <Badge bg="rgba(229,131,115,0.12)" color={C.err} label="Falló" />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12.5, color: C.crema, margin: 0 }}>{h.meta?.trigger === 'manual' ? `Manual · ${h.actorEmail || 'admin'}` : 'Programado'}{h.meta?.sizeBytes ? ` · ${fmtBytes(h.meta.sizeBytes)}` : ''}</p>
                {!h.success && <p style={{ fontSize: 11, color: C.err, margin: 0, overflowWrap: 'anywhere' }}>{h.meta?.error}</p>}
              </div>
              <span style={{ fontSize: 12, color: C.arena, whiteSpace: 'nowrap' }}>{fmtDateTime(h.createdAt)}</span>
            </div>
          )) : <Unavailable>El historial de ejecuciones se registra desde el 17/11/2026.</Unavailable>}
        </Card>
      </div>

      <Card title="Restauración">
        <Row label="Desde la web" value="No disponible (a propósito)" valueColor={C.warn} />
        <Row label="Procedimiento" value="scripts/restore-backup.js en el contenedor del backend" />
        <Row label="Motivo" value="Reemplaza datos de producción: requiere confirmación explícita y una ventana controlada" last />
        <p style={{ fontSize: 11.5, color: C.piedra, margin: '10px 0 0', lineHeight: 1.5 }}>{data.restore} Los archivos no se pueden descargar desde el panel porque incluyen datos personales y hashes de contraseñas.</p>
      </Card>

      {confirm && (
        <ReasonModal title="Ejecutar backup ahora" confirmLabel="Ejecutar backup" busy={run.isPending}
          message={`Se exporta toda la base a ${`backup-${today}.json.gz`} en el bucket privado de backups. Si ya existe el de hoy, se reemplaza por esta versión más reciente. Puede tardar unos segundos y queda registrado en la auditoría.`}
          onClose={() => !run.isPending && setConfirm(false)} onConfirm={() => run.mutate()} />
      )}
    </div>
  )
}
