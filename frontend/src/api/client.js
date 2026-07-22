import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const tokenKey = 'bencbonki_mail_token'
export const API_URL = rawApiUrl.replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getAuthToken() {
  return window.localStorage.getItem(tokenKey)
}

export function setAuthToken(token) {
  if (token) {
    window.localStorage.setItem(tokenKey, token)
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  window.localStorage.removeItem(tokenKey)
  delete apiClient.defaults.headers.common.Authorization
}

setAuthToken(getAuthToken())

export async function api(path, options = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : options.data,
      headers: options.headers,
    })

    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message || 'Request failed', {
      cause: error,
    })
  }
}
