import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/affiliate/clicks
 * Track an affiliate click
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { affiliateCode, visitorId, landingPage, referrerUrl } = await request.json();

    if (!affiliateCode || !visitorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get IP and user agent from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Call the database function to track click
    const { data: clickId, error } = await supabase.rpc('track_affiliate_click', {
      p_affiliate_code: affiliateCode.toUpperCase(),
      p_visitor_id: visitorId,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_landing_page: landingPage || '/',
      p_referrer_url: referrerUrl || null,
    });

    if (error) {
      console.error('Error tracking affiliate click:', error);
      // Don't expose error to client, just log it
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({
      success: true,
      clickId,
    });
  } catch (error: any) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json({ success: false });
  }
}
