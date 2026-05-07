import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function isTokenValid(token) {
  const payload = parseToken(token)
  if (!payload) return false
  return payload.exp * 1000 > Date.now()
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token')
    if (t && !isTokenValid(t)) {
      localStorage.removeItem('token')
      return null
    }
    return t
  })
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token')
    return t && isTokenValid(t) ? parseToken(t) : null
  })

  function login(newToken) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(parseToken(newToken))
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  function switchOrg(newToken) {
    login(newToken)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, switchOrg }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
