'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, ApiResponse, Pagination } from '@/types';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { useRealtimeRefetch } from '@/websocket/useRealtimeRefetch';
import { WS_EVENTS } from '@/websocket/events';
import s from './page.module.scss';

function ProductsContent() {
  const sp = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(sp.get('category') || '');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const { add } = useCart();
  const { user } = useAuth();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '16', sort, order: 'desc' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const res = await api.get<ApiResponse<{ products: Product[]; pagination: Pagination }>>(`/products?${params}`);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [page, search, category, sort]);

  useEffect(() => { fetch(); }, [fetch]);
  useRealtimeRefetch([WS_EVENTS.PRODUCT_CREATED, WS_EVENTS.PRODUCT_UPDATED, WS_EVENTS.PRODUCT_DELETED, WS_EVENTS.PRODUCTS_REFRESH], fetch);

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <h1>All Products</h1>
          {pagination && <span className={s.count}>{pagination.total} items</span>}
        </div>

        <div className={s.controls}>
          <input
            className={s.search}
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <input
            className={s.search}
            placeholder="Filter by category…"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
          />
          <select
            className={s.sortSelect}
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
          >
            <option value="createdAt">Newest</option>
            <option value="price">Price</option>
          </select>
        </div>

        {loading ? (
          <div className={s.grid}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : (
          <>
            <div className={s.grid}>
              {products.map(product => (
                <div key={product._id} className={s.card}>
                  <Link href={`/products/${product._id}`} className={s.imgWrap}>
                    {product.images[0]
                      ? <img src={product.images[0]} alt={product.title} />
                      : <span className={s.imgPlaceholder}>📦</span>
                    }
                    {!product.isAvailable && <span className={s.outOfStock}>Out of Stock</span>}
                  </Link>
                  <div className={s.body}>
                    {product.brand && (
                      <Link href={`/brands/${product.brand._id}`} className={s.brandName}>
                        {product.brand.name}
                      </Link>
                    )}
                    <Link href={`/products/${product._id}`}><h3>{product.title}</h3></Link>
                    <div className={s.footer}>
                      <span className={s.price}>${product.price.toFixed(2)}</span>
                      {user?.role === 'customer' && product.isAvailable && (
                        <button className={s.addBtn} onClick={() => add(product)}>+</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && <div className={s.empty}>No products found.</div>}

            {pagination && pagination.pages > 1 && (
              <div className={s.pagination}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={s.pageBtn}>← Prev</button>
                <span className={s.pageInfo}>{page} / {pagination.pages}</span>
                <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className={s.pageBtn}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading…</div>}>
      <ProductsContent />
    </Suspense>
  );
}