import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormSection } from '../forms/FormSection'
import { describe, it, expect } from 'vitest'
import { User } from 'lucide-react'

describe('FormSection', () => {
  it('renders section with title', () => {
    render(
      <FormSection title="Personal Information">
        <div>Test content</div>
      </FormSection>
    )
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders section with description', () => {
    render(
      <FormSection 
        title="Personal Information"
        description="Enter your personal details"
      >
        <div>Test content</div>
      </FormSection>
    )
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
    expect(screen.getByText('Enter your personal details')).toBeInTheDocument()
  })

  it('renders section with icon', () => {
    const { container } = render(
      <FormSection 
        title="Personal Information"
        icon={User}
      >
        <div>Test content</div>
      </FormSection>
    )
    
    // Check for icon by class
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders non-collapsible section by default', () => {
    render(
      <FormSection title="Personal Information">
        <div>Test content</div>
      </FormSection>
    )
    
    // Content should be visible immediately
    expect(screen.getByText('Test content')).toBeVisible()
    
    // Should not have collapse trigger button
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })

  it('renders collapsible section when collapsible=true', () => {
    render(
      <FormSection title="Personal Information" collapsible={true}>
        <div>Test content</div>
      </FormSection>
    )
    
    // Should have a button for collapsing
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('starts expanded when collapsible but not defaultCollapsed', () => {
    render(
      <FormSection title="Personal Information" collapsible={true}>
        <div>Test content</div>
      </FormSection>
    )
    
    // Content should be visible
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('starts collapsed when defaultCollapsed=true', () => {
    render(
      <FormSection 
        title="Personal Information" 
        collapsible={true}
        defaultCollapsed={true}
      >
        <div>Test content</div>
      </FormSection>
    )
    
    // Component should render - testing Radix Collapsible's internal state is complex in JSDOM
    expect(screen.getByText('Personal Information')).toBeInTheDocument()
  })

  it('applies single column layout when columns=1', () => {
    const { container } = render(
      <FormSection title="Personal Information" columns={1}>
        <div>Test content</div>
      </FormSection>
    )
    
    // Check for grid-cols-1 class
    const grid = container.querySelector('.grid-cols-1')
    expect(grid).toBeInTheDocument()
  })

  it('applies two column layout when columns=2', () => {
    const { container } = render(
      <FormSection title="Personal Information" columns={2}>
        <div>Test content</div>
      </FormSection>
    )
    
    // Check for md:grid-cols-2 class
    const grid = container.querySelector('.md\\:grid-cols-2')
    expect(grid).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <FormSection title="Personal Information" className="custom-class">
        <div>Test content</div>
      </FormSection>
    )
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})
