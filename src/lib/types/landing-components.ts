// Landing Page Component Types
// WordPress-like component system interfaces

export interface LandingComponent {
  id: string
  landing_page_id: string
  
  // Component Identity
  component_type: ComponentType
  component_name: string
  component_slug?: string
  
  // Content and Data
  title?: string
  subtitle?: string
  content?: string
  data?: Record<string, any>
  
  // Layout and Positioning
  position_x: number
  position_y: number
  width: number
  height: number
  order_index: number
  
  // Styling and Appearance
  background_color: string
  text_color: string
  border_color: string
  border_width: number
  border_radius: number
  padding_top: number
  padding_bottom: number
  padding_left: number
  padding_right: number
  margin_top: number
  margin_bottom: number
  margin_left: number
  margin_right: number
  
  // Responsive Design
  mobile_width: number
  tablet_width: number
  desktop_width: number
  
  // Visibility and State
  is_visible: boolean
  is_mobile_visible: boolean
  is_tablet_visible: boolean
  is_desktop_visible: boolean
  
  // Animation and Effects
  animation_type: AnimationType
  animation_delay: number
  animation_duration: number
  
  // SEO and Accessibility
  alt_text?: string
  aria_label?: string
  meta_description?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Properties (from component_properties table)
  properties?: Record<string, any>
}

export interface ComponentProperty {
  id: string
  component_id: string
  property_key: string
  property_value?: string
  property_type: PropertyType
  is_required: boolean
  created_at: string
  updated_at: string
}

export interface ComponentTemplate {
  id: string
  template_name: string
  template_description?: string
  component_type: ComponentType
  template_data: Record<string, any>
  is_global: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// Component Types
export type ComponentType = 
  | 'hero' 
  | 'welcome' 
  | 'features' 
  | 'process' 
  | 'cta' 
  | 'info' 
  | 'custom'
  | 'testimonials' 
  | 'pricing' 
  | 'contact' 
  | 'gallery' 
  | 'stats' 
  | 'team'
  | 'faq' 
  | 'newsletter' 
  | 'social' 
  | 'navigation' 
  | 'footer' 
  | 'header'

// Animation Types
export type AnimationType = 
  | 'none' 
  | 'fadeIn' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight'
  | 'zoomIn' 
  | 'zoomOut' 
  | 'bounce' 
  | 'pulse' 
  | 'shake' 
  | 'flip'

// Property Types
export type PropertyType = 
  | 'text' 
  | 'number' 
  | 'boolean' 
  | 'url' 
  | 'email' 
  | 'color' 
  | 'image' 
  | 'json'

// Component-specific property interfaces
export interface CTAButtonProperties {
  button_text: string
  button_url: string
  button_style: 'primary' | 'secondary' | 'outline' | 'ghost'
  button_size: 'small' | 'medium' | 'large'
  button_target: '_self' | '_blank'
  icon?: string
  icon_position: 'left' | 'right' | 'none'
}

export interface HeroSectionProperties {
  background_image?: string
  background_overlay?: string
  overlay_opacity: number
  text_alignment: 'left' | 'center' | 'right'
  cta_buttons: CTAButtonProperties[]
}

export interface FeaturesSectionProperties {
  features: Array<{
    title: string
    description: string
    icon?: string
    image?: string
  }>
  columns: 1 | 2 | 3 | 4
  layout: 'grid' | 'list' | 'carousel'
}

export interface ProcessSectionProperties {
  steps: Array<{
    title: string
    description: string
    icon?: string
    number?: number
  }>
  layout: 'horizontal' | 'vertical' | 'timeline'
  show_numbers: boolean
}

export interface TestimonialsProperties {
  testimonials: Array<{
    name: string
    role: string
    company?: string
    content: string
    avatar?: string
    rating?: number
  }>
  layout: 'grid' | 'carousel' | 'single'
  show_ratings: boolean
}

export interface PricingProperties {
  plans: Array<{
    name: string
    price: string
    period: string
    features: string[]
    cta_text: string
    cta_url: string
    popular?: boolean
  }>
  layout: 'grid' | 'comparison'
  currency: string
}

export interface ContactProperties {
  form_fields: Array<{
    name: string
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select'
    label: string
    placeholder?: string
    required: boolean
    options?: string[]
  }>
  submit_text: string
  success_message: string
  email_to: string
}

export interface GalleryProperties {
  images: Array<{
    url: string
    alt: string
    caption?: string
  }>
  layout: 'grid' | 'masonry' | 'carousel'
  columns: 1 | 2 | 3 | 4
  show_captions: boolean
  lightbox: boolean
}

export interface StatsProperties {
  stats: Array<{
    number: string
    label: string
    suffix?: string
    prefix?: string
  }>
  layout: 'horizontal' | 'vertical'
  animation: boolean
}

export interface TeamProperties {
  members: Array<{
    name: string
    role: string
    bio?: string
    avatar: string
    social_links?: {
      twitter?: string
      linkedin?: string
      github?: string
    }
  }>
  layout: 'grid' | 'list'
  columns: 1 | 2 | 3 | 4
}

export interface FAQProperties {
  questions: Array<{
    question: string
    answer: string
    expanded?: boolean
  }>
  layout: 'accordion' | 'list'
  allow_multiple: boolean
}

export interface NewsletterProperties {
  title: string
  description: string
  placeholder: string
  button_text: string
  success_message: string
  email_service: 'mailchimp' | 'convertkit' | 'custom'
  api_key?: string
  list_id?: string
}

export interface SocialProperties {
  platforms: Array<{
    name: string
    url: string
    icon: string
  }>
  layout: 'horizontal' | 'vertical'
  show_labels: boolean
}

// Component creation data
export interface CreateComponentData {
  landing_page_id: string
  component_type: ComponentType
  component_name: string
  title?: string
  subtitle?: string
  content?: string
  properties?: Record<string, any>
  position_x?: number
  position_y?: number
  width?: number
  height?: number
  order_index?: number
  background_color?: string
  text_color?: string
  is_visible?: boolean
  animation_type?: AnimationType
}

// Component update data
export interface UpdateComponentData extends Partial<CreateComponentData> {
  id: string
}

// Template creation data
export interface CreateTemplateData {
  template_name: string
  template_description?: string
  component_type: ComponentType
  template_data: Record<string, any>
  is_global?: boolean
}
