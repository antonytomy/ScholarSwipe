import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { scholarshipId } = await request.json();

    if (!scholarshipId) {
      return NextResponse.json({ error: 'Scholarship ID is required' }, { status: 400 });
    }

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if scholarship exists
    const { data: scholarship, error: scholarshipError } = await supabase
      .from('scholarships')
      .select('id')
      .eq('id', scholarshipId)
      .single();

    if (scholarshipError || !scholarship) {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
    }

    // Save the scholarship
    const { data, error } = await supabase
      .from('saves')
      .insert({
        user_id: user.id,
        scholarship_id: scholarshipId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Scholarship already saved' }, { status: 409 });
      }
      console.error('Save error:', error);
      return NextResponse.json({ error: 'Failed to save scholarship' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Scholarship saved successfully',
      save: data
    });

  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scholarshipId = searchParams.get('id');

    if (!scholarshipId) {
      return NextResponse.json({ error: 'Scholarship ID is required' }, { status: 400 });
    }

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove the save
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('user_id', user.id)
      .eq('scholarship_id', scholarshipId);

    if (error) {
      console.error('Delete save error:', error);
      return NextResponse.json({ error: 'Failed to remove saved scholarship' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Scholarship removed from saved list'
    });

  } catch (error) {
    console.error('Delete save API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
