export interface User {
  id: string
  name: string
  email: string
  created_at: string
  last_login_at: string | null
}

export interface AuthResponse {
  token: string
  user: User
}
