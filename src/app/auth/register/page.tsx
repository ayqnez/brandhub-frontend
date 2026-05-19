'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import s from '../auth.module.scss';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' as 'customer' | 'brand' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      router.push(form.role === 'brand' ? '/dashboard' : '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.cardHeader}>
          <h1>Create account</h1>
          <p>Join BrandHub today</p>
        </div>

        {error && <div className={s.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} className={s.form}>
          <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Jane Smith" required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />

          <div className={s.roleGroup}>
            <p className={s.roleLabel}>I want to…</p>
            <div className={s.roleCards}>
              {(['customer', 'brand'] as const).map(r => (
                <label key={r} className={`${s.roleCard} ${form.role === r ? s.selected : ''}`}>
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={set('role')} />
                  <span className={s.roleIcon}>{r === 'customer' ? '🛍️' : '🏪'}</span>
                  <span className={s.roleName}>{r === 'customer' ? 'Shop products' : 'Sell products'}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" loading={loading} fullWidth size="lg">
            Create Account
          </Button>
        </form>

        <p className={s.switch}>
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
