// electron/auth-handlers.js
import { ipcMain } from 'electron'
import { loginUser, verifyToken, getUserSessions, logoutSession, logoutAllSessions } from '../src/lib/auth.js'

export function setupAuthHandlers() {
  // Login handler
  ipcMain.handle('auth:login', async (event, { email, password, deviceInfo, ipAddress }) => {
    try {
      const result = await loginUser(email, password, deviceInfo, ipAddress)
      return { success: true, ...result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Verify token handler
  ipcMain.handle('auth:verify', async (event, { token }) => {
    try {
      const user = await verifyToken(token)
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Get sessions handler
  ipcMain.handle('auth:sessions', async (event, { userId }) => {
    try {
      const sessions = await getUserSessions(userId)
      return { success: true, sessions }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Logout from device
  ipcMain.handle('auth:logout', async (event, { sessionId }) => {
    try {
      await logoutSession(sessionId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  
  // Logout from all devices
  ipcMain.handle('auth:logoutAll', async (event, { userId }) => {
    try {
      await logoutAllSessions(userId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}