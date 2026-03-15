import { useState, useEffect } from "react"
import { AuthContext } from "./AuthProvider"

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // 👇 Add this effect to log whenever user changes
  useEffect(() => {
    console.log("AuthContext user updated:", user)
  }, [user])


  const loginCitizen = () => setUser({ role: "Citizen", token: null })

  const loginStaffOrOfficial = async (username, password, role, setError) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/Userdata/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      })

      let data
      try {
        data = await res.json()
      } catch {
        data = { message: "Server returned invalid response" }
      }

      if (res.ok) {
        const backendUser = data.data?.user

        // ✅ Role validation logic
        if (role === "Official" && (backendUser?.org_name || backendUser?.district)) {
          setError("only for Officials. Please check your credentials.")
          return
        }
        if (role === "Staff" && (!backendUser?.org_name || !backendUser?.district)) {
          setError("only for Staff. Please check your credentials.")
          return
        }

        // ✅ Store extra details for Staff
        if (role === "Staff") {
          setUser({
            role,
            token: data.data?.accessToken,
            username: backendUser?.username,
            org_name: backendUser?.org_name,
            district: backendUser?.district
          })
        } else {
          setUser({
            role,
            token: data.data?.accessToken,
            username: backendUser?.username
          })
        }

        setError(null)
      } else {
        setError(data.message || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Server error during login")
    }
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