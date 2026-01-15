import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  const { id } = await params;
  const supabase = createAdminClient();

  // Get user's stripe_customer_id
  const { data: user, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.stripe_customer_id) {
    return NextResponse.json({
      has_stripe: false,
      subscription: null,
      invoices: [],
    });
  }

  try {
    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 1,
    });

    const subscription = subscriptions.data[0] || null;

    // Get recent invoices
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 5,
    });

    return NextResponse.json({
      has_stripe: true,
      customer_id: user.stripe_customer_id,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }
        : null,
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        amount_due: inv.amount_due,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        hosted_invoice_url: inv.hosted_invoice_url,
      })),
    });
  } catch (stripeError) {
    console.error('Stripe API error:', stripeError);
    return NextResponse.json({
      has_stripe: true,
      customer_id: user.stripe_customer_id,
      error: 'Failed to fetch Stripe data',
      subscription: null,
      invoices: [],
    });
  }
}
