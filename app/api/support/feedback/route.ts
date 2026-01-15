import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  // Build query
  let query = supabase
    .from('feedback_requests')
    .select('*, feedback_votes(user_id)')
    .order('vote_count', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category', category);
  }

  const { data: feedback, error } = await query;

  if (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }

  // Mark which ones user has voted for
  const feedbackWithVotes = feedback?.map((item) => ({
    ...item,
    has_voted: user ? item.feedback_votes?.some((v: any) => v.user_id === user.id) : false,
    feedback_votes: undefined, // Don't expose all votes
  }));

  return NextResponse.json({ feedback: feedbackWithVotes });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  // Handle vote
  if (action === 'vote') {
    const { feedbackId } = body;

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('feedback_votes')
      .select('id')
      .eq('feedback_id', feedbackId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      // Remove vote
      await supabase
        .from('feedback_votes')
        .delete()
        .eq('id', existingVote.id);

      return NextResponse.json({ success: true, voted: false });
    } else {
      // Add vote
      await supabase
        .from('feedback_votes')
        .insert({ feedback_id: feedbackId, user_id: user.id });

      return NextResponse.json({ success: true, voted: true });
    }
  }

  // Handle create feedback
  const { title, description, category, importance } = body;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
  }

  const { data: feedback, error } = await supabase
    .from('feedback_requests')
    .insert({
      user_id: user.id,
      title,
      description,
      category: category || 'feature',
      importance: importance || 'medium',
      status: 'new',
      vote_count: 1, // Creator's vote
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({
      error: 'Failed to create feedback',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }

  // Auto-vote for creator
  await supabase.from('feedback_votes').insert({
    feedback_id: feedback.id,
    user_id: user.id,
  });

  return NextResponse.json({ feedback, success: true });
}
