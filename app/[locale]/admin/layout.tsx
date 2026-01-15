'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Users,
  ArrowLeft,
  LayoutDashboard,
  ToggleLeft,
  DollarSign,
  BarChart3,
  Bell,
  Settings,
  ChevronRight,
  HelpCircle,
  Bug,
  MessageSquare,
  Compass,
  Gift,
  Handshake
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      // Check admin status via API (server-side verification)
      try {
        const response = await fetch('/api/admin/users?page=1');
        if (response.status === 403 || response.status === 401) {
          router.push(`/${locale}/dashboard`);
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        router.push(`/${locale}/dashboard`);
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [locale, router, supabase.auth]);

  if (loading || !dictionary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const t = dictionary;

  const navItems: NavItem[] = [
    {
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
      label: locale === 'tr' ? 'Genel Bakış' : 'Overview',
    },
    {
      href: `/${locale}/admin/lifecycle`,
      icon: BarChart3,
      label: locale === 'tr' ? 'Yaşam Döngüsü' : 'Lifecycle Funnel',
    },
    {
      href: `/${locale}/admin/feature-flags`,
      icon: ToggleLeft,
      label: locale === 'tr' ? 'Özellik Bayrakları' : 'Feature Flags',
    },
    {
      href: `/${locale}/admin/ai-costs`,
      icon: DollarSign,
      label: locale === 'tr' ? 'AI Maliyetleri' : 'AI Costs',
    },
    {
      href: `/${locale}/admin/users`,
      icon: Users,
      label: t.admin.users,
    },
    {
      href: `/${locale}/admin/notifications`,
      icon: Bell,
      label: locale === 'tr' ? 'Bildirimler' : 'Notifications',
    },
    {
      href: `/${locale}/admin/help`,
      icon: HelpCircle,
      label: locale === 'tr' ? 'Yardım Merkezi' : 'Help Center',
    },
    {
      href: `/${locale}/admin/bugs`,
      icon: Bug,
      label: locale === 'tr' ? 'Hata Raporları' : 'Bug Reports',
    },
    {
      href: `/${locale}/admin/feedback`,
      icon: MessageSquare,
      label: locale === 'tr' ? 'Geri Bildirim' : 'Feedback',
    },
    {
      href: `/${locale}/admin/onboarding`,
      icon: Compass,
      label: locale === 'tr' ? 'Onboarding' : 'Onboarding',
    },
    {
      href: `/${locale}/admin/referrals`,
      icon: Gift,
      label: locale === 'tr' ? 'Referanslar' : 'Referrals',
    },
    {
      href: `/${locale}/admin/affiliates`,
      icon: Handshake,
      label: locale === 'tr' ? 'Affiliates' : 'Affiliates',
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/dashboard`}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">{t.nav.dashboard}</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-400" />
                <span className="font-semibold">{t.admin.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary-600")} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight className="w-4 h-4 text-primary-400" />}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
