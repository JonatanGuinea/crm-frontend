import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { getOrganizations, updateOrganization, uploadOrgLogo, deleteOrganization } from '../../api/organizations'
import { PhotoIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ProvinceSelect from '../../components/ProvinceSelect'

const inputCls = "w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
const labelCls = "block text-sm font-medium text-fg-soft mb-1"
const API_BASE  = import.meta.env.VITE_API_URL?.replace('/api', '')

export default function OrgSettingsPage() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const orgId = user?.org
  const logoInputRef  = useRef(null)
  const sigCanvasRef  = useRef(null)
  const sigDrawing    = useRef(false)
  const sigHasDrawing = useRef(false)

  const [form, setForm] = useState({
    name: '', cuit: '', email: '', website: '', phone: '',
    address: '', province: '', city: '', postalCode: '', signatureOwnerName: ''
  })
  const [logoPreview,  setLogoPreview]  = useState(null)
  const [orgSignature, setOrgSignature] = useState(null)
  const [sigIsEmpty,   setSigIsEmpty]   = useState(true)
  const [deleteModal,  setDeleteModal]  = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const { data: orgData } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganizations().then(r => r.data.data?.find(o => o.id === orgId)),
    enabled: Boolean(orgId)
  })

  useEffect(() => {
    if (orgData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name:               orgData.name               || '',
        cuit:               orgData.cuit               || '',
        email:              orgData.email              || '',
        website:            orgData.website            || '',
        phone:              orgData.phone              || '',
        address:            orgData.address            || '',
        province:           orgData.province           || '',
        city:               orgData.city               || '',
        postalCode:         orgData.postalCode         || '',
        signatureOwnerName: orgData.signatureOwnerName || '',
      })
      setLogoPreview(orgData.logo ? `${API_BASE}/uploads/${orgData.logo}` : null)
    }
  }, [orgData])

  function getSigXY(e) {
    const canvas = sigCanvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src    = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  function onSigStart(e) {
    e.preventDefault()
    const ctx = sigCanvasRef.current.getContext('2d')
    const { x, y } = getSigXY(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    sigDrawing.current    = true
    sigHasDrawing.current = true
    setSigIsEmpty(false)
  }

  function onSigMove(e) {
    if (!sigDrawing.current) return
    e.preventDefault()
    const ctx = sigCanvasRef.current.getContext('2d')
    const { x, y } = getSigXY(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
  }

  function onSigEnd(e) {
    if (!sigDrawing.current) return
    e.preventDefault()
    sigDrawing.current = false
    if (sigHasDrawing.current) {
      setOrgSignature(sigCanvasRef.current.toDataURL('image/png'))
    }
  }

  function clearSigCanvas() {
    const canvas = sigCanvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    sigHasDrawing.current = false
    setSigIsEmpty(true)
    setOrgSignature(null)
  }

  const deleteOrg = useMutation({
    mutationFn: () => deleteOrganization(orgId),
    onSuccess: () => {
      toast('Organización eliminada', 'success')
      logout()
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al eliminar', 'error')
  })

  const saveOrg = useMutation({
    mutationFn: () => updateOrganization(orgId, {
      ...form,
      website: form.website && !/^https?:\/\//i.test(form.website) ? `https://${form.website}` : form.website,
      ...(orgSignature !== null && { signature: orgSignature }),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['organization', orgId])
      toast('Organización actualizada', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al guardar', 'error')
  })

  const uploadLogo = useMutation({
    mutationFn: (file) => uploadOrgLogo(orgId, file),
    onSuccess: (res) => {
      qc.invalidateQueries(['organization', orgId])
      const filename = res.data.data?.logo
      if (filename) setLogoPreview(`${API_BASE}/uploads/${filename}`)
      toast('Logo actualizado', 'success')
    },
    onError: (err) => toast(err.response?.data?.error || err.message || 'Error al subir logo', 'error')
  })

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-fg mb-8">Configuración de la organización</h1>

      {/* Logo */}
      <div className="mb-8 flex items-center gap-5">
        <div
          onClick={() => logoInputRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-line-soft flex items-center justify-center cursor-pointer hover:border-brand transition-colors overflow-hidden bg-raised shrink-0"
        >
          {logoPreview
            ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
            : <PhotoIcon className="w-8 h-8 text-fg-muted" />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-fg">Logo de la organización</p>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadLogo.isPending}
            className="mt-1 px-3 py-1.5 border border-line-soft rounded-md text-sm text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            {uploadLogo.isPending ? 'Subiendo...' : logoPreview ? 'Cambiar logo' : 'Subir logo'}
          </button>
          <p className="mt-1 text-xs text-fg-muted">PNG, JPG o WEBP</p>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo.mutate(f) }}
          />
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); saveOrg.mutate() }}>

        {/* Información general */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-4">Información general</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nombre *</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CUIT</label>
              <input type="text" value={form.cuit} placeholder="20-12345678-9"
                onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input type="text" value={form.phone} placeholder="+54 11 1234-5678"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email de contacto</label>
              <input type="email" value={form.email} placeholder="info@empresa.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sitio web</label>
              <input type="text" value={form.website} placeholder="empresa.com"
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between px-3 py-2.5 bg-raised rounded-md border border-line-soft">
              <span className="text-sm text-fg-muted">Moneda de trabajo</span>
              <span className="text-sm font-semibold text-fg">
                {orgData?.defaultCurrency === 'ARS' ? 'ARS — Peso argentino' : 'USD — Dólar'}
              </span>
            </div>
          </div>
        </section>

        <hr className="border-line mb-8" />

        {/* Dirección */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-4">Dirección</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Dirección</label>
              <input type="text" value={form.address} placeholder="Av. Corrientes 1234"
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Provincia</label>
              <ProvinceSelect
                value={form.province}
                onChange={v => setForm(f => ({ ...f, province: v }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ciudad</label>
              <input type="text" value={form.city} placeholder="Rosario"
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Código postal</label>
              <input type="text" value={form.postalCode} placeholder="2000"
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </section>

        <hr className="border-line mb-8" />

        {/* Firma */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-fg mb-4">Firma de la organización</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre del firmante</label>
              <input type="text" value={form.signatureOwnerName} placeholder="Ej: Juan García"
                onChange={e => setForm(f => ({ ...f, signatureOwnerName: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Firma</label>
              {orgData?.signature && orgSignature !== '' && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-white rounded-lg border border-line-soft">
                  <img src={orgData.signature} alt="Firma guardada" className="max-h-12 object-contain flex-1 min-w-0" />
                  <button
                    type="button"
                    onClick={() => setOrgSignature('')}
                    className="shrink-0 text-sm text-danger hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              )}
              {orgSignature === '' && (
                <p className="text-sm text-danger mb-3">La firma se eliminará al guardar.</p>
              )}
              <div className="relative rounded-lg overflow-hidden border border-line-soft bg-white">
                <canvas
                  ref={sigCanvasRef}
                  width={700}
                  height={140}
                  className="w-full touch-none cursor-crosshair block"
                  onMouseDown={onSigStart}
                  onMouseMove={onSigMove}
                  onMouseUp={onSigEnd}
                  onMouseLeave={onSigEnd}
                  onTouchStart={onSigStart}
                  onTouchMove={onSigMove}
                  onTouchEnd={onSigEnd}
                />
                <div className="absolute bottom-7 left-5 right-5 h-px bg-zinc-200 pointer-events-none" />
                {sigIsEmpty && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-300 pointer-events-none select-none">
                    {orgData?.signature ? 'Dibujá aquí para reemplazar la firma' : 'Dibujá tu firma aquí'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={clearSigCanvas}
                disabled={sigIsEmpty}
                className="mt-2 flex items-center gap-1 text-sm text-fg-muted hover:text-fg disabled:opacity-40 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Limpiar canvas
              </button>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saveOrg.isPending}
          className="px-5 py-2 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          {saveOrg.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Zona de peligro */}
      <div className="mt-12 border border-danger/30 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-danger/5 flex items-center gap-3 border-b border-danger/20">
          <ExclamationTriangleIcon className="w-5 h-5 text-danger shrink-0" />
          <h2 className="text-sm font-semibold text-danger">Zona de peligro</h2>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fg">Eliminar organización</p>
            <p className="text-xs text-fg-muted mt-0.5">Elimina permanentemente la organización y todos sus datos. Esta acción no se puede deshacer.</p>
          </div>
          <button
            type="button"
            onClick={() => { setDeleteConfirm(''); setDeleteModal(true) }}
            className="shrink-0 px-4 py-2 text-sm font-medium text-danger border border-danger/40 rounded-md hover:bg-danger/8 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(false)} />
          <div className="relative bg-surface border border-line rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-fg">Eliminar organización</h3>
                <p className="text-xs text-fg-muted">Esta acción es permanente e irreversible</p>
              </div>
            </div>

            <p className="text-sm text-fg-muted mb-4 leading-relaxed">
              Se eliminarán todos los datos de <strong className="text-fg">{orgData?.name}</strong>: clientes, proyectos, presupuestos, tareas, stock y movimientos financieros.
            </p>

            <div className="mb-5">
              <label className="block text-xs text-fg-muted mb-1.5">
                Escribí <span className="font-semibold text-fg">{orgData?.name}</span> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={orgData?.name}
                className="w-full px-3 py-2 border border-line rounded-md text-sm bg-surface text-fg focus:outline-none focus:ring-2 focus:ring-danger/40 focus:border-danger/60 transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-fg-muted border border-line rounded-md hover:bg-raised transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirm !== orgData?.name || deleteOrg.isPending}
                onClick={() => deleteOrg.mutate()}
                className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
              >
                {deleteOrg.isPending && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                )}
                {deleteOrg.isPending ? 'Eliminando...' : 'Eliminar organización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
