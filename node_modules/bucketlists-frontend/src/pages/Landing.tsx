import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './Landing.module.css'
import BucketGraphic from '../components/BucketGraphic'

export default function Landing() {
  const [fill, setFill] = useState(0)

  useEffect(() => {
    const target = 62
    const duration = 1800
    const start = performance.now()
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setFill(Math.round(eased * target))
      if (t < 1) requestAnimationFrame(animate)
    }
    const id = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>BucketLists</span>
        <nav className={styles.nav}>
          <Link to="/login" className={styles.navLink}>Log in</Link>
          <Link to="/signup" className={styles.navCta}>Get started</Link>
        </nav>
      </header>

      <main className={styles.hero}>
        <div className={styles.heroDecor} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>For couples &amp; crews</p>
            <h1 className={styles.headline}>
              Adventures<br />worth<br />chasing.
            </h1>
            <p className={styles.subheadline}>
              Plan, vote on, and track bucket list experiences together —
              from weekend escapes to once-in-a-lifetime trips.
            </p>
            <div className={styles.ctas}>
              <Link to="/signup" className={styles.ctaPrimary}>Start your list</Link>
              <Link to="/login" className={styles.ctaSecondary}>Log in</Link>
            </div>
          </div>

          <div className={styles.bucketCard}>
            <BucketGraphic fillPercent={fill} size={210} />
          </div>
        </div>
      </main>

      <section className={styles.features}>
        <Feature
          number="01"
          title="Collaborative lists"
          description="Create a shared bucket and invite your group. Everyone can propose items and vote on what makes it in."
        />
        <Feature
          number="02"
          title="Vote together"
          description="Items need 50% approval — so only experiences everyone actually wants make the cut."
        />
        <Feature
          number="03"
          title="Track completion"
          description="Watch your bucket fill as you complete adventures. When done, restart with the unfinished ones."
        />
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} BucketLists</span>
      </footer>
    </div>
  )
}

function Feature({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <article className={styles.feature}>
      <span className={styles.featureNum}>{number}</span>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </article>
  )
}
