'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, ApiResponse } from '@/types';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import { useRealtimeRefetch } from '@/websocket/useRealtimeRefetch';
import { WS_EVENTS } from '@/websocket/events';
import s from './page.module.scss';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
      setProduct(res.data.product);
      setActiveImg(0);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefetch([WS_EVENTS.PRODUCT_UPDATED, WS_EVENTS.PRODUCT_DELETED, WS_EVENTS.PRODUCTS_REFRESH], load);

  const handleAdd = () => {
    if (!product) return;
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) return <div className={s.loading}>Loading…</div>;
  if (!product) return <div className={s.loading}>Product not found.</div>;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.breadcrumb}>
          <Link href="/products">Products</Link>
          <span>›</span>
          {product.brand && <Link href={`/brands/${product.brand._id}`}>{product.brand.name}</Link>}
          <span>›</span>
          <span>{product.title}</span>
        </div>

        <div className={s.layout}>
          <div className={s.gallery}>
            <div className={s.mainImg}>
              {product.images[activeImg]
                ? <img src={product.images[activeImg]} alt={product.title} />
                : <span className={s.imgPlaceholder}>📦</span>
              }
            </div>
            {product.images.length > 1 && (
              <div className={s.thumbs}>
                {product.images.map((img, i) => (
                  <button key={i} className={`${s.thumb} ${i === activeImg ? s.active : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={s.info}>
            {product.brand && (
              <Link href={`/brands/${product.brand._id}`} className={s.brandLink}>
                {product.brand.name}
              </Link>
            )}
            <h1>{product.title}</h1>
            <p className={s.price}>${product.price.toFixed(2)}</p>
            <p className={s.desc}>{product.description}</p>

            <div className={s.meta}>
              <div className={s.metaItem}>
                <span>Category</span>
                <strong>{product.category}</strong>
              </div>
              <div className={s.metaItem}>
                <span>Stock</span>
                <strong>{product.stock} left</strong>
              </div>
              <div className={s.metaItem}>
                <span>Status</span>
                <strong className={product.isAvailable ? s.available : s.unavailable}>
                  {product.isAvailable ? 'Available' : 'Out of stock'}
                </strong>
              </div>
            </div>

            {product.tags.length > 0 && (
              <div className={s.tags}>
                {product.tags.map(t => <span key={t} className={s.tag}>{t}</span>)}
              </div>
            )}

            {user?.role === 'customer' && product.isAvailable && (
              <div className={s.addToCart}>
                <div className={s.qtyWrap}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
                </div>
                <Button size="lg" onClick={handleAdd} fullWidth>
                  {added ? '✓ Added!' : 'Add to Cart'}
                </Button>
              </div>
            )}

            {!user && (
              <p className={s.loginHint}>
                <Link href="/auth/login">Sign in</Link> to purchase this product.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
