import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    // Extract search parameters
    const query = searchParams.get('q') || '';
    const tags = searchParams.get('tags')?.split(',') || [];
    const minAmount = parseInt(searchParams.get('min_amount')) || null;
    const maxAmount = parseInt(searchParams.get('max_amount')) || null;
    const deadlineFrom = searchParams.get('deadline_from') || null;
    const deadlineTo = searchParams.get('deadline_to') || null;

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build search query
    let dbQuery = supabase
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
      .gt('deadline', new Date().toISOString().split('T')[0]); // Only future deadlines

    // Text search
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Tag filtering
    if (tags.length > 0) {
      const tagFilter = tags.map(tag => `tags.cs.{${tag.trim()}}`).join(',');
      dbQuery = dbQuery.or(tagFilter);
    }

    // Amount filtering
    if (minAmount !== null) {
      dbQuery = dbQuery.gte('amount_max', minAmount);
    }
    if (maxAmount !== null) {
      dbQuery = dbQuery.lte('amount_min', maxAmount);
    }

    // Deadline filtering
    if (deadlineFrom) {
      dbQuery = dbQuery.gte('deadline', deadlineFrom);
    }
    if (deadlineTo) {
      dbQuery = dbQuery.lte('deadline', deadlineTo);
    }

    // Execute query with pagination
    const { data: scholarships, error } = await dbQuery
      .order('deadline', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Search query error:', error);
      return NextResponse.json({ error: 'Failed to search scholarships' }, { status: 500 });
    }

    // Get user profile for scoring
    const { data: profile } = await supabase
      .from('profiles')
      .select('interests, major')
      .eq('user_id', user.id)
      .single();

    // Apply scoring based on profile
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

      // Major matching
      if (profile?.major && scholarship.tags) {
        const majorMatch = scholarship.tags.some(tag => 
          tag.toLowerCase().includes(profile.major.toLowerCase()) ||
          profile.major.toLowerCase().includes(tag.toLowerCase())
        );
        if (majorMatch) score += 15;
      }

      // Amount boost
      if (scholarship.amount_max) {
        score += Math.min(scholarship.amount_max / 1000, 10);
      }

      // Deadline urgency
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
      },
      searchParams: {
        query,
        tags,
        minAmount,
        maxAmount,
        deadlineFrom,
        deadlineTo
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
