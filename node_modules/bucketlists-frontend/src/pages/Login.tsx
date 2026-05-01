import { useState, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styles from './Login.module.css'
import { login } from '../api/auth'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
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
      const { token, user } = await login(email.trim(), password)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate(next ?? '/buckets')
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
        <Link to="/signup" className={styles.headerSignup}>Sign up</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Good to see you again.</p>
          </div>

          {serverError && (
            <div className={styles.serverError} role="alert">{serverError}</div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Field label="Email" error={errors.email}>
              <input
                className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ''}`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <input
                className={`${styles.input}${errors.password ? ` ${styles.inputError}` : ''}`}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </Field>

            <button
              type="submit"
              className={styles.submit}
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className={styles.signupPrompt}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.signupLink}>Sign up</Link>
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
