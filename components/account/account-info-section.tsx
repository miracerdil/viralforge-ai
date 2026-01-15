'use client';

import { User, Mail, Building2, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface Profile {
  id: string;
  email: string;
  name?: string;
  plan: string;
  category_group?: string;
}

interface AccountInfoSectionProps {
  profile: Profile | null;
  locale: string;
  dictionary: Dictionary;
  onLogout: () => void;
}

export function AccountInfoSection({
  profile,
  locale,
  dictionary,
  onLogout,
}: AccountInfoSectionProps) {
  const t = dictionary.account || {};

  const accountTypes: Record<string, { tr: string; en: string }> = {
    creator: { tr: 'İçerik Üretici', en: 'Creator' },
    business: { tr: 'İşletme', en: 'Business' },
  };

  const accountType = profile?.category_group || 'creator';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-500" />
          <span>{t.accountInfo || (locale === 'tr' ? 'Hesap Bilgileri' : 'Account Info')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">
              {t.email || (locale === 'tr' ? 'E-posta' : 'Email')}
            </p>
            <p className="font-medium text-gray-900">{profile?.email || '-'}</p>
          </div>
        </div>

        {/* Account Type */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Building2 className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">
              {t.accountType || (locale === 'tr' ? 'Hesap Türü' : 'Account Type')}
            </p>
            <p className="font-medium text-gray-900">
              {accountTypes[accountType]?.[locale as 'tr' | 'en'] || accountType}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t.logout || (locale === 'tr' ? 'Çıkış Yap' : 'Log Out')}
        </Button>
      </CardContent>
    </Card>
  );
}
