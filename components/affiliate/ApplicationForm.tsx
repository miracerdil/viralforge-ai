'use client';

import { useState } from 'react';
import { Loader2, Send, DollarSign, Building2, Globe, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ApplicationFormProps {
  locale: string;
  onSubmit: (data: {
    applicationNote: string;
    payoutMethod: string;
    payoutDetails: Record<string, string>;
  }) => Promise<void>;
}

export function ApplicationForm({ locale, onSubmit }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [payoutDetails, setPayoutDetails] = useState<Record<string, string>>({});

  const t = {
    title: locale === 'tr' ? 'Affiliate Başvurusu' : 'Affiliate Application',
    subtitle: locale === 'tr'
      ? 'Ürünlerimizi tanıtın, komisyon kazanın!'
      : 'Promote our products and earn commissions!',
    benefits: {
      title: locale === 'tr' ? 'Avantajlar' : 'Benefits',
      commission: locale === 'tr' ? '%15 Komisyon' : '15% Commission',
      commissionDesc: locale === 'tr' ? 'Her satıştan' : 'On every sale',
      cookie: locale === 'tr' ? '30 Gün Cookie' : '30-Day Cookie',
      cookieDesc: locale === 'tr' ? 'Uzun takip süresi' : 'Extended tracking',
      payout: locale === 'tr' ? 'Aylık Ödeme' : 'Monthly Payouts',
      payoutDesc: locale === 'tr' ? 'Min. $50' : 'Min. $50 threshold',
    },
    form: {
      about: locale === 'tr' ? 'Kendinizi Tanıtın' : 'Tell Us About Yourself',
      aboutPlaceholder: locale === 'tr'
        ? 'Nasıl tanıtım yapacağınızı anlatın (blog, YouTube, sosyal medya vb.)'
        : 'Describe how you plan to promote (blog, YouTube, social media, etc.)',
      payoutMethod: locale === 'tr' ? 'Ödeme Yöntemi' : 'Payout Method',
      payoutDetails: locale === 'tr' ? 'Ödeme Bilgileri' : 'Payout Details',
      paypalEmail: locale === 'tr' ? 'PayPal E-posta' : 'PayPal Email',
      bankName: locale === 'tr' ? 'Banka Adı' : 'Bank Name',
      accountNumber: locale === 'tr' ? 'Hesap Numarası' : 'Account Number',
      iban: 'IBAN',
      wiseEmail: locale === 'tr' ? 'Wise E-posta' : 'Wise Email',
      walletAddress: locale === 'tr' ? 'Cüzdan Adresi' : 'Wallet Address',
    },
    submit: locale === 'tr' ? 'Başvur' : 'Submit Application',
    submitting: locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...',
  };

  const payoutMethods = [
    { id: 'paypal', label: 'PayPal', icon: DollarSign },
    { id: 'bank_transfer', label: locale === 'tr' ? 'Banka' : 'Bank', icon: Building2 },
    { id: 'wise', label: 'Wise', icon: Globe },
    { id: 'crypto', label: 'Crypto', icon: Wallet },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        applicationNote,
        payoutMethod,
        payoutDetails,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPayoutFields = () => {
    switch (payoutMethod) {
      case 'paypal':
        return (
          <input
            type="email"
            placeholder={t.form.paypalEmail}
            value={payoutDetails.email || ''}
            onChange={(e) => setPayoutDetails({ ...payoutDetails, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        );
      case 'bank_transfer':
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder={t.form.bankName}
              value={payoutDetails.bankName || ''}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, bankName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder={t.form.iban}
              value={payoutDetails.iban || ''}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, iban: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        );
      case 'wise':
        return (
          <input
            type="email"
            placeholder={t.form.wiseEmail}
            value={payoutDetails.email || ''}
            onChange={(e) => setPayoutDetails({ ...payoutDetails, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        );
      case 'crypto':
        return (
          <div className="space-y-3">
            <select
              value={payoutDetails.network || 'ethereum'}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, network: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ethereum">Ethereum (USDT/USDC)</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="solana">Solana (USDT/USDC)</option>
            </select>
            <input
              type="text"
              placeholder={t.form.walletAddress}
              value={payoutDetails.walletAddress || ''}
              onChange={(e) => setPayoutDetails({ ...payoutDetails, walletAddress: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Benefits */}
      <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 mb-8 border border-primary-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.benefits.title}</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{t.benefits.commission}</div>
            <div className="text-sm text-gray-600">{t.benefits.commissionDesc}</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{t.benefits.cookie}</div>
            <div className="text-sm text-gray-600">{t.benefits.cookieDesc}</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">{t.benefits.payout}</div>
            <div className="text-sm text-gray-600">{t.benefits.payoutDesc}</div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.form.about}</label>
          <textarea
            value={applicationNote}
            onChange={(e) => setApplicationNote(e.target.value)}
            placeholder={t.form.aboutPlaceholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Payout Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.form.payoutMethod}</label>
          <div className="grid grid-cols-4 gap-2">
            {payoutMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setPayoutMethod(method.id);
                    setPayoutDetails({});
                  }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                    payoutMethod === method.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5',
                    payoutMethod === method.id ? 'text-primary-600' : 'text-gray-500'
                  )} />
                  <span className={cn(
                    'text-sm font-medium',
                    payoutMethod === method.id ? 'text-primary-600' : 'text-gray-600'
                  )}>
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payout Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.form.payoutDetails}</label>
          {renderPayoutFields()}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t.submitting}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t.submit}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
