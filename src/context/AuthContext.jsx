import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token')
    return t ? parseToken(t) : null
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
