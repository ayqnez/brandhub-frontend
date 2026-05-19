'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { socketClient } from '@/websocket/socket';
import { WS_EVENTS } from '@/websocket/events';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [live, setLive] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const handleStatus = (connected: boolean) => setLive(connected);
    const handleOnline = (payload: { count?: number; userIds?: string[] }) => {
      setOnlineCount(payload.count ?? payload.userIds?.length ?? 0);
    };

    socketClient.onStatus(handleStatus);
    socketClient.on(WS_EVENTS.ONLINE_USERS, handleOnline);

    return () => {
      socketClient.offStatus(handleStatus);
      socketClient.off(WS_EVENTS.ONLINE_USERS, handleOnline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Brand<span>Hub</span>
        </Link>

        <div className={styles.links}>
          <Link href="/brands" className={`${styles.link} ${pathname.startsWith('/brands') ? styles.active : ''}`}>
            Brands
          </Link>
          <Link href="/products" className={`${styles.link} ${pathname.startsWith('/products') ? styles.active : ''}`}>
            Products
          </Link>
          {user?.role === 'brand' && (
            <Link href="/dashboard" className={`${styles.link} ${pathname.startsWith('/dashboard') ? styles.active : ''}`}>
              Dashboard
            </Link>
          )}
          {user && (
            <Link href="/orders" className={`${styles.link} ${pathname.startsWith('/orders') ? styles.active : ''}`}>
              Orders
            </Link>
          )}
        </div>

        <div className={styles.right}>
          {user && (
            <span className={`${styles.liveBadge} ${live ? styles.live : styles.offline}`}>
              {live ? 'Live' : 'Offline'} · {onlineCount} online
            </span>
          )}

          {user?.role === 'customer' && (
            <Link href="/cart" className={styles.cartBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Cart
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </Link>
          )}

          {user ? (
            <div className={styles.userMenu}>
              <Link href="/profile" className={styles.profileLink}>
                <div className={styles.avatar}>
                  {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name[0].toUpperCase()}
                </div>
                <span className={styles.userName}>{user.name}</span>
              </Link>
              <button className={styles.logoutBtn} onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className={`${styles.authBtn} ${styles.outline}`}>Log in</Link>
              <Link href="/auth/register" className={`${styles.authBtn} ${styles.solid}`}>Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
