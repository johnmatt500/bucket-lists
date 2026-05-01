import type { Bucket, CreateBucketPayload, Invitation } from '../types'
import { authedRequest, request } from './request'

export function listBuckets(): Promise<{ buckets: Bucket[] }> {
  return authedRequest('/buckets', { method: 'GET' })
}

export function createBucket(payload: CreateBucketPayload): Promise<{ bucket: Bucket }> {
  return authedRequest('/buckets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getInvitation(token: string): Promise<{ invitation: Invitation }> {
  return request(`/invitations/${token}`, { method: 'GET' })
}

export function acceptInvitation(token: string): Promise<{ bucket_id: string }> {
  return authedRequest(`/invitations/${token}/accept`, { method: 'POST' })
}
