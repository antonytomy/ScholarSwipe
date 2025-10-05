import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for recommendations
    const { data: profile } = await supabase
      .from('profiles')
      .select('interests, major, graduation_year')
      .eq('user_id', user.id)
      .single();

    // Build recommendation query with basic scoring
    let query = supabase
      .from('scholarships')
      .select(`
        id,
        title,
        description,
        amount_min,
        amount_max,
        deadline,
        url,
        tags,
        created_at
      `)
      .gt('deadline', new Date().toISOString().split('T')[0]) // Only future deadlines
      .order('deadline', { ascending: true });

    // Apply basic filtering based on profile
    if (profile?.major) {
      query = query.or(`tags.cs.{${profile.major}},tags.ov.{academic,general}`);
    }

    if (profile?.interests && profile.interests.length > 0) {
      const interestFilter = profile.interests.map(interest => `tags.cs.{${interest}}`).join(',');
      query = query.or(interestFilter);
    }

    const { data: scholarships, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Feed query error:', error);
      return NextResponse.json({ error: 'Failed to fetch scholarships' }, { status: 500 });
    }

    // Simple scoring algorithm
    const scoredScholarships = scholarships?.map(scholarship => {
      let score = 0;
      
      // Tag matching with profile interests
      if (profile?.interests && scholarship.tags) {
        const matchingTags = scholarship.tags.filter(tag => 
          profile.interests.some(interest => 
            interest.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(interest.toLowerCase())
          )
        );
        score += matchingTags.length * 10;
      }

      // Amount boost (higher amounts get slight preference)
      if (scholarship.amount_max) {
        score += Math.min(scholarship.amount_max / 1000, 10);
      }

      // Deadline urgency (sooner deadlines get slight boost)
      const daysUntilDeadline = Math.ceil(
        (new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDeadline <= 30) score += 5;
      if (daysUntilDeadline <= 7) score += 10;

      return { ...scholarship, score };
    }).sort((a, b) => b.score - a.score) || [];

    return NextResponse.json({
      scholarships: scoredScholarships,
      pagination: {
        page,
        limit,
        hasMore: scholarships?.length === limit
      }
    });

  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
