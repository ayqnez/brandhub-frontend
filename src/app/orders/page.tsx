'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';

import { Order, ApiResponse, Pagination } from '@/types';

import { useAuth } from '@/lib/auth';

import { useOrderSocket } from '@/websocket/useOrderSocket';

import s from './page.module.scss';

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const endpoint = user.role === 'brand' ? '/orders/brand' : '/orders/my';

    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ orders: Order[]; pagination: Pagination }>>(endpoint);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /*
   |--------------------------------------------------------------------------
   | WebSocket realtime updates
   |--------------------------------------------------------------------------
   */

  useOrderSocket({
    onNewOrder: (payload: { order?: Order }) => {
      if (user?.role !== 'brand') return;
      const newOrder = payload.order;
      if (!newOrder) { fetchOrders(); return; }

      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
    },

    onOrderCreated: (payload: { order?: Order }) => {
      if (!payload.order) { fetchOrders(); return; }
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === payload.order!._id);
        if (exists) return prev;
        return [payload.order!, ...prev];
      });
    },

    onStatusUpdated: ({ orderId, status, order }: { orderId: string; status: Order['status']; order?: Order }) => {
      setOrders((prev) => prev.map((item) => item._id === orderId ? (order || { ...item, status }) : item));
    },
  });

  if (loading || authLoading) {
    return (
      <div className={s.loading}>
        Loading…
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <h1>
          {user?.role === 'brand'
            ? 'Brand Orders'
            : 'My Orders'}
        </h1>

        {orders.length === 0 ? (
          <div className={s.empty}>
            <span>📋</span>

            <p>No orders yet.</p>

            {user?.role === 'customer' && (
              <Link href="/products">
                Start shopping →
              </Link>
            )}
          </div>
        ) : (
          <div className={s.list}>
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className={s.card}
              >
                <div className={s.cardTop}>
                  <div>
                    <p className={s.orderId}>
                      #
                      {order._id
                        .slice(-8)
                        .toUpperCase()}
                    </p>

                    <p className={s.date}>
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`${s.status} ${s[
                      STATUS_COLORS[
                      order.status
                      ] || 'info'
                      ]
                      }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className={s.cardItems}>
                  {order.items
                    .slice(0, 3)
                    .map((item, i) => (
                      <div
                        key={i}
                        className={s.orderItem}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                          />
                        ) : (
                          <span>📦</span>
                        )}

                        <span>
                          {item.title} ×
                          {item.quantity}
                        </span>
                      </div>
                    ))}

                  {order.items.length > 3 && (
                    <span className={s.more}>
                      +
                      {order.items.length -
                        3}{' '}
                      more
                    </span>
                  )}
                </div>

                <div className={s.cardBottom}>
                  <span className={s.total}>
                    $
                    {order.totalPrice.toFixed(
                      2
                    )}
                  </span>

                  <span className={s.viewLink}>
                    View details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}