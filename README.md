# BrandHub Frontend

Next.js 14 frontend for the BrandHub API.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **CSS Modules** (`.module.scss`)
- No UI library dependencies

## Setup

```bash
npm install
cp .env.local .env.local   # already configured for localhost:5000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — categories, hero, CTA |
| `/brands` | Browse all brands with search & category filter |
| `/brands/[id]` | Brand detail + their products |
| `/products` | Browse all products with search, filter, sort |
| `/products/[id]` | Product detail with image gallery & add to cart |
| `/cart` | Cart + order checkout with delivery address |
| `/orders` | Order history (customer: own orders, brand: brand orders) |
| `/orders/[id]` | Order detail; brand can update status |
| `/dashboard` | Brand dashboard — manage brand profile & products |
| `/auth/login` | Login |
| `/auth/register` | Register (customer or brand role) |

## Auth & Roles

- JWT token stored in `localStorage`
- Two roles: `customer` (can browse, cart, order) and `brand` (dashboard, manage products/orders)
- Protected routes redirect to `/auth/login`

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
