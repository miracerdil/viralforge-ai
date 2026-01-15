'use client';

import { useState } from 'react';
import { Copy, Share2, Check, Gift, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InviteCardProps {
  referralCode: string;
  locale: string;
}

export function InviteCard({ referralCode, locale }: InviteCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}/signup?ref=${referralCode}`;

  const t = {
    title: locale === 'tr' ? 'Arkadaşlarını Davet Et' : 'Invite Friends',
    subtitle: locale === 'tr' ? 'Her kayıt için XP kazan!' : 'Earn XP for each signup!',
    yourCode: locale === 'tr' ? 'Referans Kodun' : 'Your Referral Code',
    yourLink: locale === 'tr' ? 'Referans Linkin' : 'Your Referral Link',
    copy: locale === 'tr' ? 'Kopyala' : 'Copy',
    copied: locale === 'tr' ? 'Kopyalandı!' : 'Copied!',
    share: locale === 'tr' ? 'Paylaş' : 'Share',
    rewards: locale === 'tr' ? 'Ödüller' : 'Rewards',
    signupReward: locale === 'tr' ? 'Kayıt başına' : 'Per signup',
    conversionReward: locale === 'tr' ? 'PRO dönüşüm başına' : 'Per PRO conversion',
    shareMessage: locale === 'tr'
      ? 'ViralForge ile viral içerikler oluştur! Referans kodum:'
      : 'Create viral content with ViralForge! Use my referral code:',
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.shareMessage + ' ' + referralCode)}&url=${encodeURIComponent(referralLink)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    email: `mailto:?subject=${encodeURIComponent('Check out ViralForge')}&body=${encodeURIComponent(t.shareMessage + '\n\n' + referralLink)}`,
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <Gift className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{t.yourCode}</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white rounded-lg px-4 py-3 font-mono text-lg font-bold text-primary-600 tracking-wider border border-gray-200">
            {referralCode}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(referralCode)}
            className="shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{t.yourLink}</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white rounded-lg px-4 py-2.5 text-sm text-gray-600 truncate border border-gray-200">
            {referralLink}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(referralLink)}
            className="shrink-0"
          >
            {copied ? t.copied : t.copy}
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="relative mb-6">
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setShowShareMenu(!showShareMenu)}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {t.share}
        </Button>

        {showShareMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10">
            <div className="grid grid-cols-4 gap-2">
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                <span className="text-xs text-gray-600">Twitter</span>
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Facebook className="w-5 h-5 text-[#1877F2]" />
                <span className="text-xs text-gray-600">Facebook</span>
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                <span className="text-xs text-gray-600">LinkedIn</span>
              </a>
              <a
                href={shareLinks.email}
                className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-gray-600">Email</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Rewards Info */}
      <div className="bg-white/60 rounded-xl p-4 border border-white">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t.rewards}</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t.signupReward}</span>
            <span className="font-semibold text-amber-600">+500 XP</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t.conversionReward}</span>
            <span className="font-semibold text-amber-600">+1000 XP + 50 Credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
