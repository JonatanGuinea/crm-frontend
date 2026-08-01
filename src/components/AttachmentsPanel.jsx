import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAttachments, uploadAttachment, deleteAttachment, downloadAttachment } from '../api/attachments'
import { useConfirm } from './ConfirmDialog'
import { PaperClipIcon, TrashIcon, ArrowUpTrayIcon, FolderIcon } from '@heroicons/react/24/outline'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
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
    <div className="relative flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="w-4 h-4 rounded-full border border-fg-muted text-fg-muted text-[10px] font-bold flex items-center justify-center hover:border-brand hover:text-brand transition-colors"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-48 bg-overlay border border-line rounded-xl p-3 shadow-xl pointer-events-none">
          <p className="text-xs font-semibold text-fg mb-2">Archivos permitidos</p>
          <ul className="space-y-1.5">
            {ALLOWED_INFO.map(({ ext, desc }) => (
              <li key={ext} className="flex items-center justify-between gap-2">
                <span className="text-xs text-fg-muted">{desc}</span>
                <span className="text-[11px] font-mono text-fg-soft">{ext}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-fg-muted mt-2 pt-2 border-t border-line">Máx. 10 MB por archivo</p>
        </div>
      )}
    </div>
  )
}

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

  // Agrupar: null = archivos propios, string = nombre del proyecto
  const grouped = files.reduce((acc, att) => {
    const key = att.sourceLabel ?? '__own__'
    if (!acc[key]) acc[key] = []
    acc[key].push(att)
    return acc
  }, {})

  const ownFiles = grouped['__own__'] ?? []
  const projectGroups = Object.entries(grouped)
    .filter(([k]) => k !== '__own__')
    .sort(([a], [b]) => a.localeCompare(b))

  const isGrouped = projectGroups.length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Adjuntos</h3>
          <FileInfoTooltip />
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          <ArrowUpTrayIcon className="w-3.5 h-3.5 shrink-0" />
          {upload.isPending ? 'Subiendo...' : 'Subir'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
        />
      </div>

      {upload.isError && (
        <p className="text-xs text-danger mb-2">
          {upload.error?.response?.data?.error || 'Error al subir'}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-xs text-fg-muted">Cargando...</p>
      ) : files.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-line hover:border-brand hover:bg-brand-subtle/30 transition-colors group"
        >
          <PaperClipIcon className="w-5 h-5 text-fg-muted group-hover:text-brand transition-colors" />
          <span className="text-xs text-fg-muted group-hover:text-brand transition-colors">
            + Agregar archivo
          </span>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Archivos propios del cliente */}
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

          {/* Archivos por proyecto */}
          {projectGroups.map(([label, groupFiles]) => (
            <FileGroup
              key={label}
              label={label}
              icon={<FolderIcon className="w-3 h-3 shrink-0" />}
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

function FileGroup({ label, icon, files, onDownload, onDelete }) {
  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          {icon && <span className="text-fg-muted">{icon}</span>}
          <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide truncate">
            {label}
          </span>
          <span className="text-[10px] text-fg-muted ml-auto shrink-0">{files.length}</span>
        </div>
      )}
      <ul className="space-y-1.5">
        {files.map(att => (
          <li
            key={att.id}
            className="group flex items-start gap-2.5 rounded-lg px-3 py-2.5 bg-raised hover:bg-raised/80 transition-colors"
          >
            <PaperClipIcon className="w-4 h-4 shrink-0 text-fg-muted mt-0.5" />

            <div className="flex-1 min-w-0">
              <button
                onClick={() => onDownload(att)}
                className="w-full text-left text-sm text-brand hover:underline leading-snug block truncate"
                title={att.filename}
              >
                {att.filename}
              </button>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-fg-muted">{formatSize(att.size)}</span>
                {att.uploadedBy?.name && (
                  <span className="text-[11px] text-fg-muted">· {att.uploadedBy.name}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => onDelete(att)}
              className="shrink-0 p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-danger-subtle text-fg-muted hover:text-danger transition-all"
              title="Eliminar"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
