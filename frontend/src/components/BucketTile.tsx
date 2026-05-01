import styles from './BucketTile.module.css'
import BucketGraphic from './BucketGraphic'
import type { Bucket } from '../types'

interface Props {
  bucket: Bucket
  onClick?: () => void
}

export default function BucketTile({ bucket, onClick }: Props) {
  const expiryLabel = bucket.expiration_date
    ? new Date(bucket.expiration_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null

  return (
    <article
      className={styles.tile}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {expiryLabel && <span className={styles.expiryBadge}>{expiryLabel}</span>}
      <div className={styles.tileInner}>
        <div className={styles.content}>
          <p className={styles.name}>{bucket.name}</p>
          {bucket.location && <p className={styles.location}>{bucket.location}</p>}
        </div>
        <div className={styles.graphic}>
          <BucketGraphic fillPercent={bucket.completion_pct} size={80} />
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.completionPct}>{bucket.completion_pct}% complete</span>
        <span className={styles.memberCount}>
          {bucket.member_count} {bucket.member_count === 1 ? 'member' : 'members'}
        </span>
      </div>
    </article>
  )
}
