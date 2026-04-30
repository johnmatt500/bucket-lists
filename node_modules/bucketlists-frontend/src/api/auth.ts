import type { AuthResponse } from '../types'

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
  return data as T
}

export function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
