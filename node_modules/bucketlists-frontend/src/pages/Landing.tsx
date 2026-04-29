import { Link } from 'react-router-dom'
import styles from './Landing.module.css'
import BucketGraphic from '../components/BucketGraphic'

export default function Landing() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>BucketLists</span>
        <nav className={styles.nav}>
          <Link to="/login" className={styles.navLink}>Log in</Link>
          <Link to="/signup" className={styles.navCta}>Sign up free</Link>
        </nav>
      </header>

      <main className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.headline}>
            Your shared adventures,<br />beautifully tracked.
          </h1>
          <p className={styles.subheadline}>
            BucketLists helps couples and groups plan, vote on, and complete
            bucket list experiences together — from weekend getaways to
            once-in-a-lifetime trips.
          </p>
          <div className={styles.ctas}>
            <Link to="/signup" className={styles.ctaPrimary}>Get started</Link>
            <Link to="/login" className={styles.ctaSecondary}>Log in</Link>
          </div>
        </div>

        <div className={styles.heroGraphic}>
          <BucketGraphic fillPercent={62} />
        </div>
      </main>

      <section className={styles.features}>
        <Feature
          title="Collaborative lists"
          description="Create a shared bucket and invite your group. Everyone can propose items and vote on what makes it in."
        />
        <Feature
          title="Vote together"
          description="Items are put to a vote. 50% approval gets it on the list — so only the things everyone wants make the cut."
        />
        <Feature
          title="Track completion"
          description="Watch your bucket fill up as you complete experiences. When you're done, restart with the leftovers."
        />
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} BucketLists</p>
      </footer>
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.feature}>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </div>
  )
}
