import { supabase } from './client'

export interface LandingPage {
  id: string
  title: string
  subtitle: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LandingSection {
  id: string
  landing_page_id: string
  section_type: 'hero' | 'welcome' | 'features' | 'process' | 'cta' | 'info' | 'custom'
  title: string
  content: any // JSON content
  order_index: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface LandingPageWithSections extends LandingPage {
  sections: LandingSection[]
}

/**
 * Get active landing page with all sections
 */
export async function getActiveLandingPage() {
  try {
    const { data: landingPage, error: pageError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('is_active', true)
      .single()

    if (pageError) throw pageError

    if (!landingPage) {
      return { data: null, error: null }
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('landing_sections')
      .select('*')
      .eq('landing_page_id', landingPage.id)
      .eq('is_visible', true)
      .order('order_index', { ascending: true })

    if (sectionsError) throw sectionsError

    return {
      data: {
        ...landingPage,
        sections: sections || []
      } as LandingPageWithSections,
      error: null
    }
  } catch (error) {
    console.error('Error fetching active landing page:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all landing pages (owner only)
 */
export async function getAllLandingPages() {
  try {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching landing pages:', error)
    return { data: [], error: error as Error }
  }
}

/**
 * Get landing page by ID with sections (owner only)
 */
export async function getLandingPageById(id: string) {
  try {
    const { data: landingPage, error: pageError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single()

    if (pageError) throw pageError

    const { data: sections, error: sectionsError } = await supabase
      .from('landing_sections')
      .select('*')
      .eq('landing_page_id', id)
      .order('order_index', { ascending: true })

    if (sectionsError) throw sectionsError

    return {
      data: {
        ...landingPage,
        sections: sections || []
      } as LandingPageWithSections,
      error: null
    }
  } catch (error) {
    console.error('Error fetching landing page:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create new landing page (owner only)
 */
export async function createLandingPage(data: {
  title: string
  subtitle: string
  is_active: boolean
}) {
  try {
    const { data: newPage, error } = await supabase
      .from('landing_pages')
      .insert([data])
      .select()
      .single()

    if (error) throw error

    return { data: newPage, error: null }
  } catch (error) {
    console.error('Error creating landing page:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update landing page (owner only)
 */
export async function updateLandingPage(
  id: string,
  data: Partial<LandingPage>
) {
  try {
    const { data: updatedPage, error } = await supabase
      .from('landing_pages')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data: updatedPage, error: null }
  } catch (error) {
    console.error('Error updating landing page:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete landing page (owner only)
 */
export async function deleteLandingPage(id: string) {
  try {
    // Delete all sections first
    const { error: sectionsError } = await supabase
      .from('landing_sections')
      .delete()
      .eq('landing_page_id', id)

    if (sectionsError) throw sectionsError

    // Then delete the page
    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting landing page:', error)
    return { error: error as Error }
  }
}

/**
 * Create landing section (owner only)
 */
export async function createLandingSection(data: {
  landing_page_id: string
  section_type: string
  title: string
  content: any
  order_index: number
  is_visible: boolean
}) {
  try {
    const { data: newSection, error } = await supabase
      .from('landing_sections')
      .insert([data])
      .select()
      .single()

    if (error) throw error

    return { data: newSection, error: null }
  } catch (error) {
    console.error('Error creating landing section:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update landing section (owner only)
 */
export async function updateLandingSection(
  id: string,
  data: Partial<LandingSection>
) {
  try {
    const { data: updatedSection, error } = await supabase
      .from('landing_sections')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { data: updatedSection, error: null }
  } catch (error) {
    console.error('Error updating landing section:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Delete landing section (owner only)
 */
export async function deleteLandingSection(id: string) {
  try {
    const { error } = await supabase
      .from('landing_sections')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting landing section:', error)
    return { error: error as Error }
  }
}

/**
 * Reorder sections (owner only)
 */
export async function reorderLandingSections(
  sections: { id: string; order_index: number }[]
) {
  try {
    const updates = sections.map(section =>
      supabase
        .from('landing_sections')
        .update({ order_index: section.order_index })
        .eq('id', section.id)
    )

    await Promise.all(updates)

    return { error: null }
  } catch (error) {
    console.error('Error reordering sections:', error)
    return { error: error as Error }
  }
}

/**
 * Set active landing page (owner only)
 */
export async function setActiveLandingPage(id: string) {
  try {
    // First, set all pages to inactive
    const { error: deactivateError } = await supabase
      .from('landing_pages')
      .update({ is_active: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    if (deactivateError) throw deactivateError

    // Then activate the selected page
    const { error: activateError } = await supabase
      .from('landing_pages')
      .update({ is_active: true })
      .eq('id', id)

    if (activateError) throw activateError

    return { error: null }
  } catch (error) {
    console.error('Error setting active landing page:', error)
    return { error: error as Error }
  }
}

