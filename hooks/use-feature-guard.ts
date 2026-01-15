'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getFeatureUsage,
  canUseFeature,
  getUsageSummary,
} from '@/lib/services/entitlements';
import type {
  FeatureType,
  UsageStatus,
  UserEntitlements,
  UsageSummary,
} from '@/lib/types/entitlements';

interface FeatureGuardResult {
  // Check if a feature can be used
  checkFeature: (feature: FeatureType) => {
    allowed: boolean;
    status: UsageStatus;
    remaining: number;
  };
  // Get usage for a specific feature
  getUsage: (feature: FeatureType) => {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
    status: UsageStatus;
  };
  // Full usage summary
  usageSummary: UsageSummary | null;
  // Entitlements data
  entitlements: UserEntitlements | null;
  // Loading state
  loading: boolean;
  // Refresh data
  refresh: () => Promise<void>;
  // Track usage after action
  trackUsage: (feature: FeatureType) => Promise<void>;
}

export function useFeatureGuard(): FeatureGuardResult {
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadEntitlements = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_entitlements')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setEntitlements(data as UserEntitlements);
        setUsageSummary(getUsageSummary(data as UserEntitlements));
      }
    } catch (error) {
      console.error('Error loading entitlements:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadEntitlements();
  }, [loadEntitlements]);

  const checkFeature = useCallback(
    (feature: FeatureType) => {
      if (!entitlements) {
        return { allowed: false, status: 'blocked' as UsageStatus, remaining: 0 };
      }
      return canUseFeature(entitlements, feature);
    },
    [entitlements]
  );

  const getUsage = useCallback(
    (feature: FeatureType) => {
      if (!entitlements) {
        return {
          used: 0,
          limit: 0,
          remaining: 0,
          percentage: 0,
          status: 'ok' as UsageStatus,
        };
      }
      const usage = getFeatureUsage(entitlements, feature);
      return {
        used: usage.used,
        limit: usage.effectiveLimit,
        remaining: usage.remaining,
        percentage: usage.percentage,
        status: usage.status,
      };
    },
    [entitlements]
  );

  const trackUsage = useCallback(
    async (feature: FeatureType) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Call API to increment usage
      try {
        await fetch('/api/entitlements/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature }),
        });

        // Refresh entitlements
        await loadEntitlements();
      } catch (error) {
        console.error('Error tracking usage:', error);
      }
    },
    [supabase, loadEntitlements]
  );

  return {
    checkFeature,
    getUsage,
    usageSummary,
    entitlements,
    loading,
    refresh: loadEntitlements,
    trackUsage,
  };
}

// Higher-order component for feature gating
interface WithFeatureGuardProps {
  feature: FeatureType;
  locale: string;
  onBlocked?: () => void;
  children: React.ReactNode;
}

export function FeatureGuard({
  feature,
  locale,
  onBlocked,
  children,
}: WithFeatureGuardProps) {
  const { checkFeature, loading } = useFeatureGuard();
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);

  const check = checkFeature(feature);

  if (loading) {
    return <>{children}</>;
  }

  if (check.status === 'blocked') {
    if (onBlocked) {
      onBlocked();
    }
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-700 font-medium">
          {locale === 'tr' ? 'Limit doldu' : 'Limit reached'}
        </p>
        <p className="text-red-600 text-sm mt-1">
          {locale === 'tr'
            ? 'Devam etmek için planınızı yükseltin'
            : 'Upgrade your plan to continue'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
