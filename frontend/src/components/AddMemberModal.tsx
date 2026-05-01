import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from './AddMemberModal.module.css'
import { inviteMember } from '../api/buckets'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  bucketId: string
  onClose: () => void
  onInvited: () => void
}

export default function AddMemberModal({ bucketId, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Email is required')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      await inviteMember(bucketId, trimmed)
      onInvited()
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <div>
            <h2 className={styles.modalTitle} id="add-member-title">Invite member</h2>
            <p className={styles.modalSubtitle}>Send an invitation by email.</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        {serverError && (
          <div className={styles.serverError} role="alert">{serverError}</div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input
              className={`${styles.input}${error ? ` ${styles.inputError}` : ''}`}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="friend@example.com"
              autoFocus
            />
            {error && <span className={styles.fieldError} role="alert">{error}</span>}
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Sending…' : 'Send invitation'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
