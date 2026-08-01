'use client'

import { useState, useEffect } from 'react'
import { LandingComponent } from '@/lib/types/landing-components'
import { supabase } from '@/lib/supabase/client'
import TextCard from '@/components/ui/TextCard'
import TextButton from '@/components/ui/TextButton'
import TextHierarchy from '@/components/ui/TextHierarchy'
import TextBadge from '@/components/ui/TextBadge'

interface ComponentListProps {
  landingPageId: string
  onEditComponent: (component: LandingComponent) => void
  onDeleteComponent: (componentId: string) => void
  onReorderComponents: (components: LandingComponent[]) => void
}

export default function ComponentList({ 
  landingPageId, 
  onEditComponent, 
  onDeleteComponent, 
  onReorderComponents 
}: ComponentListProps) {
  const [components, setComponents] = useState<LandingComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null)

  useEffect(() => {
    loadComponents()
  }, [landingPageId])

  const loadComponents = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/landing/components?landing_page_id=${landingPageId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load components')
      }

      const data = await response.json()
      setComponents(data.components || [])
    } catch (error) {
      console.error('Error loading components:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('No session found')
        return
      }

      const response = await fetch(`/api/landing/components/${componentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete component')
      }

      setComponents(prev => prev.filter(c => c.id !== componentId))
      onDeleteComponent(componentId)
    } catch (error) {
      console.error('Error deleting component:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleToggleVisibility = async (component: LandingComponent) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('No session found')
        return
      }

      const response = await fetch(`/api/landing/components/${component.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          is_visible: !component.is_visible
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update component')
      }

      setComponents(prev => prev.map(c => 
        c.id === component.id 
          ? { ...c, is_visible: !c.is_visible }
          : c
      ))
    } catch (error) {
      console.error('Error updating component:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleDragStart = (e: React.DragEvent, componentId: string) => {
    setDraggedComponent(componentId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetComponentId: string) => {
    e.preventDefault()
    
    if (!draggedComponent || draggedComponent === targetComponentId) {
      return
    }

    const draggedIndex = components.findIndex(c => c.id === draggedComponent)
    const targetIndex = components.findIndex(c => c.id === targetComponentId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    const newComponents = [...components]
    const [draggedItem] = newComponents.splice(draggedIndex, 1)
    newComponents.splice(targetIndex, 0, draggedItem)

    // Update order indices
    const updatedComponents = newComponents.map((component, index) => ({
      ...component,
      order_index: index
    }))

    setComponents(updatedComponents)
    onReorderComponents(updatedComponents)
    setDraggedComponent(null)
  }

  const getComponentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      hero: '🎯',
      cta: '🔘',
      features: '⭐',
      process: '📋',
      testimonials: '💬',
      pricing: '💰',
      contact: '📧',
      gallery: '🖼️',
      stats: '📊',
      team: '👥',
      faq: '❓',
      newsletter: '📰',
      social: '🔗',
      info: 'ℹ️',
      custom: '⚙️'
    }
    return icons[type] || '📄'
  }

  const getComponentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hero: 'Hero Section',
      cta: 'Call to Action',
      features: 'Features',
      process: 'Process',
      testimonials: 'Testimonials',
      pricing: 'Pricing',
      contact: 'Contact Form',
      gallery: 'Gallery',
      stats: 'Statistics',
      team: 'Team',
      faq: 'FAQ',
      newsletter: 'Newsletter',
      social: 'Social Links',
      info: 'Info Section',
      custom: 'Custom'
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <TextCard title="COMPONENTS">
        <div className="flex items-center justify-center py-8">
          <TextBadge variant="default">Loading components...</TextBadge>
        </div>
      </TextCard>
    )
  }

  if (error) {
    return (
      <TextCard title="COMPONENTS">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <TextHierarchy level={3} className="text-red-800">Error: {error}</TextHierarchy>
          <TextButton
            variant="default"
            onClick={loadComponents}
            className="mt-2"
          >
            RETRY
          </TextButton>
        </div>
      </TextCard>
    )
  }

  if (components.length === 0) {
    return (
      <TextCard title="COMPONENTS">
        <div className="text-center py-8">
          <TextHierarchy level={2} muted>No components yet</TextHierarchy>
          <TextHierarchy level={3} muted className="mt-2">
            Create your first component to get started
          </TextHierarchy>
        </div>
      </TextCard>
    )
  }

  return (
    <TextCard title="COMPONENTS">
      <div className="space-y-3">
        {components.map((component, index) => (
          <div
            key={component.id}
            draggable
            onDragStart={(e) => handleDragStart(e, component.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, component.id)}
            className={`p-4 border-2 rounded transition-all ${
              component.is_visible 
                ? 'border-gray-300 bg-white' 
                : 'border-gray-200 bg-gray-50 opacity-60'
            } ${
              draggedComponent === component.id ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getComponentTypeIcon(component.component_type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <TextHierarchy level={3} emphasis>
                      {component.component_name}
                    </TextHierarchy>
                    <TextBadge variant="muted">
                      {getComponentTypeLabel(component.component_type)}
                    </TextBadge>
                    {!component.is_visible && (
                      <TextBadge variant="warning">Hidden</TextBadge>
                    )}
                  </div>
                  {component.title && (
                    <TextHierarchy level={4} muted className="mt-1">
                      {component.title}
                    </TextHierarchy>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Width: {component.width}/12</span>
                    <span>Height: {component.height}</span>
                    <span>Order: {component.order_index}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TextButton
                  variant="default"
                  onClick={() => handleToggleVisibility(component)}
                >
                  {component.is_visible ? 'HIDE' : 'SHOW'}
                </TextButton>
                <TextButton
                  variant="default"
                  onClick={() => onEditComponent(component)}
                >
                  EDIT
                </TextButton>
                <TextButton
                  variant="warning"
                  onClick={() => handleDelete(component.id)}
                >
                  DELETE
                </TextButton>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <TextHierarchy level={4} className="text-blue-800">
          💡 Drag and drop components to reorder them
        </TextHierarchy>
      </div>
    </TextCard>
  )
}
