'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ApiResponse, Order } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import s from './page.module.scss';

interface Address { street: string; city: string; country: string; postalCode: string; phone: string; }

const emptyAddr: Address = { street: '', city: '', country: '', postalCode: '', phone: '' };

export default function CartPage() {
  const { items, remove, update, clear, total } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [addr, setAddr] = useState<Address>(emptyAddr);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setA = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr(a => ({ ...a, [k]: e.target.value }));

  const handleOrder = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<{ order: Order }>>('/orders', {
        items: items.map(i => ({ product: i.product._id, quantity: i.quantity })),
        deliveryAddress: addr,
        notes,
      });
      clear();
      router.push(`/orders/${res.data.order._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={s.empty}>
        <div className={s.emptyInner}>
          <span className={s.emptyIcon}>🛒</span>
          <h2>Your cart is empty</h2>
          <p>Browse our products and add something you love.</p>
          <Link href="/products"><Button size="lg">Browse Products</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <h1>Your Cart</h1>

        <div className={s.layout}>
          <div className={s.items}>
            {items.map(({ product, quantity }) => (
              <div key={product._id} className={s.item}>
                <div className={s.itemImg}>
                  {product.images[0]
                    ? <img src={product.images[0]} alt={product.title} />
                    : <span>📦</span>
                  }
                </div>
                <div className={s.itemInfo}>
                  <Link href={`/products/${product._id}`}><h4>{product.title}</h4></Link>
                  <p>${product.price.toFixed(2)}</p>
                </div>
                <div className={s.itemQty}>
                  <button onClick={() => update(product._id, quantity - 1)}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => update(product._id, quantity + 1)}>+</button>
                </div>
                <div className={s.itemTotal}>${(product.price * quantity).toFixed(2)}</div>
                <button className={s.removeBtn} onClick={() => remove(product._id)}>✕</button>
              </div>
            ))}
          </div>

          <div className={s.sidebar}>
            <div className={s.summary}>
              <h3>Order Summary</h3>
              <div className={s.summaryRow}>
                <span>Subtotal</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
              <div className={`${s.summaryRow} ${s.totalRow}`}>
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>

            <div className={s.addressForm}>
              <h3>Delivery Address</h3>
              <Input label="Street" value={addr.street} onChange={setA('street')} placeholder="123 Main St" required />
              <Input label="City" value={addr.city} onChange={setA('city')} placeholder="New York" required />
              <Input label="Country" value={addr.country} onChange={setA('country')} placeholder="USA" required />
              <Input label="Postal Code" value={addr.postalCode} onChange={setA('postalCode')} placeholder="10001" required />
              <Input label="Phone" value={addr.phone} onChange={setA('phone')} placeholder="+1 555 0100" required />
              <div>
                <label className={s.notesLabel}>Notes (optional)</label>
                <textarea
                  className={s.notesArea}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Leave at door…"
                  rows={3}
                />
              </div>
            </div>

            {error && <div className={s.errorAlert}>{error}</div>}

            <Button
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleOrder}
              disabled={!addr.street || !addr.city || !addr.country || !addr.postalCode || !addr.phone}
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
