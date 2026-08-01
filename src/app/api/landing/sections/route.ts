import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  createLandingSection,
  updateLandingSection,
  deleteLandingSection,
  reorderLandingSections
} from '@/lib/repositories/landing'

/**
 * POST /api/landing/sections - Create new section (owner only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify owner access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )

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
    const { landing_page_id, section_type, title, content, order_index, is_visible } = body

    if (!landing_page_id || !section_type || !title) {
      return NextResponse.json(
        { error: 'landing_page_id, section_type, and title are required' },
        { status: 400 }
      )
    }

    const { data, error } = await createLandingSection({
      landing_page_id,
      section_type,
      title,
      content: content || {},
      order_index: order_index || 0,
      is_visible: is_visible !== undefined ? is_visible : true
    })

    if (error) {
      console.error('Error creating landing section:', error)
      return NextResponse.json(
        { error: 'Failed to create landing section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ section: data }, { status: 201 })
  } catch (error) {
    console.error('Error in landing sections API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/landing/sections - Update section (owner only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify owner access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )

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
    const { id, reorder, ...updates } = body

    // Handle reorder action
    if (reorder && Array.isArray(reorder)) {
      const { error } = await reorderLandingSections(reorder)
      
      if (error) {
        console.error('Error reordering sections:', error)
        return NextResponse.json(
          { error: 'Failed to reorder sections' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await updateLandingSection(id, updates)

    if (error) {
      console.error('Error updating landing section:', error)
      return NextResponse.json(
        { error: 'Failed to update landing section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ section: data })
  } catch (error) {
    console.error('Error in landing sections API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/landing/sections - Delete section (owner only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify owner access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    )

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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      )
    }

    const { error } = await deleteLandingSection(id)

    if (error) {
      console.error('Error deleting landing section:', error)
      return NextResponse.json(
        { error: 'Failed to delete landing section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in landing sections API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

