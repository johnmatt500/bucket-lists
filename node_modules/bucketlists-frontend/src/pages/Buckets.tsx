import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Buckets.module.css'
import BucketGraphic from '../components/BucketGraphic'
import BucketTile from '../components/BucketTile'
import CreateBucketModal from '../components/CreateBucketModal'
import { listBuckets } from '../api/buckets'
import type { Bucket, User } from '../types'

export default function Buckets() {
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const userJson = localStorage.getItem('user')
  const user: User | null = userJson ? JSON.parse(userJson) : null

  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loadingBuckets, setLoadingBuckets] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true })
      return
    }
    listBuckets()
      .then(({ buckets }) => setBuckets(buckets))
      .catch(console.error)
      .finally(() => setLoadingBuckets(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!token || !user) return null

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>BucketLists</Link>
        <div className={styles.navRight}>
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.userName}>{user.name}</span>
          <button className={styles.logout} onClick={handleLogout}>Log out</button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Buckets</h1>
          <button className={styles.newBucket} onClick={() => setShowModal(true)}>+ New bucket</button>
        </div>

        {!loadingBuckets && buckets.length > 0 && (
          <div className={styles.grid}>
            {buckets.map(b => <BucketTile key={b.id} bucket={b} onClick={() => navigate(`/buckets/${b.id}`)} />)}
          </div>
        )}

        {!loadingBuckets && buckets.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyGraphic}>
              <BucketGraphic fillPercent={0} size={140} />
            </div>
            <h2 className={styles.emptyTitle}>Your adventure list awaits</h2>
            <p className={styles.emptyBody}>
              Create your first bucket — a shared space where you and your crew
              can plan, vote, and check off experiences together.
            </p>
            <button className={styles.emptyAction} onClick={() => setShowModal(true)}>
              Start a bucket
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <CreateBucketModal
          onClose={() => setShowModal(false)}
          onCreated={newBucket => {
            setBuckets(prev => [newBucket, ...prev])
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
