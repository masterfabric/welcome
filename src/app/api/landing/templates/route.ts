import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/landing/templates - Get component templates
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const componentType = searchParams.get('component_type')
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    let query = supabase
      .from('component_templates')
      .select('*')
      .eq('is_global', true)
      .order('template_name', { ascending: true })

    if (componentType) {
      query = query.eq('component_type', componentType)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch templates',
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Error in templates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/landing/templates - Create new template (owner only)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authHeader = request.headers.get('Authorization')
    
    let supabase
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key',
        {
          global: {
            headers: {
              Authorization: authHeader
            }
          },
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
    } else {
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key',
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
    }

    // Verify owner access
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_owner')
      .eq('id', user.id)
      .single()

    if (!profile?.is_owner) {
      return NextResponse.json({ error: 'Forbidden - Owner only' }, { status: 403 })
    }

    const body = await request.json()
    const { template_name, template_description, component_type, template_data, is_global = false } = body

    if (!template_name || !component_type) {
      return NextResponse.json(
        { error: 'Template name and component type are required' },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from('component_templates')
      .insert([{
        template_name,
        template_description,
        component_type,
        template_data: template_data || {},
        is_global,
        created_by: user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { 
          error: 'Failed to create template',
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in templates POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
