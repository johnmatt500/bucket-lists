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

export interface BucketDetail {
  id: string
  name: string
  location: string | null
  expiration_date: string | null
  is_completed: boolean
  completion_pct: number
  member_count: number
}

export interface Item {
  id: string
  bucket_id: string
  name: string
  full_address: string | null
  importance: number
  amount_time_required: number
  time_scale: 'hours' | 'days'
  total_hours_required: number
  status: 'pending' | 'approved' | 'rejected'
  is_completed: boolean
  completion_date: string | null
  created_at: string
}

export interface BucketMember {
  user_id: string | null
  name: string | null
  email: string
  joined_at: string | null
  invite_status: 'accepted' | 'pending'
}

export interface CreateItemPayload {
  name: string
  importance: number
  amount_time_required: number
  time_scale: 'hours' | 'days'
  full_address?: string
}
