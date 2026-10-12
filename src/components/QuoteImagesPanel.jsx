import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadQuoteImage, updateQuoteImage, deleteQuoteImage } from '../api/quotes'
import { useToast } from './Toast'
import { MasIcon } from './DuIcons'

const UPLOADS_BASE = import.meta.env.VITE_API_URL

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
  ok:    '#7DBE93',
  err:   '#E58373',
}

const SECTION_TITLE = {
  fontSize: 10.5, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: C.arena, margin: 0,
}

const inputStyle = {
  width: '100%', padding: '8px 12px',
  background: C.bg, border: `1px solid ${C.linea}`,
  borderRadius: '0 9px 9px 0',
  color: C.crema, fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// ── icons ─────────────────────────────────────────────────────────────────────

function PencilSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

function TrashSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

function XSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function CheckSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function RefreshSvg() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 12, height: 12 }}>
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
  )
}

function PhotoSvg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 32, height: 32, color: C.linea }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export default function QuoteImagesPanel({ quoteId, images = [], canWrite }) {
  const toast = useToast()
  const qc    = useQueryClient()
  const fileRef     = useRef(null)
  const editFileRef = useRef(null)

  const [uploading, setUploading]       = useState(false)
  const [pendingFile, setPendingFile]   = useState(null)
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingDesc, setPendingDesc]   = useState('')
  const [deletingId, setDeletingId]     = useState(null)
  const [editingId, setEditingId]       = useState(null)
  const [editTitle, setEditTitle]       = useState('')
  const [editDesc, setEditDesc]         = useState('')
  const [editFile, setEditFile]         = useState(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile({ file, previewUrl: URL.createObjectURL(file) })
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={SECTION_TITLE}>Imágenes</p>
        {canWrite && !pendingFile && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: '0 7px 7px 0',
                background: C.arena, color: C.bg,
                fontSize: 11.5, fontWeight: 600, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.crema}
              onMouseLeave={e => e.currentTarget.style.background = C.arena}
            >
              <MasIcon style={{ width: 12, height: 12 }} />
              Agregar
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
          </>
        )}
      </div>
      <p style={{ fontSize: 11, color: C.piedra, marginBottom: 16 }}>Se muestran en el presupuesto enviado al cliente</p>

      {/* Preview antes de subir */}
      {pendingFile && (
        <div style={{
          marginBottom: 16, padding: 12,
          background: C.s3, border: `1px solid ${C.linea}`,
          borderRadius: '0 10px 10px 0',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <img src={pendingFile.previewUrl} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '0 6px 6px 0' }} />
          <input
            type="text"
            value={pendingTitle}
            onChange={e => setPendingTitle(e.target.value)}
            placeholder="Título (opcional)"
            style={inputStyle}
            className="placeholder:text-[#8C877E]"
          />
          <textarea
            value={pendingDesc}
            onChange={e => setPendingDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
            style={{ ...inputStyle, resize: 'none', paddingTop: 8, paddingBottom: 8 }}
            className="placeholder:text-[#8C877E]"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={cancelPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', background: 'none',
                border: `1px solid ${C.linea}`, borderRadius: '0 7px 7px 0',
                color: C.piedra, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.arena; e.currentTarget.style.color = C.arena }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.linea; e.currentTarget.style.color = C.piedra }}
            >
              <XSvg /> Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '6px 12px', background: C.crema, color: C.bg,
                border: 'none', borderRadius: '0 7px 7px 0',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                opacity: uploading ? 0.6 : 1, transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = '#E8E3D9' }}
              onMouseLeave={e => e.currentTarget.style.background = C.crema}
            >
              {uploading ? 'Subiendo...' : 'Guardar imagen'}
            </button>
          </div>
        </div>
      )}

      {/* Lista vacía */}
      {images.length === 0 && !pendingFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
          <PhotoSvg />
          <p style={{ fontSize: 12, color: C.piedra }}>Sin imágenes</p>
        </div>
      )}

      {/* Lista de imágenes */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {images.map(img => (
            <div key={img.id} style={{
              background: C.s2, border: `1px solid ${C.linea}`,
              borderRadius: '0 10px 10px 0', overflow: 'hidden',
            }}>
              <img
                src={`${UPLOADS_BASE}/uploads/${img.storedName}`}
                alt={img.title || 'Imagen'}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{ padding: '10px 12px' }}>
                {editingId === img.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={editFile ? editFile.previewUrl : `${UPLOADS_BASE}/uploads/${img.storedName}`}
                        alt=""
                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '0 6px 6px 0' }}
                      />
                      <button
                        type="button"
                        onClick={() => editFileRef.current?.click()}
                        style={{
                          position: 'absolute', bottom: 8, right: 8,
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 8px', background: 'rgba(0,0,0,0.65)',
                          border: 'none', borderRadius: '0 6px 6px 0',
                          color: C.crema, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <RefreshSvg /> Cambiar
                      </button>
                      <input ref={editFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleEditFileChange} />
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Título"
                      style={inputStyle}
                      className="placeholder:text-[#8C877E]"
                    />
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Descripción"
                      rows={2}
                      style={{ ...inputStyle, resize: 'none', paddingTop: 8, paddingBottom: 8 }}
                      className="placeholder:text-[#8C877E]"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={cancelEdit}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 10px', background: 'none',
                          border: `1px solid ${C.linea}`, borderRadius: '0 6px 6px 0',
                          color: C.piedra, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <XSvg /> Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(img.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 10px', background: C.crema, color: C.bg,
                          border: 'none', borderRadius: '0 6px 6px 0',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <CheckSvg /> Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      {img.title && (
                        <p style={{ fontSize: 13, fontWeight: 500, color: C.crema, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.title}</p>
                      )}
                      {img.description && (
                        <p style={{ fontSize: 11, color: C.piedra, marginTop: 2, lineHeight: 1.5 }}>{img.description}</p>
                      )}
                      {!img.title && !img.description && (
                        <p style={{ fontSize: 11, color: C.piedra, fontStyle: 'italic' }}>Sin título ni descripción</p>
                      )}
                    </div>
                    {canWrite && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => startEdit(img)}
                          title="Editar"
                          style={{
                            padding: 5, background: 'none', border: 'none',
                            borderRadius: '0 5px 5px 0', cursor: 'pointer',
                            color: C.piedra, transition: 'color 0.12s, background 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.crema; e.currentTarget.style.background = C.s3 }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.piedra; e.currentTarget.style.background = 'none' }}
                        >
                          <PencilSvg />
                        </button>
                        <button
                          onClick={() => handleDelete(img.id)}
                          disabled={deletingId === img.id}
                          title="Eliminar"
                          style={{
                            padding: 5, background: 'none', border: 'none',
                            borderRadius: '0 5px 5px 0', cursor: 'pointer',
                            color: 'rgba(229,131,115,0.5)',
                            opacity: deletingId === img.id ? 0.4 : 1,
                            transition: 'color 0.12s, background 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.err; e.currentTarget.style.background = 'rgba(229,131,115,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(229,131,115,0.5)'; e.currentTarget.style.background = 'none' }}
                        >
                          <TrashSvg />
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
