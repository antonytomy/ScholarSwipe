import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Profile GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const profileData = await request.json();

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    const { name, school, major, graduation_year } = profileData;
    if (!name || !school || !major || !graduation_year) {
      return NextResponse.json({ 
        error: 'Name, school, major, and graduation year are required' 
      }, { status: 400 });
    }

    // Upsert profile (create or update)
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name,
        school,
        major,
        graduation_year,
        gpa: profileData.gpa || null,
        interests: profileData.interests || [],
        demographics: profileData.demographics || null,
        location: profileData.location || null
      })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profile saved successfully',
      profile
    });

  } catch (error) {
    console.error('Profile POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const profileData = await request.json();

    // Get cookies for server client
    const cookieStore = request.headers.get('cookie') || '';
    const supabase = getServerSupabaseClient({ get: () => ({ value: cookieStore }) });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile
    });

  } catch (error) {
    console.error('Profile PUT API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
