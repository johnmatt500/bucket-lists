import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from './AddItemModal.module.css'
import { createItem } from '../api/buckets'
import type { Item, CreateItemPayload } from '../types'

interface Props {
  bucketId: string
  onClose: () => void
  onCreated: (item: Item) => void
}

export default function AddItemModal({ bucketId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [importance, setImportance] = useState<number | ''>('')
  const [amountTime, setAmountTime] = useState<number | ''>('')
  const [timeScale, setTimeScale] = useState<'hours' | 'days'>('hours')
  const [fullAddress, setFullAddress] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Item name is required'
    if (importance === '' || !Number.isInteger(importance) || importance < 1 || importance > 5)
      e.importance = 'Must be a whole number between 1 and 5'
    if (amountTime === '' || !Number.isInteger(amountTime) || amountTime < 1)
      e.amountTime = 'Must be a positive whole number'
    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const payload: CreateItemPayload = {
        name: name.trim(),
        importance: importance as number,
        amount_time_required: amountTime as number,
        time_scale: timeScale,
        full_address: fullAddress.trim() || undefined,
      }
      const { item } = await createItem(bucketId, payload)
      onCreated(item)
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
      aria-labelledby="add-item-title"
    >
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <div>
            <h2 className={styles.modalTitle} id="add-item-title">Add item</h2>
            <p className={styles.modalSubtitle}>What do you want to do?</p>
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
              placeholder="e.g. Hike the Inca Trail"
              autoFocus
            />
            {errors.name && <span className={styles.fieldError} role="alert">{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Importance <span className={styles.hint}>(1 = low, 5 = must-do)</span>
            </label>
            <input
              className={`${styles.input}${errors.importance ? ` ${styles.inputError}` : ''}`}
              type="number"
              min={1}
              max={5}
              step={1}
              value={importance}
              onChange={e => setImportance(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="1–5"
            />
            {errors.importance && <span className={styles.fieldError} role="alert">{errors.importance}</span>}
          </div>

          <div className={styles.twoFields}>
            <div className={styles.field}>
              <label className={styles.label}>Time required</label>
              <input
                className={`${styles.input}${errors.amountTime ? ` ${styles.inputError}` : ''}`}
                type="number"
                min={1}
                step={1}
                value={amountTime}
                onChange={e => setAmountTime(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 3"
              />
              {errors.amountTime && <span className={styles.fieldError} role="alert">{errors.amountTime}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Unit</label>
              <select
                className={styles.input}
                value={timeScale}
                onChange={e => setTimeScale(e.target.value as 'hours' | 'days')}
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Location <span className={styles.optional}>(optional)</span>
            </label>
            <input
              className={styles.input}
              type="text"
              value={fullAddress}
              onChange={e => setFullAddress(e.target.value)}
              placeholder="e.g. Cusco, Peru"
            />
          </div>

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Adding…' : 'Add item'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
