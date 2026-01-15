'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareLinkModal } from './ShareLinkModal';

interface ShareLinkButtonProps {
  contentType: 'hooks' | 'analysis' | 'planner' | 'ab_test';
  contentId: string;
  title?: string;
  locale: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
}

export function ShareLinkButton({
  contentType,
  contentId,
  title,
  locale,
  variant = 'ghost',
  size = 'sm',
}: ShareLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        title={locale === 'tr' ? 'Paylaş' : 'Share'}
      >
        <Share2 className="w-4 h-4" />
      </Button>

      <ShareLinkModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contentType={contentType}
        contentId={contentId}
        title={title}
        locale={locale}
      />
    </>
  );
}
