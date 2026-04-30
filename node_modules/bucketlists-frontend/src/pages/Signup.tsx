import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Signup.module.css'
import { signup } from '../api/auth'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!confirm) e.confirm = 'Please confirm your password'
    else if (confirm !== password) e.confirm = 'Passwords do not match'
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
      const { token, user } = await signup(name.trim(), email.trim(), password)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/buckets')
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>BucketLists</Link>
        <Link to="/login" className={styles.headerLogin}>Log in</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>Start planning adventures together.</p>
          </div>

          {serverError && (
            <div className={styles.serverError} role="alert">{serverError}</div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Field label="Name" error={errors.name}>
              <input
                className={`${styles.input}${errors.name ? ` ${styles.inputError}` : ''}`}
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>

            <Field label="Email" error={errors.email}>
              <input
                className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ''}`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <input
                className={`${styles.input}${errors.password ? ` ${styles.inputError}` : ''}`}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </Field>

            <Field label="Confirm password" error={errors.confirm}>
              <input
                className={`${styles.input}${errors.confirm ? ` ${styles.inputError}` : ''}`}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
            </Field>

            <button
              type="submit"
              className={styles.submit}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Get started'}
            </button>
          </form>

          <p className={styles.loginPrompt}>
            Already have an account?{' '}
            <Link to="/login" className={styles.loginLink}>Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <span className={styles.fieldError} role="alert">{error}</span>}
    </div>
  )
}
