import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styles from './BucketDetail.module.css'
import BucketGraphic from '../components/BucketGraphic'
import AddItemModal from '../components/AddItemModal'
import AddMemberModal from '../components/AddMemberModal'
import { getBucket, getBucketItems, getBucketMembers } from '../api/buckets'
import type { BucketDetail as BucketDetailType, Item, BucketMember, User } from '../types'

export default function BucketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const userJson = localStorage.getItem('user')
  const user: User | null = userJson ? JSON.parse(userJson) : null

  const [bucket, setBucket] = useState<BucketDetailType | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [members, setMembers] = useState<BucketMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  useEffect(() => {
    if (!token || !user) {
      navigate(`/login?next=/buckets/${id}`, { replace: true })
      return
    }
    Promise.all([
      getBucket(id!),
      getBucketItems(id!),
      getBucketMembers(id!),
    ])
      .then(([{ bucket }, { items }, { members }]) => {
        setBucket(bucket)
        setItems(items)
        setMembers(members)
      })
      .catch(() => navigate('/buckets', { replace: true }))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!token || !user) return null

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <Link to="/buckets" className={styles.logo}>BucketLists</Link>
        </nav>
        <main className={styles.main}>
          <p className={styles.loadingText}>Loading…</p>
        </main>
      </div>
    )
  }

  if (!bucket) return null

  const approvedItems = items.filter(i => i.status === 'approved')
  const pendingItems = items.filter(i => i.status === 'pending')

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const expiryLabel = bucket.expiration_date
    ? new Date(bucket.expiration_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

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
        <Link to="/buckets" className={styles.backLink}>← My Buckets</Link>

        <div className={styles.bucketHeader}>
          <div className={styles.bucketMeta}>
            <h1 className={styles.bucketName}>{bucket.name}</h1>
            {bucket.location && <p className={styles.bucketLocation}>{bucket.location}</p>}
            {expiryLabel && <p className={styles.bucketExpiry}>Ends {expiryLabel}</p>}
            <p className={styles.completionLabel}>{bucket.completion_pct}% complete</p>
          </div>
          <div className={styles.bucketGraphic}>
            <BucketGraphic fillPercent={bucket.completion_pct} size={100} />
          </div>
        </div>

        <div className={styles.twoCol}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Items</h2>
              <button className={styles.addBtn} onClick={() => setShowAddItem(true)}>+ Add item</button>
            </div>

            {approvedItems.length > 0 && (
              <div className={styles.itemGroup}>
                <p className={styles.itemGroupLabel}>Approved</p>
                <ul className={styles.itemList}>
                  {approvedItems.map(item => (
                    <li key={item.id} className={`${styles.itemRow}${item.is_completed ? ` ${styles.itemCompleted}` : ''}`}>
                      <span className={styles.itemCheck}>{item.is_completed ? '✓' : '○'}</span>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemImportance}>★ {item.importance}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingItems.length > 0 && (
              <div className={styles.itemGroup}>
                <p className={styles.itemGroupLabel}>Pending vote</p>
                <ul className={styles.itemList}>
                  {pendingItems.map(item => (
                    <li key={item.id} className={styles.itemRow}>
                      <span className={`${styles.itemCheck} ${styles.itemCheckPending}`}>?</span>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemImportance}>★ {item.importance}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {approvedItems.length === 0 && pendingItems.length === 0 && (
              <p className={styles.emptyNote}>No items yet. Add your first adventure!</p>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Members</h2>
              <button className={styles.addBtn} onClick={() => setShowAddMember(true)}>+ Add member</button>
            </div>

            <ul className={styles.memberList}>
              {members.map((m, i) => (
                <li key={m.user_id ?? `${m.email}-${i}`} className={styles.memberRow}>
                  <div className={styles.memberAvatar}>
                    {m.name ? m.name[0].toUpperCase() : '?'}
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{m.name ?? m.email}</span>
                    {m.name && <span className={styles.memberEmail}>{m.email}</span>}
                  </div>
                  <span className={`${styles.memberBadge} ${m.invite_status === 'pending' ? styles.badgePending : styles.badgeAccepted}`}>
                    {m.invite_status === 'pending' ? 'Invited' : 'Member'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      {showAddItem && (
        <AddItemModal
          bucketId={id!}
          onClose={() => setShowAddItem(false)}
          onCreated={newItem => {
            setItems(prev => [...prev, newItem])
            setShowAddItem(false)
          }}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          bucketId={id!}
          onClose={() => setShowAddMember(false)}
          onInvited={() => {
            getBucketMembers(id!).then(({ members }) => setMembers(members))
            setShowAddMember(false)
          }}
        />
      )}
    </div>
  )
}
