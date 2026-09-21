import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadQuoteImage, updateQuoteImage, deleteQuoteImage } from '../api/quotes'
import { useToast } from './Toast'
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const UPLOADS_BASE = import.meta.env.VITE_API_URL

export default function QuoteImagesPanel({ quoteId, images = [], canWrite }) {
  const toast = useToast()
  const qc    = useQueryClient()
  const fileRef     = useRef(null)
  const editFileRef = useRef(null)

  const [uploading, setUploading]     = useState(false)
  const [pendingFile, setPendingFile] = useState(null)  // { file, previewUrl }
  const [pendingTitle, setPendingTitle]   = useState('')
  const [pendingDesc, setPendingDesc]     = useState('')
  const [deletingId, setDeletingId]       = useState(null)
  const [editingId, setEditingId]         = useState(null)
  const [editTitle, setEditTitle]         = useState('')
  const [editDesc, setEditDesc]           = useState('')
  const [editFile, setEditFile]           = useState(null)   // { file, previewUrl }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setPendingFile({ file, previewUrl })
    setPendingTitle('')
    setPendingDesc('')
    e.target.value = ''
  }

  function cancelPending() {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl)
    setPendingFile(null)
  }

  async function handleUpload() {
    if (!pendingFile) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', pendingFile.file)
      if (pendingTitle.trim()) fd.append('title', pendingTitle.trim())
      if (pendingDesc.trim())  fd.append('description', pendingDesc.trim())
      await uploadQuoteImage(quoteId, fd)
      URL.revokeObjectURL(pendingFile.previewUrl)
      setPendingFile(null)
      qc.invalidateQueries(['quote', quoteId])
      toast('Imagen agregada', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Error al subir la imagen', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(imageId) {
    setDeletingId(imageId)
    try {
      await deleteQuoteImage(imageId)
      qc.invalidateQueries(['quote', quoteId])
      toast('Imagen eliminada', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Error al eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  function startEdit(img) {
    setEditingId(img.id)
    setEditTitle(img.title || '')
    setEditDesc(img.description || '')
    setEditFile(null)
  }

  function cancelEdit() {
    if (editFile?.previewUrl) URL.revokeObjectURL(editFile.previewUrl)
    setEditFile(null)
    setEditingId(null)
  }

  function handleEditFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (editFile?.previewUrl) URL.revokeObjectURL(editFile.previewUrl)
    setEditFile({ file, previewUrl: URL.createObjectURL(file) })
    e.target.value = ''
  }

  async function saveEdit(imageId) {
    try {
      let payload
      if (editFile) {
        const fd = new FormData()
        fd.append('file', editFile.file)
        fd.append('title', editTitle)
        fd.append('description', editDesc)
        payload = fd
      } else {
        payload = { title: editTitle, description: editDesc }
      }
      await updateQuoteImage(imageId, payload)
      if (editFile?.previewUrl) URL.revokeObjectURL(editFile.previewUrl)
      setEditFile(null)
      qc.invalidateQueries(['quote', quoteId])
      setEditingId(null)
      toast('Imagen actualizada', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Error al guardar', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-fg-soft uppercase tracking-wide">Imágenes</h3>
        {canWrite && !pendingFile && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 text-xs text-brand hover:opacity-80 transition-opacity"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Agregar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      <p className="text-xs text-fg-muted mb-4">Se muestran en el presupuesto enviado al cliente</p>

      {/* Vista previa antes de subir */}
      {pendingFile && (
        <div className="mb-4 rounded-xl border border-brand/30 bg-brand-subtle/20 p-3 space-y-3">
          <img
            src={pendingFile.previewUrl}
            alt="Preview"
            className="w-full h-auto block rounded-lg"
          />
          <input
            type="text"
            value={pendingTitle}
            onChange={e => setPendingTitle(e.target.value)}
            placeholder="Título (opcional)"
            className="w-full px-3 py-1.5 text-sm border border-line rounded-lg bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <textarea
            value={pendingDesc}
            onChange={e => setPendingDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-line rounded-lg bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={cancelPending}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-line text-fg-muted hover:bg-raised transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-brand text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {uploading ? 'Subiendo...' : 'Guardar imagen'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de imágenes */}
      {images.length === 0 && !pendingFile ? (
        <div className="flex flex-col items-center justify-center py-8 text-fg-muted gap-2">
          <PhotoIcon className="w-8 h-8 opacity-30" />
          <p className="text-xs">Sin imágenes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map(img => (
            <div key={img.id} className="rounded-xl border border-line overflow-hidden">
              <img
                src={`${UPLOADS_BASE}/uploads/${img.storedName}`}
                alt={img.title || 'Imagen'}
                className="w-full h-auto block"
              />
              <div className="p-3">
                {editingId === img.id ? (
                  <div className="space-y-2">
                    {/* Preview de la imagen actual o la nueva */}
                    <div className="relative">
                      <img
                        src={editFile ? editFile.previewUrl : `${UPLOADS_BASE}/uploads/${img.storedName}`}
                        alt=""
                        className="w-full h-auto block rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => editFileRef.current?.click()}
                        className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
                      >
                        <ArrowPathIcon className="w-3 h-3" /> Cambiar
                      </button>
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleEditFileChange}
                      />
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Título"
                      className="w-full px-2.5 py-1.5 text-sm border border-line rounded-lg bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Descripción"
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-sm border border-line rounded-lg bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-line text-fg-muted hover:bg-raised transition-colors"
                      >
                        <XMarkIcon className="w-3 h-3" /> Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(img.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-brand text-white hover:opacity-90 transition-opacity"
                      >
                        <CheckIcon className="w-3 h-3" /> Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {img.title && (
                        <p className="text-sm font-medium text-fg truncate">{img.title}</p>
                      )}
                      {img.description && (
                        <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">{img.description}</p>
                      )}
                      {!img.title && !img.description && (
                        <p className="text-xs text-fg-muted italic">Sin título ni descripción</p>
                      )}
                    </div>
                    {canWrite && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(img)}
                          className="p-1 rounded text-fg-muted hover:text-fg hover:bg-raised transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(img.id)}
                          disabled={deletingId === img.id}
                          className="p-1 rounded text-danger/60 hover:text-danger hover:bg-danger-subtle transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
