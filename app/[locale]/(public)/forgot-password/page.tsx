'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const t = {
    title: locale === 'tr' ? 'Şifremi Unuttum' : 'Forgot Password',
    subtitle: locale === 'tr'
      ? 'E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.'
      : 'Enter your email address and we\'ll send you a password reset link.',
    email: locale === 'tr' ? 'E-posta' : 'Email',
    submit: locale === 'tr' ? 'Sıfırlama Bağlantısı Gönder' : 'Send Reset Link',
    sending: locale === 'tr' ? 'Gönderiliyor...' : 'Sending...',
    backToLogin: locale === 'tr' ? 'Girişe Dön' : 'Back to Login',
    successTitle: locale === 'tr' ? 'E-posta Gönderildi!' : 'Email Sent!',
    successMessage: locale === 'tr'
      ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.'
      : 'A password reset link has been sent to your email address. Please check your inbox.',
    error: locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToLogin}
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
            <Mail className="w-6 h-6 text-primary-600" />
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
              label={t.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              {loading ? t.sending : t.submit}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href={`/${locale}/login`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToLogin}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
