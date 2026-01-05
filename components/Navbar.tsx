'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Avatar from './Avatar';
import LanguageSwitcher, { useTranslation } from './LanguageSwitcher';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';

interface NavbarProps {
  cartItemCount?: number;
}

export default function Navbar({ cartItemCount = 0 }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/images/logo.jpg" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-800 hidden sm:block">Shop</span>
          </Link>

          {/* Center - Search and Links */}
          <div className="hidden md:flex items-center space-x-6 flex-1 max-w-2xl mx-8">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {/* Center Links */}
            <div className="flex items-center space-x-4">
              <Link
                href="/contact"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                {t('contact')}
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                {t('about')}
              </Link>
            </div>
          </div>

          {/* Right Section - Language, User & Cart */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Shopping Cart */}
            <div className="relative group">
              <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors block">
                <ShoppingCart className="h-6 w-6 text-gray-700" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>
              
              {/* Tooltip cu informații coș */}
              {cartItemCount > 0 && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800">
                      🛒 Coș de cumpărături
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {cartItemCount} {cartItemCount === 1 ? 'produs' : 'produse'}
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Click pentru a vizualiza
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                >
                  <Avatar user={user} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 {t('profileSettings')}
                    </Link>
                    <Link
                      href="/favorites"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ❤️ {t('favorites')}
                    </Link>
                    <Link
                      href="/reviews"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⭐ Recenziile Mele
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📦 {t('myOrders')}
                    </Link>
                    <Link
                      href="/my-cards"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      💳 Cardurile Mele
                    </Link>
                    <Link
                      href="/chat"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      💬 Chat & Mesagerie
                    </Link>
                    <Link
                      href="/vouchers"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎟️ {t('myVouchers')}
                    </Link>
                    <Link
                      href="/order-history"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📋 {t('orderHistory')}
                    </Link>
                    <Link
                      href="/invoices"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📄 Facturile Mele
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        <hr className="my-2" />
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-purple-600 font-semibold hover:bg-purple-50"
                        >
                          👨‍💼 {t('adminPanel')}
                        </Link>
                      </>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      🚪 {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('login')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {/* Mobile Links */}
            <div className="space-y-2">
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('contact')}
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('about')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
