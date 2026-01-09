import * as React from "react"
import { GridView, SortConfig } from "../components/grid/GridView"
import { Toolbar, ViewSwitcher, ToolbarIcons } from "../components/Toolbar"
import { Button } from "../components/Button"
import { Badge } from "../components/Badge"
import { Modal } from "../components/Modal"
import { AutoForm } from "../components/AutoForm"

// Example: Airtable-like CRM/Project Management Page
// This demonstrates all the UI components working together

const sampleColumns = [
  { id: 'name', label: 'Name', type: 'text' as const, width: 200, editable: true },
  { id: 'email', label: 'Email', type: 'text' as const, width: 200, editable: true },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'badge' as const, 
    width: 120,
    options: [
      { value: 'active', label: 'Active', variant: 'success' as const },
      { value: 'pending', label: 'Pending', variant: 'warning' as const },
      { value: 'inactive', label: 'Inactive', variant: 'default' as const },
    ]
  },
  { 
    id: 'priority', 
    label: 'Priority', 
    type: 'badge' as const, 
    width: 100,
    options: [
      { value: 'high', label: 'High', variant: 'danger' as const },
      { value: 'medium', label: 'Medium', variant: 'warning' as const },
      { value: 'low', label: 'Low', variant: 'info' as const },
    ]
  },
  { id: 'startDate', label: 'Start Date', type: 'date' as const, width: 150 },
  { id: 'budget', label: 'Budget', type: 'number' as const, width: 120, editable: true },
  { id: 'completed', label: 'Completed', type: 'boolean' as const, width: 100 },
]

const sampleData = [
  {
    id: 1,
    name: 'Website Redesign',
    email: 'contact@acme.com',
    status: 'active',
    priority: 'high',
    startDate: '2024-01-15',
    budget: 50000,
    completed: false,
  },
  {
    id: 2,
    name: 'Mobile App Development',
    email: 'dev@startup.io',
    status: 'active',
    priority: 'high',
    startDate: '2024-02-01',
    budget: 120000,
    completed: false,
  },
  {
    id: 3,
    name: 'Marketing Campaign',
    email: 'marketing@brand.com',
    status: 'pending',
    priority: 'medium',
    startDate: '2024-03-10',
    budget: 25000,
    completed: false,
  },
  {
    id: 4,
    name: 'Database Migration',
    email: 'tech@enterprise.net',
    status: 'active',
    priority: 'high',
    startDate: '2024-01-20',
    budget: 80000,
    completed: true,
  },
  {
    id: 5,
    name: 'Content Creation',
    email: 'content@media.co',
    status: 'inactive',
    priority: 'low',
    startDate: '2024-04-01',
    budget: 15000,
    completed: false,
  },
]

const sampleSchema = {
  name: 'Projects',
  fields: {
    name: { type: 'string', label: 'Project Name', required: true },
    email: { type: 'string', label: 'Contact Email', required: true },
    status: { 
      type: 'select', 
      label: 'Status', 
      options: ['active', 'pending', 'inactive'],
      defaultValue: 'pending'
    },
    priority: { 
      type: 'select', 
      label: 'Priority', 
      options: ['high', 'medium', 'low'],
      defaultValue: 'medium'
    },
    startDate: { type: 'date', label: 'Start Date' },
    budget: { type: 'number', label: 'Budget ($)' },
    completed: { type: 'boolean', label: 'Completed', defaultValue: false },
  }
}

export function AirtableExample() {
  const [data, setData] = React.useState(sampleData)
  const [activeView, setActiveView] = React.useState('grid')
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [sorts, setSorts] = React.useState<SortConfig[]>([])

  const handleCellEdit = (rowIndex: number, columnId: string, value: any) => {
    const newData = [...data]
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value }
    setData(newData)
  }

  const handleDelete = (row: any, index: number) => {
    if (confirm(`Delete "${row.name}"?`)) {
      setData(data.filter((_, i) => i !== index))
    }
  }

  const handleCreate = (formData: any) => {
    const newRecord = {
      id: Math.max(...data.map(d => d.id)) + 1,
      ...formData,
    }
    setData([...data, newRecord])
    setShowCreateModal(false)
  }

  const handleSortChange = (newSorts: SortConfig[]) => {
    setSorts(newSorts)
    console.log('Sorts changed:', newSorts)
  }

  const getSortDescription = () => {
    if (sorts.length === 0) return 'No sorting applied'
    return sorts.map((s, i) => {
      const column = sampleColumns.find(c => c.id === s.columnId)
      return `${i + 1}. ${column?.label} (${s.direction === 'asc' ? '↑' : '↓'})`
    }).join(', ')
  }

  const views = [
    { id: 'grid', label: 'Grid', icon: <ToolbarIcons.Grid /> },
    { id: 'list', label: 'List', icon: <ToolbarIcons.List /> },
  ]

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      <Toolbar
        title="Projects Database"
        subtitle={`${data.length} records`}
      >
        <ViewSwitcher
          views={views}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <Button
          variant="secondary"
          onClick={() => alert('Filter functionality')}
        >
          <ToolbarIcons.Filter />
          <span className="ml-2">Filter</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => alert(getSortDescription())}
          title={getSortDescription()}
        >
          <ToolbarIcons.Sort />
          <span className="ml-2">Sort {sorts.length > 0 && `(${sorts.length})`}</span>
        </Button>
        <Button onClick={() => setShowCreateModal(true)}>
          <ToolbarIcons.Plus />
          <span className="ml-2">New Record</span>
        </Button>
      </Toolbar>

      <div className="flex-1 overflow-auto p-6">
        {activeView === 'grid' ? (
          <div className="space-y-3">
            {sorts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-900">
                <strong>Active sorts:</strong> {getSortDescription()}
                <span className="ml-2 text-xs text-blue-700">(Click column headers to sort, Shift+Click for multi-column)</span>
              </div>
            )}
            <GridView
              columns={sampleColumns}
              data={data}
              onCellEdit={handleCellEdit}
              onDelete={handleDelete}
              onSortChange={handleSortChange}
              enableSorting={true}
              emptyMessage="No projects found. Create one to get started!"
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-stone-200 p-8 text-center text-stone-500">
            <p>List view coming soon...</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <AutoForm
          schema={sampleSchema}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  )
}
