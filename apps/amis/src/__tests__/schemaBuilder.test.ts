import { describe, it, expect } from 'vitest'
import {
  objectqlTypeToAmisFormType,
  objectqlTypeToAmisColumnType,
  buildAmisCRUDSchema,
} from '../utils/schemaBuilder'

describe('schemaBuilder', () => {
  describe('objectqlTypeToAmisFormType', () => {
    it('should map text to input-text', () => {
      expect(objectqlTypeToAmisFormType('text')).toBe('input-text')
    })

    it('should map email to input-email', () => {
      expect(objectqlTypeToAmisFormType('email')).toBe('input-email')
    })

    it('should map number to input-number', () => {
      expect(objectqlTypeToAmisFormType('number')).toBe('input-number')
    })

    it('should map currency to input-number', () => {
      expect(objectqlTypeToAmisFormType('currency')).toBe('input-number')
    })

    it('should map select to select', () => {
      expect(objectqlTypeToAmisFormType('select')).toBe('select')
    })

    it('should map checkbox to checkbox', () => {
      expect(objectqlTypeToAmisFormType('checkbox')).toBe('checkbox')
    })

    it('should map date to input-date', () => {
      expect(objectqlTypeToAmisFormType('date')).toBe('input-date')
    })

    it('should map datetime to input-datetime', () => {
      expect(objectqlTypeToAmisFormType('datetime')).toBe('input-datetime')
    })

    it('should map lookup to select', () => {
      expect(objectqlTypeToAmisFormType('lookup')).toBe('select')
    })

    it('should default to input-text for unknown types', () => {
      expect(objectqlTypeToAmisFormType('unknown-type')).toBe('input-text')
    })
  })

  describe('objectqlTypeToAmisColumnType', () => {
    it('should map text to text', () => {
      expect(objectqlTypeToAmisColumnType('text')).toBe('text')
    })

    it('should map url to link', () => {
      expect(objectqlTypeToAmisColumnType('url')).toBe('link')
    })

    it('should map number to number', () => {
      expect(objectqlTypeToAmisColumnType('number')).toBe('number')
    })

    it('should map checkbox to status', () => {
      expect(objectqlTypeToAmisColumnType('checkbox')).toBe('status')
    })

    it('should map date to date', () => {
      expect(objectqlTypeToAmisColumnType('date')).toBe('date')
    })

    it('should map datetime to datetime', () => {
      expect(objectqlTypeToAmisColumnType('datetime')).toBe('datetime')
    })

    it('should map image to image', () => {
      expect(objectqlTypeToAmisColumnType('image')).toBe('image')
    })

    it('should default to text for unknown types', () => {
      expect(objectqlTypeToAmisColumnType('unknown-type')).toBe('text')
    })
  })

  describe('buildAmisCRUDSchema', () => {
    const mockObjectMeta = {
      name: 'contacts',
      label: 'Contact',
      fields: {
        first_name: {
          type: 'text',
          label: 'First Name',
          required: true,
        },
        email: {
          type: 'email',
          label: 'Email',
          required: true,
        },
        age: {
          type: 'number',
          label: 'Age',
          min: 0,
          max: 150,
        },
        is_active: {
          type: 'checkbox',
          label: 'Active',
        },
        amount: {
          type: 'currency',
          label: 'Amount',
        },
      },
    }

    it('should build a complete CRUD schema', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')

      expect(schema.type).toBe('page')
      expect(schema.title).toBe('Contact')
      expect(schema.body.type).toBe('crud')
    })

    it('should include all field columns', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const columns = schema.body.columns

      expect(columns.length).toBeGreaterThan(4) // 5 fields + operation column
      expect(columns.find((c: any) => c.name === 'first_name')).toBeDefined()
      expect(columns.find((c: any) => c.name === 'email')).toBeDefined()
      expect(columns.find((c: any) => c.name === 'age')).toBeDefined()
      expect(columns.find((c: any) => c.name === 'is_active')).toBeDefined()
      expect(columns.find((c: any) => c.name === 'amount')).toBeDefined()
    })

    it('should configure checkbox column with status map', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const checkboxColumn = schema.body.columns.find((c: any) => c.name === 'is_active')

      expect(checkboxColumn.type).toBe('status')
      expect(checkboxColumn.map).toBeDefined()
      expect(checkboxColumn.map.true).toContain('是')
      expect(checkboxColumn.map.false).toContain('否')
    })

    it('should configure currency column with prefix', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const currencyColumn = schema.body.columns.find((c: any) => c.name === 'amount')

      expect(currencyColumn.prefix).toBe('$')
    })

    it('should create form fields with proper types', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body

      expect(formFields.length).toBe(5)
      expect(formFields.find((f: any) => f.name === 'first_name').type).toBe('input-text')
      expect(formFields.find((f: any) => f.name === 'email').type).toBe('input-email')
      expect(formFields.find((f: any) => f.name === 'age').type).toBe('input-number')
      expect(formFields.find((f: any) => f.name === 'is_active').type).toBe('checkbox')
    })

    it('should mark required fields', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body

      const firstNameField = formFields.find((f: any) => f.name === 'first_name')
      const emailField = formFields.find((f: any) => f.name === 'email')
      const ageField = formFields.find((f: any) => f.name === 'age')

      expect(firstNameField.required).toBe(true)
      expect(emailField.required).toBe(true)
      expect(ageField.required).toBe(false)
    })

    it('should include min/max for number fields', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body

      const ageField = formFields.find((f: any) => f.name === 'age')

      expect(ageField.min).toBe(0)
      expect(ageField.max).toBe(150)
    })

    it('should include pagination configuration', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')

      expect(schema.body.perPage).toBe(20)
      expect(schema.body.perPageAvailable).toEqual([10, 20, 50, 100])
    })

    it('should include bulk delete action', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')
      const bulkActions = schema.body.bulkActions

      expect(bulkActions).toBeDefined()
      expect(bulkActions.length).toBeGreaterThan(0)
      expect(bulkActions[0].label).toBe('批量删除')
    })

    it('should include filter configuration', () => {
      const schema = buildAmisCRUDSchema(mockObjectMeta, '/api/data/contacts')

      expect(schema.body.filter).toBeDefined()
      expect(schema.body.filter.title).toBe('筛选')
      expect(schema.body.filter.body.length).toBeGreaterThan(0)
    })

    it('should handle select field with options', () => {
      const metaWithSelect = {
        name: 'users',
        label: 'User',
        fields: {
          status: {
            type: 'select',
            label: 'Status',
            options: ['Active', 'Inactive', 'Pending'],
          },
        },
      }

      const schema = buildAmisCRUDSchema(metaWithSelect, '/api/data/users')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const statusField = formFields.find((f: any) => f.name === 'status')

      expect(statusField.options).toBeDefined()
      expect(statusField.options.length).toBe(3)
      expect(statusField.options[0]).toEqual({ label: 'Active', value: 'Active' })
    })

    it('should handle lookup field with reference', () => {
      const metaWithLookup = {
        name: 'orders',
        label: 'Order',
        fields: {
          customer: {
            type: 'lookup',
            label: 'Customer',
            reference_to: 'customers',
          },
        },
      }

      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const customerField = formFields.find((f: any) => f.name === 'customer')

      expect(customerField.type).toBe('select')
      expect(customerField.source).toBeDefined()
      expect(customerField.source.url).toContain('/api/data/customers')
      expect(customerField.labelField).toBe('name')
      expect(customerField.valueField).toBe('_id')
    })
  })
})
