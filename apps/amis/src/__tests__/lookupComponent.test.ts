import { describe, it, expect } from 'vitest'
import { buildAmisCRUDSchema } from '../utils/schemaBuilder'

describe('Lookup Component Tests', () => {
  describe('Basic Lookup Field', () => {
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

    it('should configure lookup field as select with source', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const customerField = formFields.find((f: any) => f.name === 'customer')

      expect(customerField.type).toBe('select')
      expect(customerField.source).toBeDefined()
      expect(customerField.source.url).toContain('/api/data/customers/query')
    })

    it('should enable search and clear for lookup fields', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const customerField = formFields.find((f: any) => f.name === 'customer')

      expect(customerField.searchable).toBe(true)
      expect(customerField.clearable).toBe(true)
    })

    it('should configure label and value fields', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const customerField = formFields.find((f: any) => f.name === 'customer')

      expect(customerField.labelField).toBe('name')
      expect(customerField.valueField).toBe('_id')
    })

    it('should use adaptor to transform API response', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const customerField = formFields.find((f: any) => f.name === 'customer')

      expect(customerField.source.adaptor).toBeDefined()
      expect(customerField.source.adaptor).toContain('payload.data')
    })
  })

  describe('Lookup Field with Custom Configuration', () => {
    const metaWithCustomLookup = {
      name: 'tasks',
      label: 'Task',
      fields: {
        assignee: {
          type: 'lookup',
          label: 'Assignee',
          reference_to: 'users',
          label_field: 'full_name',
          value_field: 'user_id',
          reference_fields: ['user_id', 'full_name', 'email'],
        },
      },
    }

    it('should use custom label and value fields', () => {
      const schema = buildAmisCRUDSchema(metaWithCustomLookup, '/api/data/tasks')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const assigneeField = formFields.find((f: any) => f.name === 'assignee')

      expect(assigneeField.labelField).toBe('full_name')
      expect(assigneeField.valueField).toBe('user_id')
    })

    it('should include custom reference fields in source data', () => {
      const schema = buildAmisCRUDSchema(metaWithCustomLookup, '/api/data/tasks')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const assigneeField = formFields.find((f: any) => f.name === 'assignee')

      expect(assigneeField.source.data.fields).toEqual(['user_id', 'full_name', 'email'])
    })
  })

  describe('Master-Detail Field', () => {
    const metaWithMasterDetail = {
      name: 'line_items',
      label: 'Line Item',
      fields: {
        order: {
          type: 'master_detail',
          label: 'Order',
          reference_to: 'orders',
        },
      },
    }

    it('should mark master-detail as required by default', () => {
      const schema = buildAmisCRUDSchema(metaWithMasterDetail, '/api/data/line_items')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const orderField = formFields.find((f: any) => f.name === 'order')

      expect(orderField.required).toBe(true)
    })
  })

  describe('Lookup Field with Inline Create', () => {
    const metaWithCreateable = {
      name: 'projects',
      label: 'Project',
      fields: {
        account: {
          type: 'lookup',
          label: 'Account',
          reference_to: 'accounts',
          reference_label: '客户',
          allow_create: true,
        },
      },
    }

    it('should enable creatable option', () => {
      const schema = buildAmisCRUDSchema(metaWithCreateable, '/api/data/projects')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const accountField = formFields.find((f: any) => f.name === 'account')

      expect(accountField.creatable).toBe(true)
      expect(accountField.createBtnLabel).toBe('新建客户')
    })

    it('should configure add controls and API', () => {
      const schema = buildAmisCRUDSchema(metaWithCreateable, '/api/data/projects')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const accountField = formFields.find((f: any) => f.name === 'account')

      expect(accountField.addControls).toBeDefined()
      expect(accountField.addControls.length).toBeGreaterThan(0)
      expect(accountField.addApi).toBeDefined()
      expect(accountField.addApi.url).toBe('/api/data/accounts')
    })
  })

  describe('Multiple Selection Lookup', () => {
    const metaWithMultiple = {
      name: 'projects',
      label: 'Project',
      fields: {
        tags: {
          type: 'lookup',
          label: 'Tags',
          reference_to: 'tags',
          multiple: true,
        },
      },
    }

    it('should use multi-select for multiple lookup', () => {
      const schema = buildAmisCRUDSchema(metaWithMultiple, '/api/data/projects')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const tagsField = formFields.find((f: any) => f.name === 'tags')

      expect(tagsField.type).toBe('multi-select')
      expect(tagsField.multiple).toBe(true)
    })
  })

  describe('Lookup Field with Filters', () => {
    const metaWithFilters = {
      name: 'opportunities',
      label: 'Opportunity',
      fields: {
        contact: {
          type: 'lookup',
          label: 'Contact',
          reference_to: 'contacts',
          filters: {
            status: 'active',
          },
        },
      },
    }

    it('should include filters in source data', () => {
      const schema = buildAmisCRUDSchema(metaWithFilters, '/api/data/opportunities')
      const createDialog = schema.body.headerToolbar.find((t: any) => t.type === 'button' && t.label === '新建')
      const formFields = createDialog.dialog.body.body
      const contactField = formFields.find((f: any) => f.name === 'contact')

      expect(contactField.source.data.filters).toEqual({ status: 'active' })
    })
  })

  describe('Lookup Column Display', () => {
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

    it('should configure lookup column as mapping type', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const customerColumn = schema.body.columns.find((c: any) => c.name === 'customer')

      expect(customerColumn.type).toBe('mapping')
    })

    it('should configure source for lookup column', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const customerColumn = schema.body.columns.find((c: any) => c.name === 'customer')

      expect(customerColumn.source).toBeDefined()
      expect(customerColumn.source.url).toContain('/api/data/customers/query')
    })

    it('should have placeholder for failed lookups', () => {
      const schema = buildAmisCRUDSchema(metaWithLookup, '/api/data/orders')
      const customerColumn = schema.body.columns.find((c: any) => c.name === 'customer')

      expect(customerColumn.placeholder).toBe('-')
    })
  })
})
