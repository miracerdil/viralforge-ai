'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dictionary
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });

    // Check auth
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      setUser({ email: user.email || '' });
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push(`/${locale}/login`);
      } else if (session?.user) {
        setUser({ email: session.user.email || '' });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [locale, router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  if (loading || !dictionary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header dictionary={dictionary} locale={locale} user={user} onLogout={handleLogout} />
      <main className="flex-1">{children}</main>
      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
