import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
export const API_URL = rawApiUrl.replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
