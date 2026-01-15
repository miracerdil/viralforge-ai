import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createCheckoutSession,
  createCustomer,
  getPriceIdForPlan,
  getSubscription,
  createBillingPortalSession,
} from '@/lib/stripe/client';
import { type PlanId } from '@/lib/config/plans';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locale = 'tr', plan = 'creator_pro' } = body as { locale: string; plan: PlanId };

    // Validate plan
    if (!['creator_pro', 'business_pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create Stripe customer if needed
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await createCustomer(profile.email, profile.name || undefined);
      customerId = customer.id;

      // Save customer ID using admin client to bypass RLS
      const adminClient = createAdminClient();
      await adminClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Check if user already has an active subscription
    const existingSubscription = await getSubscription(customerId);
    if (existingSubscription) {
      // Redirect to billing portal for plan changes
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const portalSession = await createBillingPortalSession(
        customerId,
        `${appUrl}/${locale}/account`
      );
      return NextResponse.json({ url: portalSession.url, isPortal: true });
    }

    // Get price ID for selected plan
    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for ${plan}` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerId,
      priceId,
      planId: plan,
      successUrl: `${appUrl}/${locale}/account?success=true`,
      cancelUrl: `${appUrl}/${locale}/account?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
