'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Order, ApiResponse } from '@/types';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import { useOrderSocket } from '@/websocket/useOrderSocket';
import s from './page.module.scss';

const STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'error',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { router.push('/auth/login'); return; }
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ order: Order }>>(`/orders/${id}`);
      setOrder(res.data.order);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, user, router]);

  useEffect(() => { load(); }, [load]);

  useOrderSocket({
    onStatusUpdated: ({ orderId, order, status }: { orderId: string; order?: Order; status: Order['status'] }) => {
      if (orderId !== id) return;
      setOrder((prev) => order || (prev ? { ...prev, status } : prev));
    },
  });

  const updateStatus = async (status: string) => {
    setUpdating(true);
    setError('');
    try {
      const res = await api.patch<ApiResponse<{ order: Order }>>(`/orders/${id}/status`, { status });
      setOrder(res.data.order);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className={s.loading}>Loading…</div>;
  if (!order) return <div className={s.loading}>Order not found.</div>;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <div>
            <Link href="/orders" className={s.back}>← Back to orders</Link>
            <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p className={s.date}>{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`${s.status} ${s[STATUS_COLORS[order.status] || 'info']}`}>
            {order.status}
          </span>
        </div>

        <div className={s.layout}>
          <div>
            <div className={s.section}>
              <h3>Items</h3>
              <div className={s.items}>
                {order.items.map((item, i) => (
                  <div key={i} className={s.item}>
                    <div className={s.itemImg}>
                      {item.image ? <img src={item.image} alt={item.title} /> : <span>📦</span>}
                    </div>
                    <div className={s.itemInfo}>
                      <p className={s.itemTitle}>{item.title}</p>
                      <p className={s.itemSub}>Qty: {item.quantity} · ${item.price.toFixed(2)} each</p>
                    </div>
                    <p className={s.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className={s.totalRow}>
                <span>Total</span>
                <strong>${order.totalPrice.toFixed(2)}</strong>
              </div>
            </div>

            {user?.role === 'brand' && (
              <div className={s.section}>
                <h3>Update Status</h3>
                {error && <div className={s.errorAlert}>{error}</div>}
                <div className={s.statusBtns}>
                  {STATUSES.map(st => (
                    <button
                      key={st}
                      className={`${s.statusBtn} ${order.status === st ? s.active : ''}`}
                      onClick={() => updateStatus(st)}
                      disabled={updating || order.status === st}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className={s.section}>
              <h3>Delivery Address</h3>
              <div className={s.address}>
                <p>{order.deliveryAddress.street}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.postalCode}</p>
                <p>{order.deliveryAddress.country}</p>
                <p>{order.deliveryAddress.phone}</p>
              </div>
            </div>

            <div className={s.section}>
              <h3>Customer</h3>
              <div className={s.customer}>
                <p className={s.custName}>{order.user.name}</p>
                <p className={s.custEmail}>{order.user.email}</p>
              </div>
            </div>

            {order.notes && (
              <div className={s.section}>
                <h3>Notes</h3>
                <p className={s.notes}>{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
