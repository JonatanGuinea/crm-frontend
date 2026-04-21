import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { register as registerApi } from '../../api/auth'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await registerApi(form)
      login(res.data.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-line p-8">
      <h2 className="text-xl font-semibold text-fg mb-6">Crear cuenta</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'password', label: 'Contraseña', type: 'password' },
          { key: 'organizationName', label: 'Nombre de la organización', type: 'text' },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-fg-soft mb-1">{label}</label>
            <input
              type={type}
              required
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full px-3 py-2 border border-line-soft rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-surface text-fg"
            />
          </div>
        ))}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors"
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-fg-soft">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-brand hover:underline">Iniciar sesión</Link>
      </p>
    </div>
  )
}
