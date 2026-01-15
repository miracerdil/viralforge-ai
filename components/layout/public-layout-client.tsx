'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from './header';
import { Footer } from './footer';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { User } from '@supabase/supabase-js';

interface PublicLayoutClientProps {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: string;
  initialUser: User | null;
}

export function PublicLayoutClient({
  children,
  dictionary,
  locale,
  initialUser,
}: PublicLayoutClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        dictionary={dictionary}
        locale={locale}
        user={user ? { email: user.email || '' } : null}
        onLogout={handleLogout}
        showDashboardButton={true}
      />
      <main className="flex-1">{children}</main>
      <Footer dictionary={dictionary} locale={locale} />
    </div>
  );
}
