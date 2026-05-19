'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Brand, ApiResponse, Pagination } from '@/types';
import { useRealtimeRefetch } from '@/websocket/useRealtimeRefetch';
import { WS_EVENTS } from '@/websocket/events';
import s from './page.module.scss';

const CATEGORIES = ['all', 'fashion', 'electronics', 'food', 'beauty', 'sports', 'home', 'toys', 'books', 'other'];

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const res = await api.get<ApiResponse<{ brands: Brand[]; pagination: Pagination }>>(`/brands?${params}`);
      setBrands(res.data.brands);
      setPagination(res.data.pagination);
    } catch { /* noop */ } finally { setLoading(false); }
  }, [page, category, search]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <h1>All Brands</h1>
          <input
            className={s.search}
            placeholder="Search brands…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className={s.filters}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${s.filterBtn} ${category === c ? s.active : ''}`}
              onClick={() => { setCategory(c); setPage(1); }}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={s.loadingGrid}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : (
          <>
            <div className={s.grid}>
              {brands.map(brand => (
                <Link key={brand._id} href={`/brands/${brand._id}`} className={s.card}>
                  <div className={s.logoWrap}>
                    {brand.logo
                      ? <img src={brand.logo} alt={brand.name} />
                      : <span className={s.logoPlaceholder}>{brand.name[0]}</span>
                    }
                  </div>
                  <div className={s.info}>
                    <h3>{brand.name}</h3>
                    <p className={s.desc}>{brand.description}</p>
                    <div className={s.meta}>
                      <span className={s.tag}>{brand.category}</span>
                      {brand.website && <span className={s.website}>🔗 Website</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {brands.length === 0 && (
              <div className={s.empty}>
                <p>No brands found</p>
              </div>
            )}

            {pagination && pagination.pages > 1 && (
              <div className={s.pagination}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={s.pageBtn}>← Prev</button>
                <span className={s.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
                <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className={s.pageBtn}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
