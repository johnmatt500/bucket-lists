import type { Bucket, BucketDetail, Item, BucketMember, CreateBucketPayload, CreateItemPayload, Invitation } from '../types'
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

export function getBucket(id: string): Promise<{ bucket: BucketDetail }> {
  return authedRequest(`/buckets/${id}`, { method: 'GET' })
}

export function getBucketItems(id: string): Promise<{ items: Item[] }> {
  return authedRequest(`/buckets/${id}/items`, { method: 'GET' })
}

export function getBucketMembers(id: string): Promise<{ members: BucketMember[] }> {
  return authedRequest(`/buckets/${id}/members`, { method: 'GET' })
}

export function createItem(bucketId: string, payload: CreateItemPayload): Promise<{ item: Item }> {
  return authedRequest(`/buckets/${bucketId}/items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function inviteMember(bucketId: string, email: string): Promise<{ message: string }> {
  return authedRequest(`/buckets/${bucketId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
