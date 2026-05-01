export async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
  return data as T
}

export function authedRequest<T>(path: string, options: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  return request<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}
