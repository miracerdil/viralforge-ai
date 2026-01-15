/**
 * Referral Tracking Service
 * Handles referral code storage, retrieval, and tracking via cookies/localStorage
 */

const REFERRAL_COOKIE_NAME = 'vf_ref';
const REFERRAL_STORAGE_KEY = 'viralforge_referral';
const REFERRAL_EXPIRY_DAYS = 30;

interface ReferralData {
  code: string;
  source: string;
  timestamp: number;
  landingPage: string;
}

/**
 * Check if we're in browser environment
 */
const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Set referral code from URL parameter
 * Call this on initial page load
 */
export function captureReferralCode(): ReferralData | null {
  if (!isBrowser()) return null;

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref') || urlParams.get('referral');

  if (!refCode) return null;

  // Don't overwrite existing referral
  const existing = getReferralData();
  if (existing) return existing;

  const data: ReferralData = {
    code: refCode.toUpperCase(),
    source: urlParams.get('utm_source') || 'direct',
    timestamp: Date.now(),
    landingPage: window.location.pathname,
  };

  // Store in both cookie and localStorage for redundancy
  setCookie(REFERRAL_COOKIE_NAME, JSON.stringify(data), REFERRAL_EXPIRY_DAYS);
  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));

  return data;
}

/**
 * Get stored referral data
 */
export function getReferralData(): ReferralData | null {
  if (!isBrowser()) return null;

  // Try localStorage first
  try {
    const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as ReferralData;
      // Check if not expired
      const expiryTime = data.timestamp + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() < expiryTime) {
        return data;
      }
      // Expired, clear it
      clearReferralData();
    }
  } catch {
    // Fall through to cookie
  }

  // Try cookie
  try {
    const cookie = getCookie(REFERRAL_COOKIE_NAME);
    if (cookie) {
      return JSON.parse(cookie) as ReferralData;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Get just the referral code
 */
export function getReferralCode(): string | null {
  const data = getReferralData();
  return data?.code || null;
}

/**
 * Clear referral data after successful signup
 */
export function clearReferralData(): void {
  if (!isBrowser()) return;

  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  deleteCookie(REFERRAL_COOKIE_NAME);
}

/**
 * Check if user was referred
 */
export function wasReferred(): boolean {
  return getReferralCode() !== null;
}

// Cookie helpers
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}
