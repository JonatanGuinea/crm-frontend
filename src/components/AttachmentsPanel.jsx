import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAttachments, uploadAttachment, deleteAttachment, downloadAttachment } from '../api/attachments'
import { useConfirm } from './ConfirmDialog'
import { CarpetaIcon, MasIcon } from './DuIcons'

// ── tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg:    '#0B0B0C',
  s1:    '#141415',
  s2:    '#1E1E20',
  s3:    '#26262A',
  linea: '#2C2C2F',
  crema: '#F2EDE3',
  arena: '#B9B4AA',
  piedra:'#8C877E',
  err:   '#E58373',
  info:  '#8EB1DE',
}

const SECTION_TITLE = {
  fontSize: 10.5, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: C.arena,
}

// ── iconos locales (sin Heroicons) ────────────────────────────────────────────

function ClipIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', flexShrink: 0, ...style }}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function UploadIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', flexShrink: 0, ...style }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  )
}

function TrashIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', flexShrink: 0, ...style }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ALLOWED_INFO = [
  { ext: 'JPG, PNG, GIF, WEBP', desc: 'Imágenes' },
  { ext: 'PDF',                  desc: 'Documentos' },
  { ext: 'DOC, DOCX',            desc: 'Word' },
  { ext: 'XLS, XLSX',            desc: 'Excel' },
]

function FileInfoTooltip() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        style={{
          width: 16, height: 16, borderRadius: '50%',
          border: `1px solid ${C.piedra}`, color: C.piedra,
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', cursor: 'pointer', flexShrink: 0,
          transition: 'border-color 0.12s, color 0.12s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
        onBlur={e => { e.currentTarget.style.borderColor = C.piedra; e.currentTarget.style.color = C.piedra }}
      >
        ?
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          width: 192, zIndex: 20, pointerEvents: 'none',
          background: C.s2, border: `1px solid ${C.linea}`,
          borderRadius: '0 12px 12px 0', padding: '12px 14px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.crema, marginBottom: 10 }}>Archivos permitidos</p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ALLOWED_INFO.map(({ ext, desc }) => (
              <li key={ext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, color: C.piedra }}>{desc}</span>
                <span style={{ fontSize: 10.5, color: C.arena, fontFamily: 'monospace' }}>{ext}</span>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 10.5, color: C.piedra, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.linea}` }}>
            Máx. 10 MB por archivo
          </p>
        </div>
      )}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function AttachmentsPanel({ entityType, entityId }) {
  const qc = useQueryClient()
  const inputRef = useRef()
  const confirm = useConfirm()
  const queryKey = ['attachments', entityType, entityId]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAttachments(entityType, entityId).then(r => r.data.data)
  })

  const upload = useMutation({
    mutationFn: (file) => uploadAttachment(entityType, entityId, file),
    onSuccess: () => qc.invalidateQueries(queryKey)
  })

  const del = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => qc.invalidateQueries(queryKey)
  })

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) upload.mutate(file)
    e.target.value = ''
  }

  const files = data ?? []

  const grouped = files.reduce((acc, att) => {
    const key = att.sourceLabel ?? '__own__'
    if (!acc[key]) acc[key] = []
    acc[key].push(att)
    return acc
  }, {})

  const ownFiles      = grouped['__own__'] ?? []
  const projectGroups = Object.entries(grouped)
    .filter(([k]) => k !== '__own__')
    .sort(([a], [b]) => a.localeCompare(b))
  const isGrouped = projectGroups.length > 0

  return (
    <div style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3 style={SECTION_TITLE}>Adjuntos</h3>
          <FileInfoTooltip />
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: '0 7px 7px 0',
            background: C.arena, color: C.bg,
            fontSize: 11.5, fontWeight: 600, border: 'none',
            cursor: upload.isPending ? 'not-allowed' : 'pointer',
            opacity: upload.isPending ? 0.6 : 1,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { if (!upload.isPending) e.currentTarget.style.background = C.crema }}
          onMouseLeave={e => { e.currentTarget.style.background = C.arena }}
        >
          <UploadIcon style={{ width: 12, height: 12 }} />
          {upload.isPending ? 'Subiendo...' : 'Subir'}
        </button>
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
        />
      </div>

      {upload.isError && (
        <p style={{ fontSize: 11, color: C.err, marginBottom: 10 }}>
          {upload.error?.response?.data?.error || 'Error al subir'}
        </p>
      )}

      {/* Lista */}
      {isLoading ? (
        <p style={{ fontSize: 12, color: C.piedra }}>Cargando...</p>
      ) : files.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          style={{
            width: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '24px 0', borderRadius: '0 12px 12px 0',
            border: `1px dashed ${C.linea}`,
            background: 'none', cursor: 'pointer',
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.piedra}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.linea}
        >
          <ClipIcon style={{ width: 18, height: 18, color: C.piedra }} />
          <span style={{ fontSize: 12, color: C.piedra }}>+ Agregar archivo</span>
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(ownFiles.length > 0 || !isGrouped) && (
            <FileGroup
              label={isGrouped ? 'Del cliente' : null}
              files={ownFiles}
              onDownload={(att) => downloadAttachment(att.storedName, att.filename)}
              onDelete={async (att) => {
                if (await confirm('¿Eliminar archivo?')) del.mutate(att.id)
              }}
            />
          )}
          {projectGroups.map(([label, groupFiles]) => (
            <FileGroup
              key={label}
              label={label}
              showFolderIcon
              files={groupFiles}
              onDownload={(att) => downloadAttachment(att.storedName, att.filename)}
              onDelete={async (att) => {
                if (await confirm('¿Eliminar archivo?')) del.mutate(att.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── FileGroup ─────────────────────────────────────────────────────────────────

function FileGroup({ label, showFolderIcon, files, onDownload, onDelete }) {
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {showFolderIcon && <CarpetaIcon style={{ width: 12, height: 12, color: C.piedra }} />}
          <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.piedra }}>
            {label}
          </span>
          <span style={{ fontSize: 10, color: C.piedra, marginLeft: 'auto' }}>{files.length}</span>
        </div>
      )}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {files.map((att, i) => (
          <FileRow
            key={att.id}
            att={att}
            last={i === files.length - 1}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  )
}

// ── FileRow ───────────────────────────────────────────────────────────────────

function FileRow({ att, last, onDownload, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <li
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: '0 8px 8px 0',
        background: hovered ? C.s3 : 'transparent',
        borderBottom: last ? 'none' : `1px solid ${C.linea}`,
        transition: 'background 0.12s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ClipIcon style={{ width: 13, height: 13, color: C.piedra, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          onClick={() => onDownload(att)}
          style={{
            width: '100%', textAlign: 'left',
            fontSize: 12.5, fontWeight: 500, color: C.info,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            display: 'block',
            transition: 'color 0.12s',
          }}
          title={att.filename}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {att.filename}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10.5, color: C.piedra }}>{formatSize(att.size)}</span>
          {att.uploadedBy?.name && (
            <span style={{ fontSize: 10.5, color: C.piedra }}>· {att.uploadedBy.name}</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(att)}
        style={{
          flexShrink: 0, padding: '4px', borderRadius: '0 5px 5px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.piedra,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s, color 0.12s',
        }}
        title="Eliminar"
        onMouseEnter={e => e.currentTarget.style.color = C.err}
        onMouseLeave={e => e.currentTarget.style.color = C.piedra}
      >
        <TrashIcon style={{ width: 13, height: 13 }} />
      </button>
    </li>
  )
}
