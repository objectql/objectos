import { render, screen, waitFor } from '@testing-library/react'
import { ObjectGridTable } from '../object-grid-table'
import { ObjectConfig } from '@objectql/types'
import { describe, it, expect } from 'vitest'

const mockConfig: ObjectConfig = {
  name: 'testObject',
  fields: {
    name: { type: 'string', label: 'Name' },
    age: { type: 'integer', label: 'Age' }
  }
}

const mockData = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 }
]

describe('ObjectGridTable', () => {
  it('renders the grid container', () => {
    const { container } = render(
      <div style={{ height: 500, width: 800 }}>
        <ObjectGridTable objectConfig={mockConfig} data={mockData} />
      </div>
    )
    // Check for the theme class which we apply to the wrapper
    expect(container.querySelector('.ag-theme-alpine')).toBeInTheDocument()
  })

  // Testing AG Grid internals in JSDOM is notoriously flaky because it virtualizes everything
  // and relies on real layout calculation. We mainly check if the component mounts.
})
