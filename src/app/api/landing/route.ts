import { NextRequest, NextResponse } from 'next/server'
import { getActiveLandingPage } from '@/lib/repositories/landing'

/**
 * GET /api/landing - Get active landing page with sections (public)
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await getActiveLandingPage()

    if (error) {
      console.error('Error fetching landing page:', error)
      return NextResponse.json(
        { error: 'Failed to fetch landing page' },
        { status: 500 }
      )
    }

    return NextResponse.json({ landingPage: data })
  } catch (error) {
    console.error('Error in landing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

