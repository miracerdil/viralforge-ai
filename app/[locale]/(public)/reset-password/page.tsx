'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  const t = {
    title: locale === 'tr' ? 'Yeni Şifre Belirle' : 'Set New Password',
    subtitle: locale === 'tr'
      ? 'Yeni şifrenizi girin.'
      : 'Enter your new password.',
    password: locale === 'tr' ? 'Yeni Şifre' : 'New Password',
    confirmPassword: locale === 'tr' ? 'Şifreyi Onayla' : 'Confirm Password',
    submit: locale === 'tr' ? 'Şifreyi Güncelle' : 'Update Password',
    updating: locale === 'tr' ? 'Güncelleniyor...' : 'Updating...',
    successTitle: locale === 'tr' ? 'Şifre Güncellendi!' : 'Password Updated!',
    successMessage: locale === 'tr'
      ? 'Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.'
      : 'Your password has been updated successfully. You can now log in.',
    goToLogin: locale === 'tr' ? 'Giriş Yap' : 'Go to Login',
    passwordMismatch: locale === 'tr' ? 'Şifreler eşleşmiyor.' : 'Passwords do not match.',
    passwordTooShort: locale === 'tr' ? 'Şifre en az 6 karakter olmalı.' : 'Password must be at least 6 characters.',
    invalidLink: locale === 'tr' ? 'Geçersiz veya süresi dolmuş bağlantı.' : 'Invalid or expired link.',
    error: locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.',
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
      setChecking(false);
    };

    checkSession();

    // Listen for auth state changes (when user clicks the reset link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);

      // Sign out after password change
      await supabase.auth.signOut();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isValidSession && !success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.invalidLink}</h2>
            <Link href={`/${locale}/forgot-password`}>
              <Button variant="primary" className="mt-4">
                {locale === 'tr' ? 'Yeni Bağlantı İste' : 'Request New Link'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.successTitle}</h2>
            <p className="text-gray-600 mb-6">{t.successMessage}</p>
            <Link href={`/${locale}/login`}>
              <Button variant="primary" className="w-full">
                {t.goToLogin}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary-600" />
          </div>
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <p className="text-gray-600 text-sm mt-2">{t.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            <Input
              label={t.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />

            <Input
              label={t.confirmPassword}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              required
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              {loading ? t.updating : t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
