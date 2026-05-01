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

export interface Bucket {
  id: string
  name: string
  location: string | null
  created_at: string
  expiration_date: string | null
  is_completed: boolean
  completion_pct: number
  member_count: number
}

export interface Invitation {
  id: string
  bucket_id: string
  bucket_name: string
  invited_email: string
  inviter_name: string
  accepted_at: string | null
}

export interface CreateBucketPayload {
  name: string
  location: string
  expiration_date: string
  invite_emails: string[]
}
