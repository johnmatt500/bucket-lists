import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styles from './Invite.module.css'
import { getInvitation, acceptInvitation } from '../api/buckets'
import type { Invitation, User } from '../types'

type Status = 'loading' | 'found' | 'notFound' | 'alreadyAccepted' | 'accepting' | 'accepted' | 'error'

export default function Invite() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [serverError, setServerError] = useState('')

  const authToken = localStorage.getItem('token')
  const userJson = localStorage.getItem('user')
  const currentUser: User | null = userJson ? JSON.parse(userJson) : null

  useEffect(() => {
    getInvitation(token!)
      .then(({ invitation }) => {
        setInvitation(invitation)
        setStatus(invitation.accepted_at ? 'alreadyAccepted' : 'found')
      })
      .catch(() => setStatus('notFound'))
  }, [token])

  async function handleAccept() {
    if (!authToken) {
      navigate(`/login?next=/invite/${token}`)
      return
    }
    setStatus('accepting')
    try {
      await acceptInvitation(token!)
      setStatus('accepted')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      if (msg.includes('Already a member')) {
        setStatus('accepted')
        return
      }
      setServerError(msg)
      setStatus('error')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>BucketLists</Link>
      </header>

      <main className={styles.main}>
        {status === 'loading' && (
          <p className={styles.loadingText}>Loading invitation…</p>
        )}

        {status === 'notFound' && (
          <div className={styles.card}>
            <h1 className={styles.title}>Invitation not found</h1>
            <p className={styles.subtitle}>This link may have expired or been removed.</p>
            <Link to="/" className={styles.backLink}>← Back to home</Link>
          </div>
        )}

        {status === 'alreadyAccepted' && (
          <div className={styles.card}>
            <h1 className={styles.title}>Already accepted</h1>
            <p className={styles.subtitle}>This invitation has already been used.</p>
            {currentUser
              ? <Link to="/buckets" className={styles.primaryLink}>Go to My Buckets →</Link>
              : <Link to="/" className={styles.backLink}>← Back to home</Link>
            }
          </div>
        )}

        {invitation && ['found', 'accepting', 'accepted', 'error'].includes(status) && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h1 className={styles.title}>You've been invited</h1>
              <p className={styles.subtitle}>Join a shared adventure list.</p>
            </div>

            <div className={styles.bucketInfo}>
              <p className={styles.infoLabel}>Bucket</p>
              <p className={styles.bucketName}>{invitation.bucket_name}</p>
              <p className={styles.inviterLine}>Invited by {invitation.inviter_name}</p>
            </div>

            {serverError && (
              <div className={styles.serverError} role="alert">{serverError}</div>
            )}

            {status === 'accepted' && (
              <div className={styles.successState}>
                <p className={styles.successMsg}>
                  You've joined <strong>{invitation.bucket_name}</strong>!
                </p>
                <Link to="/buckets" className={styles.primaryLink}>Go to My Buckets →</Link>
              </div>
            )}

            {(status === 'found' || status === 'accepting') && currentUser && (
              <div className={styles.actions}>
                <button
                  className={styles.acceptBtn}
                  onClick={handleAccept}
                  disabled={status === 'accepting'}
                >
                  {status === 'accepting' ? 'Joining…' : 'Accept invitation'}
                </button>
              </div>
            )}

            {status === 'found' && !currentUser && (
              <div className={styles.actions}>
                <p className={styles.authPrompt}>Sign in to accept this invitation.</p>
                <Link to={`/login?next=/invite/${token}`} className={styles.acceptBtn}>
                  Log in to accept
                </Link>
                <Link to={`/signup?next=/invite/${token}`} className={styles.secondaryBtn}>
                  Sign up to accept
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className={styles.actions}>
                <button className={styles.acceptBtn} onClick={handleAccept}>Try again</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
