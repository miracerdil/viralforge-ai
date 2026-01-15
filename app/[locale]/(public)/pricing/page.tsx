'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Dictionary } from '@/lib/i18n/getDictionary';

export default function PricingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const supabase = createClient();

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load dictionary
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });

    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email || '' });
      }
    });
  }, [locale, supabase.auth]);

  const handleUpgrade = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!dictionary) {
    return null;
  }

  const t = dictionary;

  return (
    <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.pricing.title}</h1>
            <p className="text-xl text-gray-600">{t.pricing.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader>
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.free.name}</h3>
                <p className="text-gray-600">{t.pricing.free.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{t.pricing.free.price}</span>
                  <span className="text-gray-500">{t.pricing.free.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {t.pricing.free.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/signup`)}
                >
                  {t.pricing.free.cta}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-primary-500 border-2">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary-600 text-white px-3 py-1">
                  {t.pricing.pro.popular}
                </Badge>
              </div>
              <CardHeader>
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.pro.name}</h3>
                <p className="text-gray-600">{t.pricing.pro.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{t.pricing.pro.price}</span>
                  <span className="text-gray-500">{t.pricing.pro.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {t.pricing.pro.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleUpgrade} isLoading={loading}>
                  {t.pricing.pro.cta}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
    </div>
  );
}
