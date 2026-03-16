/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react"
import { AuthContext } from "./AuthContext"

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('resilo_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('resilo_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('resilo_user')
    }
    console.log("AuthContext user updated:", user)
  }, [user])


  const loginCitizen = () => setUser({ role: "Citizen", token: null })

  const loginStaffOrOfficial = async (username, password, role, setError, extraData = {}) => {
    // 🛡️ HARDCODED DUMMY CREDENTIALS (NO BACKEND)
    if (role === "Official") {
      if (username === "admin@resilo.in" && password === "admin123") {
        setUser({ role: "Authority", token: "dummy_admin_token", username: "State Commander" })
        setError(null)
        return true
      } else {
        setError("Invalid Authority credentials.")
        return false
      }
    }
    
    if (role === "Staff") {
      if (username === "staff101" && password === "staff123") {
        setUser({
          role: "Staff",
          token: "dummy_staff_token",
          username: "Facility Manager",
          ...extraData
        })
        setError(null)
        return true
      } else {
        setError("Invalid Staff credentials.")
        return false
      }
    }

    setError("Invalid Role specified.")
    return false
  }

  const refreshToken = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/Userdata/refresh-token", {
        method: "POST",
        credentials: "include"
      })
      let data
      try {
        data = await res.json()
      } catch {
        data = { message: "Server returned invalid response" }
      }
      if (res.ok) {
        setUser((prev) => ({ ...prev, token: data.data?.accessToken }))
      } else {
        console.warn("Refresh failed:", data.message)
      }
    } catch (err) {
      console.error("Refresh error:", err)
    }
  }

  const logout = () => setUser(null)

  useEffect(() => {
    if (user?.role && user.role !== "Citizen") {
      const interval = setInterval(refreshToken, 10 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loginCitizen, loginStaffOrOfficial, refreshToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}