import type { AuthResponse } from '../types'
import { request } from './request'

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
