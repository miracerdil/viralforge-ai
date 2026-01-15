'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Ban, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import type { Dictionary } from '@/lib/i18n/getDictionary';

export default function DisabledPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      setUserEmail(user.email || null);

      // Check if user is actually disabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_disabled')
        .eq('id', user.id)
        .single();

      // If not disabled, redirect to dashboard
      if (!profile?.is_disabled) {
        router.push(`/${locale}/dashboard`);
      }
    };

    checkUser();
  }, [locale, router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  };

  if (!dictionary) {
    return null;
  }

  const t = dictionary.disabled;

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>

          <p className="text-gray-600 mb-6">{t.message}</p>

          {userEmail && (
            <p className="text-sm text-gray-500 mb-6">
              {t.loggedInAs}: <span className="font-medium">{userEmail}</span>
            </p>
          )}

          <div className="space-y-3">
            <a
              href={`mailto:support@viralforge.ai?subject=${encodeURIComponent(t.supportSubject)}`}
              className="w-full"
            >
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                {t.contactSupport}
              </Button>
            </a>

            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t.logout}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
