'use client'

import { useState, useEffect } from 'react'
import { LandingComponent, ComponentType, CreateComponentData, ComponentTemplate } from '@/lib/types/landing-components'
import { supabase } from '@/lib/supabase/client'
import TextCard from '@/components/ui/TextCard'
import TextButton from '@/components/ui/TextButton'
import TextHierarchy from '@/components/ui/TextHierarchy'
import TextBadge from '@/components/ui/TextBadge'

interface ComponentEditorProps {
  landingPageId: string
  onComponentCreated: (component: LandingComponent) => void
  onCancel: () => void
}

export default function ComponentEditor({ landingPageId, onComponentCreated, onCancel }: ComponentEditorProps) {
  const [selectedType, setSelectedType] = useState<ComponentType>('cta')
  const [templates, setTemplates] = useState<ComponentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ComponentTemplate | null>(null)
  const [componentData, setComponentData] = useState<CreateComponentData>({
    landing_page_id: landingPageId,
    component_type: 'cta',
    component_name: '',
    title: '',
    subtitle: '',
    content: '',
    properties: {},
    position_x: 0,
    position_y: 0,
    width: 12,
    height: 1,
    order_index: 0,
    background_color: '#ffffff',
    text_color: '#000000',
    is_visible: true,
    animation_type: 'none'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const componentTypes: { type: ComponentType; label: string; description: string }[] = [
    { type: 'hero', label: 'Hero Section', description: 'Main banner with title, subtitle and CTA' },
    { type: 'cta', label: 'Call to Action', description: 'Button or banner to drive action' },
    { type: 'features', label: 'Features', description: 'Showcase product features' },
    { type: 'process', label: 'Process', description: 'Step-by-step process explanation' },
    { type: 'testimonials', label: 'Testimonials', description: 'Customer reviews and feedback' },
    { type: 'pricing', label: 'Pricing', description: 'Pricing plans and packages' },
    { type: 'contact', label: 'Contact Form', description: 'Contact form for inquiries' },
    { type: 'gallery', label: 'Gallery', description: 'Image gallery or portfolio' },
    { type: 'stats', label: 'Statistics', description: 'Numbers and metrics display' },
    { type: 'team', label: 'Team', description: 'Team members showcase' },
    { type: 'faq', label: 'FAQ', description: 'Frequently asked questions' },
    { type: 'newsletter', label: 'Newsletter', description: 'Email subscription form' },
    { type: 'social', label: 'Social Links', description: 'Social media links' },
    { type: 'info', label: 'Info Section', description: 'General information content' },
    { type: 'custom', label: 'Custom', description: 'Custom HTML content' }
  ]

  useEffect(() => {
    loadTemplates()
  }, [selectedType])

  useEffect(() => {
    setComponentData(prev => ({
      ...prev,
      component_type: selectedType,
      component_name: selectedType.charAt(0).toUpperCase() + selectedType.slice(1) + ' Component'
    }))
  }, [selectedType])

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/landing/templates?component_type=${selectedType}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = (template: ComponentTemplate) => {
    setSelectedTemplate(template)
    setComponentData(prev => ({
      ...prev,
      component_name: template.template_name,
      title: template.template_data.title || '',
      subtitle: template.template_data.subtitle || '',
      background_color: template.template_data.background_color || '#ffffff',
      text_color: template.template_data.text_color || '#000000',
      animation_type: template.template_data.animation_type || 'none',
      properties: template.template_data
    }))
  }

  const handleInputChange = (field: string, value: any) => {
    setComponentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePropertyChange = (key: string, value: any) => {
    setComponentData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('No session found')
        return
      }

      const response = await fetch('/api/landing/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(componentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create component')
      }

      const data = await response.json()
      onComponentCreated(data.component)
    } catch (error) {
      console.error('Error creating component:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const renderComponentSpecificFields = () => {
    switch (selectedType) {
      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Button Text</label>
              <input
                type="text"
                value={componentData.properties?.button_text || ''}
                onChange={(e) => handlePropertyChange('button_text', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Get Started"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Button URL</label>
              <input
                type="url"
                value={componentData.properties?.button_url || ''}
                onChange={(e) => handlePropertyChange('button_url', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="/signup"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Button Style</label>
              <select
                value={componentData.properties?.button_style || 'primary'}
                onChange={(e) => handlePropertyChange('button_style', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
              </select>
            </div>
          </div>
        )
      
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Background Image URL</label>
              <input
                type="url"
                value={componentData.properties?.background_image || ''}
                onChange={(e) => handlePropertyChange('background_image', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Text Alignment</label>
              <select
                value={componentData.properties?.text_alignment || 'center'}
                onChange={(e) => handlePropertyChange('text_alignment', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        )
      
      case 'features':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Columns</label>
              <select
                value={componentData.properties?.columns || 3}
                onChange={(e) => handlePropertyChange('columns', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <TextCard title="CREATE COMPONENT">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Component Type Selection */}
          <div>
            <TextHierarchy level={2} emphasis className="mb-4">Component Type</TextHierarchy>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {componentTypes.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => setSelectedType(type.type)}
                  className={`p-4 border-2 rounded text-left transition-colors ${
                    selectedType === type.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <TextHierarchy level={2} emphasis className="mb-4">Choose Template</TextHierarchy>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 border-2 rounded text-left transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{template.template_name}</div>
                    {template.template_description && (
                      <div className="text-sm text-gray-600 mt-1">{template.template_description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Component Settings */}
          <div className="space-y-4">
            <TextHierarchy level={2} emphasis>Basic Settings</TextHierarchy>
            
            <div>
              <label className="block text-sm font-medium mb-2">Component Name</label>
              <input
                type="text"
                value={componentData.component_name}
                onChange={(e) => handleInputChange('component_name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={componentData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <input
                type="text"
                value={componentData.subtitle || ''}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={componentData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded h-24"
                placeholder="Component content..."
              />
            </div>
          </div>

          {/* Component-Specific Fields */}
          {renderComponentSpecificFields()}

          {/* Layout Settings */}
          <div className="space-y-4">
            <TextHierarchy level={2} emphasis>Layout Settings</TextHierarchy>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Width (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={componentData.width}
                  onChange={(e) => handleInputChange('width', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Height</label>
                <input
                  type="number"
                  min="1"
                  value={componentData.height}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <input
                  type="color"
                  value={componentData.background_color}
                  onChange={(e) => handleInputChange('background_color', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text Color</label>
                <input
                  type="color"
                  value={componentData.text_color}
                  onChange={(e) => handleInputChange('text_color', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <TextHierarchy level={3} className="text-red-800">Error: {error}</TextHierarchy>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <TextButton
              type="submit"
              variant="success"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'CREATE COMPONENT'}
            </TextButton>
            <TextButton
              type="button"
              variant="default"
              onClick={onCancel}
            >
              CANCEL
            </TextButton>
          </div>
        </form>
      </TextCard>
    </div>
  )
}
