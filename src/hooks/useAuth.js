// src/hooks/useAuth.js
import { useState, useEffect } from 'react'

// For Electron desktop app
const isElectron = window.electronAPI !== undefined

// For web/mobile
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))
  
  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [token])
  
  const verifyToken = async () => {
    try {
      let result
      
      if (isElectron) {
        result = await window.electronAPI.invoke('auth:verify', { token })
      } else {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        result = await response.json()
      }
      
      if (result.success && result.user) {
        setUser(result.user)
      } else {
        localStorage.removeItem('token')
        setToken(null)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }
  
  const login = async (email, password, deviceInfo) => {
    try {
      let result
      
      if (isElectron) {
        result = await window.electronAPI.invoke('auth:login', {
          email,
          password,
          deviceInfo: deviceInfo || 'Electron Desktop',
          ipAddress: 'localhost'
        })
      } else {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, deviceInfo })
        })
        result = await response.json()
      }
      
      if (result.success) {
        localStorage.setItem('token', result.token)
        setToken(result.token)
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  const logout = async (sessionId) => {
    try {
      if (isElectron && sessionId) {
        await window.electronAPI.invoke('auth:logout', { sessionId })
      } else if (sessionId) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        })
      }
      
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  const logoutAll = async () => {
    try {
      if (isElectron && user) {
        await window.electronAPI.invoke('auth:logoutAll', { userId: user.id })
      } else if (user) {
        await fetch(`${API_URL}/api/auth/logout-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      }
      
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } catch (error) {
      console.error('Logout all error:', error)
    }
  }
  
  return {
    user,
    loading,
    login,
    logout,
    logoutAll,
    isAuthenticated: !!user
  }
}