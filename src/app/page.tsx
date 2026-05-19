import Link from 'next/link';
import styles from './page.module.scss';

const CATEGORIES = ['fashion', 'electronics', 'food', 'beauty', 'sports', 'home', 'toys', 'books', 'other'];

const CAT_ICONS: Record<string, string> = {
  fashion: '👗', electronics: '⚡', food: '🍽️', beauty: '✨',
  sports: '🏃', home: '🏠', toys: '🎮', books: '📚', other: '🌀',
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Discover Independent Brands</p>
          <h1 className={styles.headline}>
            Shop from brands<br />
            <em>that actually care</em>
          </h1>
          <p className={styles.sub}>
            BrandHub connects you with independent creators and artisans.
            Find unique products, support small businesses, and shop with purpose.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products" className={styles.heroCta}>Browse Products</Link>
            <Link href="/brands" className={styles.heroSecondary}>See All Brands →</Link>
          </div>
        </div>
        <div className={styles.heroDecor}>
          <div className={styles.decorCircle} />
          <div className={styles.decorDot} />
        </div>
      </section>

      <section className={styles.categories}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <div className={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <Link key={cat} href={`/products?category=${cat}`} className={styles.catCard}>
                <span className={styles.catIcon}>{CAT_ICONS[cat]}</span>
                <span className={styles.catName}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Are you a brand?</h2>
          <p>Join BrandHub, list your products, and reach thousands of conscious shoppers.</p>
          <Link href="/auth/register" className={styles.heroCta}>Start Selling</Link>
        </div>
      </section>
    </div>
  );
}
