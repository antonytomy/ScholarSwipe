import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get saved scholarships with full details
    const { data: savedScholarships, error } = await supabase
      .from('saves')
      .select(`
        created_at,
        scholarships (
          id,
          title,
          description,
          amount_min,
          amount_max,
          deadline,
          url,
          tags,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Saved scholarships query error:', error);
      return NextResponse.json({ error: 'Failed to fetch saved scholarships' }, { status: 500 });
    }

    // Transform the data to a cleaner format
    const scholarships = savedScholarships?.map(item => ({
      ...item.scholarships,
      savedAt: item.created_at
    })).filter(item => item.id) || []; // Filter out any null scholarships

    return NextResponse.json({
      scholarships,
      pagination: {
        page,
        limit,
        hasMore: savedScholarships?.length === limit
      }
    });

  } catch (error) {
    console.error('Saved API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
