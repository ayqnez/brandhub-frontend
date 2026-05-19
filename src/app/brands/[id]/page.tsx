'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Brand, Product, ApiResponse } from '@/types';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import { useRealtimeRefetch } from '@/websocket/useRealtimeRefetch';
import { WS_EVENTS } from '@/websocket/events';
import s from './page.module.scss';

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ brand: Brand; products: Product[] }>>(`/brands/${id}`);
      setBrand(res.data.brand);
      setProducts(res.data.products);
    } catch {
      setBrand(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefetch([
    WS_EVENTS.BRAND_UPDATED,
    WS_EVENTS.BRAND_LOGO_UPDATED,
    WS_EVENTS.BRAND_DELETED,
    WS_EVENTS.PRODUCT_CREATED,
    WS_EVENTS.PRODUCT_UPDATED,
    WS_EVENTS.PRODUCT_DELETED,
    WS_EVENTS.PRODUCTS_REFRESH,
  ], load);

  if (loading) return <div className={s.loading}>Loading…</div>;
  if (!brand) return <div className={s.loading}>Brand not found.</div>;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.hero}>
          <div className={s.logoWrap}>
            {brand.logo
              ? <img src={brand.logo} alt={brand.name} />
              : <span>{brand.name[0]}</span>
            }
          </div>
          <div className={s.heroInfo}>
            <span className={s.cat}>{brand.category}</span>
            <h1>{brand.name}</h1>
            <p>{brand.description}</p>
            {brand.website && (
              <a href={brand.website} target="_blank" rel="noreferrer" className={s.website}>
                Visit website →
              </a>
            )}
          </div>
        </div>

        <div className={s.section}>
          <h2>Products</h2>
          {products.length === 0 ? (
            <p className={s.empty}>No products yet.</p>
          ) : (
            <div className={s.grid}>
              {products.map(p => (
                <div key={p._id} className={s.card}>
                  <Link href={`/products/${p._id}`} className={s.cardImg}>
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.title} />
                      : <span className={s.imgPlaceholder}>📦</span>
                    }
                  </Link>
                  <div className={s.cardBody}>
                    <Link href={`/products/${p._id}`}><h4>{p.title}</h4></Link>
                    <p className={s.price}>${p.price.toFixed(2)}</p>
                    {user?.role === 'customer' && p.isAvailable && (
                      <Button size="sm" onClick={() => add(p)}>Add to Cart</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
