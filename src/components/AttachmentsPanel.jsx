import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAttachments, uploadAttachment, deleteAttachment } from '../api/attachments'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentsPanel({ entityType, entityId }) {
  const qc = useQueryClient()
  const inputRef = useRef()
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
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Adjuntos</h3>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {upload.isPending ? 'Subiendo...' : '+ Subir archivo'}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {upload.isError && (
        <p className="text-xs text-red-600 mb-2">{upload.error?.response?.data?.error || 'Error al subir'}</p>
      )}

      {isLoading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : data?.length === 0 ? (
        <p className="text-xs text-gray-400">Sin archivos adjuntos</p>
      ) : (
        <ul className="space-y-2">
          {data?.map(att => (
            <li key={att.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400 text-base">📎</span>
                <div className="min-w-0">
                  <a
                    href={`${API_BASE}${att.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline truncate block max-w-xs"
                  >
                    {att.filename}
                  </a>
                  <span className="text-xs text-gray-400">{formatSize(att.size)} · {att.uploadedBy?.name || ''}</span>
                </div>
              </div>
              <button
                onClick={() => { if (confirm('¿Eliminar archivo?')) del.mutate(att.id) }}
                className="text-red-400 hover:text-red-600 text-xs ml-3 shrink-0"
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
