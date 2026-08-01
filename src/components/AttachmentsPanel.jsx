import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAttachments, uploadAttachment, deleteAttachment, downloadAttachment } from '../api/attachments'
import { useConfirm } from './ConfirmDialog'

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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Adjuntos</h3>
          <FileInfoTooltip />
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="text-xs px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          {upload.isPending ? 'Subiendo...' : '+ Subir archivo'}
        </button>
        <input ref={inputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
      </div>

      {upload.isError && (
        <p className="text-xs text-danger mb-2">{upload.error?.response?.data?.error || 'Error al subir'}</p>
      )}

      {isLoading ? (
        <p className="text-xs text-fg-muted">Cargando...</p>
      ) : data?.length === 0 ? (
        <p className="text-xs text-fg-muted">Sin archivos adjuntos</p>
      ) : (
        <ul className="space-y-2">
          {data?.map(att => (
            <li key={att.id} className="flex items-center justify-between bg-raised rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-fg-muted text-base">📎</span>
                <div className="min-w-0">
                  <button
                    onClick={() => downloadAttachment(att.storedName, att.filename)}
                    className="text-brand hover:underline truncate block max-w-xs text-left"
                  >
                    {att.filename}
                  </button>
                  <span className="text-xs text-fg-muted">{formatSize(att.size)} · {att.uploadedBy?.name || ''}</span>
                </div>
              </div>
              <button
                onClick={async () => { if (await confirm('¿Eliminar archivo?')) del.mutate(att.id) }}
                className="text-danger/60 hover:text-danger text-xs ml-3 shrink-0"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
