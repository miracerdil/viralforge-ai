import Stripe from 'stripe';
import { type PlanId, getStripePriceId } from '@/lib/config/plans';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

/**
 * Get Stripe price ID for a plan
 * Falls back to legacy STRIPE_PRO_PRICE_ID for backwards compatibility
 */
export function getPriceIdForPlan(planId: PlanId): string | null {
  // Check new plan-specific price IDs first
  if (planId === 'creator_pro') {
    return process.env.STRIPE_CREATOR_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || null;
  }
  if (planId === 'business_pro') {
    return process.env.STRIPE_BUSINESS_PRO_PRICE_ID || null;
  }
  return null;
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  planId,
}: {
  customerId: string;
  priceId?: string;
  successUrl: string;
  cancelUrl: string;
  planId?: PlanId;
}) {
  // Use planId to get price if priceId not provided directly
  const finalPriceId = priceId || (planId ? getPriceIdForPlan(planId) : null);

  if (!finalPriceId) {
    throw new Error('Price ID is required');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: finalPriceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      planId: planId || 'creator_pro',
    },
  });

  return session;
}

export async function createCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });

  return customer;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

export async function getSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

/**
 * Get detailed subscription info including period dates
 */
export async function getSubscriptionDetails(customerId: string): Promise<{
  subscriptionId: string | null;
  priceId: string | null;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
} | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      expand: ['data.items.data.price'],
    });

    const subscription = subscriptions.data[0];
    if (!subscription) {
      return null;
    }

    const priceId = subscription.items.data[0]?.price?.id || null;

    return {
      subscriptionId: subscription.id,
      priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}
