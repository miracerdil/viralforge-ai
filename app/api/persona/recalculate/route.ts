import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/persona/recalculate - Batch recalculate all personas
// This should be called by a cron job (daily or weekly)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get all Pro users with persona profiles
    const { data: proUsers, error: usersError } = await adminClient
      .from('profiles')
      .select('id')
      .or('plan.eq.PRO,comped_until.gte.' + new Date().toISOString().split('T')[0]);

    if (usersError) {
      console.error('Error fetching Pro users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    let updated = 0;
    let errors = 0;

    // Process each user
    for (const user of proUsers || []) {
      try {
        // Call the update function for each user
        const { error } = await adminClient.rpc('update_persona_from_events', {
          p_user_id: user.id,
        });

        if (error) {
          console.error(`Error updating persona for ${user.id}:`, error);
          errors++;
        } else {
          updated++;
        }
      } catch (err) {
        console.error(`Exception updating persona for ${user.id}:`, err);
        errors++;
      }
    }

    // Apply weight decay for old patterns
    await applyWeightDecay(adminClient);

    return NextResponse.json({
      success: true,
      processed: proUsers?.length || 0,
      updated,
      errors,
    });
  } catch (error) {
    console.error('Batch recalculate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply weight decay to normalize weights and reduce old pattern influence
async function applyWeightDecay(adminClient: any) {
  try {
    // Normalize weights that have drifted too far from sum of 1.0
    await adminClient.rpc('normalize_persona_weights');
  } catch (error) {
    console.error('Weight decay error:', error);
  }
}

// GET endpoint for manual trigger (admin only)
export async function GET(request: NextRequest) {
  // For now, just return status
  return NextResponse.json({
    message: 'Use POST to trigger recalculation',
    requiresAuth: true,
  });
}
