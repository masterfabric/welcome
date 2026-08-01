import * as landingClient from '@/lib/supabase/landing'

export type {
  LandingPage,
  LandingSection,
  LandingPageWithSections
} from '@/lib/supabase/landing'

export {
  getActiveLandingPage,
  getAllLandingPages,
  getLandingPageById,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  createLandingSection,
  updateLandingSection,
  deleteLandingSection,
  reorderLandingSections,
  setActiveLandingPage
} from '@/lib/supabase/landing'

