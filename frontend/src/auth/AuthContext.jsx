import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, setAuthToken } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    api('/api/auth/session')
      .then((data) => {
        if (!data.user) {
          setAuthToken(null)
        }

        setUser(data.user)
      })
      .catch(() => {
        setAuthToken(null)
        setUser(null)
      })
      .finally(() => setBooting(false))
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setAuthToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setAuthToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    booting,
    login,
    logout,
    user,
  }), [booting, login, logout, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
