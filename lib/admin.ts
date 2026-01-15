import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Check if an email is in the SUPERADMIN_EMAILS allowlist
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = process.env.SUPERADMIN_EMAILS || '';
  const allowlist = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.toLowerCase());
}

/**
 * Server-side helper to verify admin access in API routes
 * Returns user if admin, throws/returns error response if not
 */
export async function requireAdmin(): Promise<{
  user: { id: string; email: string };
  error?: never;
} | {
  user?: never;
  error: NextResponse;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!isSuperAdmin(user.email)) {
    return {
      error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    };
  }

  return {
    user: { id: user.id, email: user.email || '' },
  };
}

/**
 * Check if user has effective PRO access (plan=PRO or comped_until >= today)
 */
export function hasProAccess(plan: string, compedUntil: string | null): boolean {
  if (plan === 'PRO') return true;

  if (compedUntil) {
    const today = new Date().toISOString().split('T')[0];
    return compedUntil >= today;
  }

  return false;
}
