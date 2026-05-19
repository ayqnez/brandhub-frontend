'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import FileUpload from '@/components/upload/FileUpload';
import s from './page.module.scss';

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  if (loading) return <div className={s.page}>Loading…</div>;
  if (!user) return null;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.card}>
          <div className={s.header}>
            <div className={s.avatar}>
              {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name[0].toUpperCase()}
            </div>
            <div className={s.meta}>
              <h1>{user.name}</h1>
              <p>{user.email}</p>
              <p>Role: {user.role}</p>
            </div>
          </div>

          <div className={s.section}>
            <h2>Profile avatar</h2>
            <FileUpload
              endpoint="userAvatar"
              label="Upload avatar"
              onUploaded={(urls) => {
                const avatar = urls[0];
                if (avatar) updateUser({ ...user, avatar });
                setMessage('Avatar updated successfully.');
              }}
            />
            {message && <div className={s.alert}>{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
