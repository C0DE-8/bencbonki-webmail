const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
export const API_URL = rawApiUrl.replace(/\/+$/, '')

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}
