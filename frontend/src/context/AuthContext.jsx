/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import api, { clearAccessToken, setAccessToken, setAuthenticationExpiredHandler } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const completeLogin = (data) => {
    setAccessToken(data.token)
    setToken(data.token || null)
    setUser(data.user)
  }

  useEffect(() => {
    let active = true
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthenticationExpiredHandler(() => {
      if (!active) return
      clearAccessToken()
      setToken(null)
      setUser(null)
    })

    const restoreSession = async () => {
      try {
        const response = await api.post('/auth/refresh')
        if (active && response.data.success) completeLogin(response.data)
      } catch {
        clearAccessToken()
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      active = false
      setAuthenticationExpiredHandler(null)
    }
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    })

    const data = response.data

    if (!data.success) {
      throw new Error(data.message || 'Login failed')
    }

    completeLogin(data)

    return data
  }

  const logout = () => {
    void api.post('/auth/logout').catch(() => {})
    clearAccessToken()
    setToken(null)
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser((currentUser) => {
      const nextUser = { ...currentUser, ...updates }
      return nextUser
    })
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        completeLogin,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
