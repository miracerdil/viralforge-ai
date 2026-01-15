'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface HeaderProps {
  dictionary: Dictionary;
  locale: string;
  user?: { email: string } | null;
  onLogout?: () => void;
  showDashboardButton?: boolean; // Show "Panel" CTA button on right side (for public pages only)
}

export function Header({ dictionary, locale, user, onLogout, showDashboardButton = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = dictionary;

  const isActive = (path: string) => pathname === path;

  const navItems = user
    ? [
        { href: `/${locale}/dashboard`, label: t.nav.dashboard },
        { href: `/${locale}/planner`, label: t.nav.planner },
        { href: `/${locale}/hooks`, label: t.nav.hooks },
        { href: `/${locale}/rewards`, label: t.nav.rewards },
        { href: `/${locale}/abtest`, label: t.nav.abtest },
        { href: `/${locale}/account`, label: t.nav.account || (locale === 'tr' ? 'Hesabım' : 'Account') },
      ]
    : [
        { href: `/${locale}`, label: t.nav.home },
        { href: `/${locale}/pricing`, label: t.nav.pricing },
      ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">{t.common.appName}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-3">
                {showDashboardButton && (
                  <Link href={`/${locale}/dashboard`}>
                    <Button size="sm">{t.nav.dashboard}</Button>
                  </Link>
                )}
                <NotificationBell locale={locale} />
                <Button variant="outline" size="sm" onClick={onLogout}>
                  {t.nav.logout}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" size="sm">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href={`/${locale}/signup`}>
                  <Button size="sm">{t.nav.signup}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  {showDashboardButton && (
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      {t.nav.dashboard}
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-left text-gray-600 hover:bg-gray-50"
                  >
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    {t.nav.signup}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
