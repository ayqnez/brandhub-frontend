import type { Metadata } from 'next';

import '@/styles/globals.css';

import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';

import Navbar from '@/components/layout/Navbar';

import SocketProvider from '@/websocket/SocketProvider';

export const metadata: Metadata = {
  title: 'BrandHub — Discover Independent Brands',
  description: 'Shop unique products from independent brands',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <Navbar />

              <main>{children}</main>
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}