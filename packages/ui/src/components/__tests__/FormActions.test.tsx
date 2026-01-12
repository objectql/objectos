import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormActions } from '../forms/FormActions'
import { describe, it, expect, vi } from 'vitest'

describe('FormActions', () => {
  it('renders save button by default', () => {
    const onSave = vi.fn()
    render(<FormActions onSave={onSave} />)
    
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('calls onSave when save button is clicked', () => {
    const onSave = vi.fn()
    render(<FormActions onSave={onSave} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('renders cancel button when onCancel is provided', () => {
    const onCancel = vi.fn()
    render(<FormActions onSave={vi.fn()} onCancel={onCancel} />)
    
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<FormActions onSave={vi.fn()} onCancel={onCancel} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders Save & New button when onSaveAndNew is provided', () => {
    const onSaveAndNew = vi.fn()
    render(<FormActions onSave={vi.fn()} onSaveAndNew={onSaveAndNew} />)
    
    expect(screen.getByRole('button', { name: 'Save & New' })).toBeInTheDocument()
  })

  it('calls onSaveAndNew when Save & New button is clicked', () => {
    const onSaveAndNew = vi.fn()
    render(<FormActions onSave={vi.fn()} onSaveAndNew={onSaveAndNew} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Save & New' }))
    expect(onSaveAndNew).toHaveBeenCalledTimes(1)
  })

  it('hides cancel button when hideCancel is true', () => {
    render(<FormActions onSave={vi.fn()} onCancel={vi.fn()} hideCancel={true} />)
    
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('hides Save & New button when hideSaveAndNew is true', () => {
    render(<FormActions onSave={vi.fn()} onSaveAndNew={vi.fn()} hideSaveAndNew={true} />)
    
    expect(screen.queryByRole('button', { name: 'Save & New' })).not.toBeInTheDocument()
  })

  it('shows loading state when isSubmitting is true', () => {
    render(<FormActions onSave={vi.fn()} isSubmitting={true} />)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('disables all buttons when isSubmitting is true', () => {
    render(
      <FormActions 
        onSave={vi.fn()} 
        onCancel={vi.fn()} 
        onSaveAndNew={vi.fn()}
        isSubmitting={true} 
      />
    )
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('uses custom button text when provided', () => {
    render(
      <FormActions 
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onSaveAndNew={vi.fn()}
        saveText="Submit"
        cancelText="Back"
        saveAndNewText="Submit & Create Another"
      />
    )
    
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit & Create Another' })).toBeInTheDocument()
  })

  it('shows validation error count when errorCount is provided', () => {
    render(<FormActions onSave={vi.fn()} errorCount={3} />)
    
    expect(screen.getByText('Please fix 3 errors before saving')).toBeInTheDocument()
  })

  it('shows singular error message when errorCount is 1', () => {
    render(<FormActions onSave={vi.fn()} errorCount={1} />)
    
    expect(screen.getByText('Please fix 1 error before saving')).toBeInTheDocument()
  })

  it('disables save buttons when there are errors', () => {
    render(<FormActions onSave={vi.fn()} onSaveAndNew={vi.fn()} errorCount={2} />)
    
    const saveButton = screen.getByRole('button', { name: 'Save' })
    const saveAndNewButton = screen.getByRole('button', { name: 'Save & New' })
    
    expect(saveButton).toBeDisabled()
    expect(saveAndNewButton).toBeDisabled()
  })

  it('does not disable cancel button when there are errors', () => {
    render(<FormActions onSave={vi.fn()} onCancel={vi.fn()} errorCount={2} />)
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    expect(cancelButton).not.toBeDisabled()
  })

  it('aligns buttons to the left when align="left"', () => {
    const { container } = render(<FormActions onSave={vi.fn()} align="left" />)
    
    expect(container.querySelector('.justify-start')).toBeInTheDocument()
  })

  it('aligns buttons to the center when align="center"', () => {
    const { container } = render(<FormActions onSave={vi.fn()} align="center" />)
    
    expect(container.querySelector('.justify-center')).toBeInTheDocument()
  })

  it('aligns buttons to the right by default', () => {
    const { container } = render(<FormActions onSave={vi.fn()} />)
    
    expect(container.querySelector('.justify-end')).toBeInTheDocument()
  })
})
