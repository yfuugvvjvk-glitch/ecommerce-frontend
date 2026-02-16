'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider, useCart } from '@/lib/cart-context';
import { useTranslation } from '@/hooks/useTranslation';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { cartItemCount } = useCart();
  const { locale } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar cartItemCount={cartItemCount} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      <Footer key={locale} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <CartProvider>
      <DashboardContent>{children}</DashboardContent>
    </CartProvider>
  );
}
