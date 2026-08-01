import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * GET /api/landing/components - Get all components for a landing page
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const landingPageId = searchParams.get('landing_page_id')
    
    if (!landingPageId) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      )
    }
    
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

    // Get components with their properties
    const { data: components, error } = await supabase
      .from('landing_components')
      .select(`
        *,
        properties:component_properties(*)
      `)
      .eq('landing_page_id', landingPageId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching components:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch components',
          details: error.message,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    // Transform properties into a more usable format
    const transformedComponents = components?.map(component => ({
      ...component,
      properties: component.properties?.reduce((acc: any, prop: any) => {
        acc[prop.property_key] = prop.property_value
        return acc
      }, {}) || {}
    })) || []

    return NextResponse.json({ components: transformedComponents })
  } catch (error) {
    console.error('Error in components API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/landing/components - Create new component
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
    const { 
      landing_page_id, 
      component_type, 
      component_name, 
      properties = {},
      ...componentData 
    } = body

    if (!landing_page_id || !component_type || !component_name) {
      return NextResponse.json(
        { error: 'Landing page ID, component type, and component name are required' },
        { status: 400 }
      )
    }

    // Create the component
    const { data: component, error: componentError } = await supabase
      .from('landing_components')
      .insert([{
        landing_page_id,
        component_type,
        component_name,
        component_slug: component_name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...componentData
      }])
      .select()
      .single()

    if (componentError) {
      console.error('Error creating component:', componentError)
      return NextResponse.json(
        { 
          error: 'Failed to create component',
          details: componentError.message,
          hint: componentError.hint,
          code: componentError.code
        },
        { status: 500 }
      )
    }

    // Create component properties
    if (Object.keys(properties).length > 0) {
      const propertyInserts = Object.entries(properties).map(([key, value]) => ({
        component_id: component.id,
        property_key: key,
        property_value: String(value),
        property_type: typeof value === 'boolean' ? 'boolean' : 
                      typeof value === 'number' ? 'number' :
                      key.includes('url') || key.includes('link') ? 'url' :
                      key.includes('email') ? 'email' :
                      key.includes('color') ? 'color' :
                      key.includes('image') ? 'image' : 'text'
      }))

      const { error: propertiesError } = await supabase
        .from('component_properties')
        .insert(propertyInserts)

      if (propertiesError) {
        console.error('Error creating component properties:', propertiesError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json({ component }, { status: 201 })
  } catch (error) {
    console.error('Error in components POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
