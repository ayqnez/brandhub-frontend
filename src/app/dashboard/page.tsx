'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Brand, Product, ApiResponse } from '@/types';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FileUpload from '@/components/upload/FileUpload';
import { useRealtimeRefetch } from '@/websocket/useRealtimeRefetch';
import { WS_EVENTS } from '@/websocket/events';
import s from './page.module.scss';

const BRAND_CATEGORIES = ['fashion', 'electronics', 'food', 'beauty', 'sports', 'home', 'toys', 'books', 'other'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'brand' | 'products'>('brand');

  // Brand form
  const [brandForm, setBrandForm] = useState({ name: '', description: '', category: 'fashion', website: '' });
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [brandSuccess, setBrandSuccess] = useState('');

  // Product form
  const [productForm, setProductForm] = useState({ title: '', description: '', price: '', stock: '', category: '', tags: '' });
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (authLoading) return;
    if (!user || user.role !== 'brand') { router.push('/'); return; }

    setLoading(true);
    try {
      const [b, p] = await Promise.all([
        api.get<ApiResponse<{ brand: Brand }>>('/brands/my/dashboard').catch(() => null),
        api.get<ApiResponse<{ products: Product[] }>>('/products/my/products').catch(() => ({ data: { products: [] } })),
      ]);
      if (b) {
        setBrand(b.data.brand);
        setBrandForm({
          name: b.data.brand.name,
          description: b.data.brand.description,
          category: b.data.brand.category,
          website: b.data.brand.website || '',
        });
      }
      setProducts((p as ApiResponse<{ products: Product[] }>).data.products);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useRealtimeRefetch([
    WS_EVENTS.PRODUCT_CREATED,
    WS_EVENTS.PRODUCT_UPDATED,
    WS_EVENTS.PRODUCT_DELETED,
    WS_EVENTS.PRODUCTS_REFRESH,
    WS_EVENTS.BRAND_UPDATED,
    WS_EVENTS.BRAND_LOGO_UPDATED,
  ], fetchDashboard);

  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandLoading(true); setBrandError(''); setBrandSuccess('');
    try {
      if (brand) {
        const res = await api.patch<ApiResponse<{ brand: Brand }>>(`/brands/${brand._id}`, brandForm);
        setBrand(res.data.brand);
      } else {
        const res = await api.post<ApiResponse<{ brand: Brand }>>('/brands', brandForm);
        setBrand(res.data.brand);
      }
      setBrandSuccess('Saved successfully!');
    } catch (err: unknown) { setBrandError(err instanceof Error ? err.message : 'Error'); }
    finally { setBrandLoading(false); }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductLoading(true); setProductError('');
    const body = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      if (editingProduct) {
        const res = await api.patch<ApiResponse<{ product: Product }>>(`/products/${editingProduct._id}`, body);
        setProducts(ps => ps.map(p => p._id === editingProduct._id ? res.data.product : p));
      } else {
        const res = await api.post<ApiResponse<{ product: Product }>>('/products', body);
        setProducts(ps => [res.data.product, ...ps]);
      }
      setShowProductForm(false); setEditingProduct(null);
      setProductForm({ title: '', description: '', price: '', stock: '', category: '', tags: '' });
    } catch (err: unknown) { setProductError(err instanceof Error ? err.message : 'Error'); }
    finally { setProductLoading(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(ps => ps.filter(p => p._id !== id));
    } catch { /* noop */ }
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ title: p.title, description: p.description, price: String(p.price), stock: String(p.stock), category: p.category, tags: p.tags.join(', ') });
    setShowProductForm(true);
  };

  if (loading || authLoading) return <div className={s.loading}>Loading…</div>;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <div>
            <h1>Dashboard</h1>
            <p className={s.sub}>Manage your brand and products</p>
          </div>
          <div className={s.stats}>
            <div className={s.stat}><strong>{products.length}</strong><span>Products</span></div>
            <div className={s.stat}><strong>{brand?.totalSales ?? 0}</strong><span>Sales</span></div>
          </div>
        </div>

        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === 'brand' ? s.active : ''}`} onClick={() => setTab('brand')}>Brand Profile</button>
          <button className={`${s.tab} ${tab === 'products' ? s.active : ''}`} onClick={() => setTab('products')}>Products ({products.length})</button>
        </div>

        {tab === 'brand' && (
          <div className={s.section}>
            <h2>{brand ? 'Edit Brand' : 'Create Your Brand'}</h2>
            {brandError && <div className={s.errorAlert}>{brandError}</div>}
            {brandSuccess && <div className={s.successAlert}>{brandSuccess}</div>}
            {brand && (
              <div className={s.uploadBlock}>
                <h3>Brand logo</h3>
                {brand.logo && <img className={s.logoPreview} src={brand.logo} alt={brand.name} />}
                <FileUpload
                  endpoint="brandLogo"
                  label="Upload logo"
                  onUploaded={(urls) => {
                    const logo = urls[0];
                    if (logo) setBrand((prev) => prev ? { ...prev, logo } : prev);
                    fetchDashboard();
                  }}
                />
              </div>
            )}
            <form onSubmit={saveBrand} className={s.form}>
              <Input label="Brand Name" value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} required />
              <div className={s.fieldWrap}>
                <label className={s.fieldLabel}>Description</label>
                <textarea
                  className={s.textarea}
                  value={brandForm.description}
                  onChange={e => setBrandForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  required
                  minLength={10}
                />
              </div>
              <div className={s.fieldWrap}>
                <label className={s.fieldLabel}>Category</label>
                <select className={s.select} value={brandForm.category} onChange={e => setBrandForm(f => ({ ...f, category: e.target.value }))}>
                  {BRAND_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <Input label="Website (optional)" value={brandForm.website} onChange={e => setBrandForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" />
              <Button type="submit" loading={brandLoading} size="lg">{brand ? 'Save Changes' : 'Create Brand'}</Button>
            </form>
          </div>
        )}

        {tab === 'products' && (
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <h2>Products</h2>
              {brand && (
                <Button onClick={() => { setShowProductForm(true); setEditingProduct(null); setProductForm({ title: '', description: '', price: '', stock: '', category: '', tags: '' }); }}>
                  + Add Product
                </Button>
              )}
            </div>

            {!brand && <div className={s.noBrand}>Create your brand profile first to add products.</div>}

            {showProductForm && (
              <div className={s.productFormWrap}>
                <h3>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                {productError && <div className={s.errorAlert}>{productError}</div>}
                <form onSubmit={saveProduct} className={s.form}>
                  <Input label="Title" value={productForm.title} onChange={e => setProductForm(f => ({ ...f, title: e.target.value }))} required />
                  <div className={s.fieldWrap}>
                    <label className={s.fieldLabel}>Description</label>
                    <textarea className={s.textarea} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={3} required />
                  </div>
                  <div className={s.twoCol}>
                    <Input label="Price ($)" type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} required />
                    <Input label="Stock" type="number" min="0" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} required />
                  </div>
                  <Input label="Category" value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} required />
                  <Input label="Tags (comma-separated)" value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} placeholder="summer, casual, sale" />
                  <div className={s.formActions}>
                    <Button type="button" variant="secondary" onClick={() => { setShowProductForm(false); setEditingProduct(null); }}>Cancel</Button>
                    <Button type="submit" loading={productLoading}>{editingProduct ? 'Save' : 'Create'}</Button>
                  </div>
                </form>
              </div>
            )}

            <div className={s.productList}>
              {products.map(p => (
                <div key={p._id} className={s.productRow}>
                  <div className={s.productImg}>
                    {p.images[0] ? <img src={p.images[0]} alt={p.title} /> : <span>📦</span>}
                  </div>
                  <div className={s.productInfo}>
                    <p className={s.productTitle}>{p.title}</p>
                    <p className={s.productMeta}>{p.category} · Stock: {p.stock}</p>
                  </div>
                  <div className={s.productPrice}>${p.price.toFixed(2)}</div>
                  <span className={`${s.avail} ${p.isAvailable ? s.yes : s.no}`}>
                    {p.isAvailable ? 'Available' : 'Out of stock'}
                  </span>
                  <div className={s.productActions}>
                    <button className={s.editBtn} onClick={() => startEdit(p)}>Edit</button>
                    <button className={s.deleteBtn} onClick={() => deleteProduct(p._id)}>Delete</button>
                  </div>
                  <div className={s.inlineUpload}>
                    <FileUpload
                      endpoint="productImages"
                      productId={p._id}
                      multiple
                      label="Upload images"
                      onUploaded={() => fetchDashboard()}
                    />
                  </div>
                </div>
              ))}
              {products.length === 0 && !showProductForm && <p className={s.empty}>No products yet. Add your first!</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
