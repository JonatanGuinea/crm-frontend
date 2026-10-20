const API = import.meta.env.VITE_API_URL ?? ''

export function imgUrl(value) {
  if (!value) return null
  if (value.startsWith('http')) return value
  if (value.startsWith('/uploads/')) return `${API}${value}`
  return `${API}/uploads/${value}`
}
