import { useState, useEffect, FormEvent, KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from './CreateBucketModal.module.css'
import { createBucket } from '../api/buckets'
import type { Bucket, CreateBucketPayload } from '../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Props {
  onClose: () => void
  onCreated: (bucket: Bucket) => void
}

export default function CreateBucketModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [inviteEmails, setInviteEmails] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function addEmail() {
    const trimmed = emailInput.trim().toLowerCase()
    if (!trimmed) return
    if (!EMAIL_RE.test(trimmed)) {
      setErrors(e => ({ ...e, email: 'Enter a valid email address' }))
      return
    }
    if (inviteEmails.includes(trimmed)) {
      setErrors(e => ({ ...e, email: 'This email is already added' }))
      return
    }
    setInviteEmails(prev => [...prev, trimmed])
    setEmailInput('')
    setErrors(({ email: _removed, ...rest }) => rest)
  }

  function removeEmail(email: string) {
    setInviteEmails(prev => prev.filter(e => e !== email))
  }

  function handleEmailKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      addEmail()
    }
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Bucket name is required'
    if (expirationDate && new Date(expirationDate) <= new Date()) {
      e.expiration_date = 'Must be a future date'
    }
    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    if (emailInput.trim()) addEmail()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const payload: CreateBucketPayload = {
        name: name.trim(),
        location: location.trim(),
        expiration_date: expirationDate,
        invite_emails: inviteEmails,
      }
      const { bucket } = await createBucket(payload)
      onCreated(bucket)
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
      aria-labelledby="modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <div>
            <h2 className={styles.modalTitle} id="modal-title">New bucket</h2>
            <p className={styles.modalSubtitle}>Name your next adventure.</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        {serverError && (
          <div className={styles.serverError} role="alert">{serverError}</div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={`${styles.input}${errors.name ? ` ${styles.inputError}` : ''}`}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Italy trip, Senior year bucket list"
              autoFocus
            />
            {errors.name && <span className={styles.fieldError} role="alert">{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Location <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={styles.input}
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Paris, France"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              End date <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={`${styles.input}${errors.expiration_date ? ` ${styles.inputError}` : ''}`}
              type="date"
              value={expirationDate}
              onChange={e => setExpirationDate(e.target.value)}
            />
            {errors.expiration_date && (
              <span className={styles.fieldError} role="alert">{errors.expiration_date}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Invite people <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.emailRow}>
              <input
                className={`${styles.input} ${styles.emailInput}${errors.email ? ` ${styles.inputError}` : ''}`}
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                placeholder="friend@example.com"
              />
              <button type="button" className={styles.addBtn} onClick={addEmail}>Add</button>
            </div>
            {errors.email && <span className={styles.fieldError} role="alert">{errors.email}</span>}
            {inviteEmails.length > 0 && (
              <div className={styles.chipRow}>
                {inviteEmails.map(email => (
                  <span key={email} className={styles.chip}>
                    {email}
                    <button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => removeEmail(email)}
                      aria-label={`Remove ${email}`}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Creating bucket…' : 'Create bucket'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
