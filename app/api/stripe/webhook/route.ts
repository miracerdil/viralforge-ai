import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanByPriceId, type PlanId } from '@/lib/config/plans';
import { logActivity } from '@/lib/services/activity-logger';
import { triggerBillingNotification } from '@/lib/services/notification-triggers';

/**
 * Get plan from price ID, with fallback logic
 */
function determinePlan(priceId: string | null | undefined): PlanId {
  if (!priceId) return 'creator_pro'; // Default for legacy

  // Check against configured price IDs
  const creatorPriceId = process.env.STRIPE_CREATOR_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID;
  const businessPriceId = process.env.STRIPE_BUSINESS_PRO_PRICE_ID;

  if (businessPriceId && priceId === businessPriceId) {
    return 'business_pro';
  }
  if (creatorPriceId && priceId === creatorPriceId) {
    return 'creator_pro';
  }

  // Fallback to config lookup
  return getPlanByPriceId(priceId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Fetch subscription to get price and period details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = determinePlan(priceId);

        // Update profile with subscription details
        const { error } = await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            subscription_status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating profile:', error);
        }

        // Log lifecycle event
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('lifecycle_events').insert({
            user_id: profile.id,
            event_type: 'subscription_started',
            feature: 'subscription',
            meta: { plan, priceId },
          });

          // Log activity for user history
          await logActivity(supabase, profile.id, 'plan_upgraded', {
            entityType: 'subscription',
            entityId: subscriptionId,
            metadata: { plan, priceId },
          });

          // Trigger billing notification
          await triggerBillingNotification(supabase, profile.id, 'upgraded', plan);
        }

        console.log(`Upgraded customer ${customerId} to ${plan}`);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = determinePlan(priceId);

        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            subscription_status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Subscription created for customer ${customerId}: ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;

        // Determine plan based on subscription status
        let plan: PlanId;
        let subscriptionStatus: string;

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          plan = determinePlan(priceId);
          subscriptionStatus = subscription.status;
        } else if (
          subscription.status === 'canceled' ||
          subscription.status === 'unpaid' ||
          subscription.status === 'incomplete_expired'
        ) {
          plan = 'free';
          subscriptionStatus = subscription.status;
        } else {
          // past_due, incomplete - keep current plan but update status
          plan = determinePlan(priceId);
          subscriptionStatus = subscription.status;
        }

        await supabase
          .from('profiles')
          .update({
            plan,
            stripe_price_id: priceId,
            subscription_status: subscriptionStatus,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`Subscription updated for customer ${customerId}: ${plan} (${subscriptionStatus})`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to free and clear subscription fields
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            stripe_price_id: null,
            subscription_status: 'canceled',
            // Keep period dates for reference
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Error updating profile:', error);
        }

        // Log lifecycle event
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('lifecycle_events').insert({
            user_id: profile.id,
            event_type: 'subscription_canceled',
            feature: 'subscription',
            meta: { reason: 'deleted' },
          });

          // Log activity for user history
          await logActivity(supabase, profile.id, 'plan_downgraded', {
            entityType: 'subscription',
            entityId: subscription.id,
            metadata: { from_plan: subscription.items.data[0]?.price?.id },
          });

          // Trigger billing notification
          await triggerBillingNotification(supabase, profile.id, 'downgraded');
        }

        console.log(`Downgraded customer ${customerId} to free`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Fetch subscription to update period dates
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_customer_id', customerId);

          // Log renewal activity (only for non-first invoices)
          if (invoice.billing_reason === 'subscription_cycle') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('stripe_customer_id', customerId)
              .single();

            if (profile) {
              await logActivity(supabase, profile.id, 'subscription_renewed', {
                entityType: 'subscription',
                entityId: subscriptionId,
                metadata: {
                  period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                },
              });

              // Trigger billing notification
              await triggerBillingNotification(supabase, profile.id, 'renewed');
            }
          }

          console.log(`Payment succeeded for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Update subscription status to past_due
        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId);

        // Log lifecycle event
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('lifecycle_events').insert({
            user_id: profile.id,
            event_type: 'payment_failed',
            feature: 'subscription',
            meta: { invoiceId: invoice.id },
          });

          // Trigger billing notification
          await triggerBillingNotification(supabase, profile.id, 'payment_failed');
        }

        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
