import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('resilo_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const login = (role, extraData = {}) => {
    const userData = { role, ...extraData }
    setUser(userData)
    localStorage.setItem('resilo_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('resilo_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
