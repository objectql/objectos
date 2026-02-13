/**
 * Formula Field Examples
 *
 * Demonstrates how to use formula fields (calculated, rollup, auto-number)
 */

import type { FormulaField } from '@objectos/plugin-automation';

// Example 1: Calculated field - Full name
export const fullNameFormula: FormulaField = {
  name: 'fullName',
  objectName: 'contacts',
  type: 'calculated',
  config: {
    type: 'calculated',
    expression: '{firstName} + " " + {lastName}',
    returnType: 'string',
  },
  createdAt: new Date(),
};

// Example 2: Calculated field - Age from birthdate
export const ageFormula: FormulaField = {
  name: 'age',
  objectName: 'contacts',
  type: 'calculated',
  config: {
    type: 'calculated',
    expression:
      'Math.floor((Date.now() - new Date({birthDate}).getTime()) / (365.25 * 24 * 60 * 60 * 1000))',
    returnType: 'number',
  },
  createdAt: new Date(),
};

// Example 3: Calculated field - Discount percentage
export const discountPercentageFormula: FormulaField = {
  name: 'discountPercentage',
  objectName: 'opportunities',
  type: 'calculated',
  config: {
    type: 'calculated',
    expression: '({listPrice} - {finalPrice}) / {listPrice} * 100',
    returnType: 'number',
  },
  createdAt: new Date(),
};

// Example 4: Calculated field - Days until expiration
export const daysUntilExpirationFormula: FormulaField = {
  name: 'daysUntilExpiration',
  objectName: 'contracts',
  type: 'calculated',
  config: {
    type: 'calculated',
    expression: 'Math.ceil((new Date({endDate}).getTime() - Date.now()) / (24 * 60 * 60 * 1000))',
    returnType: 'number',
  },
  createdAt: new Date(),
};

// Example 5: Rollup SUM - Total opportunity amount
export const totalOpportunityAmountFormula: FormulaField = {
  name: 'totalOpportunityAmount',
  objectName: 'accounts',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'opportunities',
    relationshipField: 'accountId',
    aggregateField: 'amount',
    operation: 'SUM',
  },
  createdAt: new Date(),
};

// Example 6: Rollup COUNT - Number of contacts
export const numberOfContactsFormula: FormulaField = {
  name: 'numberOfContacts',
  objectName: 'accounts',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'contacts',
    relationshipField: 'accountId',
    aggregateField: 'id',
    operation: 'COUNT',
  },
  createdAt: new Date(),
};

// Example 7: Rollup COUNT with conditions - Number of open cases
export const numberOfOpenCasesFormula: FormulaField = {
  name: 'numberOfOpenCases',
  objectName: 'accounts',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'cases',
    relationshipField: 'accountId',
    aggregateField: 'id',
    operation: 'COUNT',
    conditions: [
      {
        field: 'status',
        operator: 'equals',
        value: 'open',
      },
    ],
  },
  createdAt: new Date(),
};

// Example 8: Rollup AVG - Average deal size
export const averageDealSizeFormula: FormulaField = {
  name: 'averageDealSize',
  objectName: 'users',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'opportunities',
    relationshipField: 'ownerId',
    aggregateField: 'amount',
    operation: 'AVG',
    conditions: [
      {
        field: 'stage',
        operator: 'equals',
        value: 'closed_won',
      },
    ],
  },
  createdAt: new Date(),
};

// Example 9: Rollup MIN - Earliest task due date
export const earliestTaskDueDateFormula: FormulaField = {
  name: 'earliestTaskDueDate',
  objectName: 'projects',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'tasks',
    relationshipField: 'projectId',
    aggregateField: 'dueDate',
    operation: 'MIN',
    conditions: [
      {
        field: 'status',
        operator: 'not_equals',
        value: 'completed',
      },
    ],
  },
  createdAt: new Date(),
};

// Example 10: Rollup MAX - Latest activity date
export const latestActivityDateFormula: FormulaField = {
  name: 'latestActivityDate',
  objectName: 'accounts',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'activities',
    relationshipField: 'accountId',
    aggregateField: 'activityDate',
    operation: 'MAX',
  },
  createdAt: new Date(),
};

// Example 11: Auto-number - Invoice number
export const invoiceNumberFormula: FormulaField = {
  name: 'invoiceNumber',
  objectName: 'invoices',
  type: 'autonumber',
  config: {
    type: 'autonumber',
    prefix: 'INV-',
    startingNumber: 10001,
    digits: 6,
  },
  createdAt: new Date(),
};

// Example 12: Auto-number - Purchase order number
export const purchaseOrderNumberFormula: FormulaField = {
  name: 'poNumber',
  objectName: 'purchase_orders',
  type: 'autonumber',
  config: {
    type: 'autonumber',
    prefix: 'PO-',
    suffix: '-US',
    startingNumber: 1,
    digits: 5,
  },
  createdAt: new Date(),
};

// Example 13: Auto-number - Support ticket number
export const ticketNumberFormula: FormulaField = {
  name: 'ticketNumber',
  objectName: 'support_tickets',
  type: 'autonumber',
  config: {
    type: 'autonumber',
    prefix: 'TICKET-',
    startingNumber: 100000,
    digits: 7,
  },
  createdAt: new Date(),
};

// Example 14: Auto-number - Employee ID
export const employeeIdFormula: FormulaField = {
  name: 'employeeId',
  objectName: 'employees',
  type: 'autonumber',
  config: {
    type: 'autonumber',
    prefix: 'EMP',
    startingNumber: 1001,
    digits: 4,
  },
  createdAt: new Date(),
};

// Example 15: Calculated field - Status badge
export const statusBadgeFormula: FormulaField = {
  name: 'statusBadge',
  objectName: 'leads',
  type: 'calculated',
  config: {
    type: 'calculated',
    expression:
      '{status} === "hot" ? "🔥 Hot Lead" : {status} === "warm" ? "☀️ Warm Lead" : "❄️ Cold Lead"',
    returnType: 'string',
  },
  createdAt: new Date(),
};

// Example 16: Rollup SUM with multiple conditions - Revenue this quarter
export const revenueThisQuarterFormula: FormulaField = {
  name: 'revenueThisQuarter',
  objectName: 'accounts',
  type: 'rollup',
  config: {
    type: 'rollup',
    relatedObject: 'opportunities',
    relationshipField: 'accountId',
    aggregateField: 'amount',
    operation: 'SUM',
    conditions: [
      {
        field: 'stage',
        operator: 'equals',
        value: 'closed_won',
      },
      {
        field: 'closeDate',
        operator: 'greater_than',
        value: '{{quarterStartDate}}',
      },
    ],
  },
  createdAt: new Date(),
};
