// Utility to convert ObjectQL field types to AMIS form field types
export function objectqlTypeToAmisFormType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    text: 'input-text',
    textarea: 'textarea',
    email: 'input-email',
    url: 'input-url',
    number: 'input-number',
    currency: 'input-number',
    percent: 'input-number',
    checkbox: 'checkbox',
    select: 'select',
    picklist: 'select',
    multiselect: 'multi-select',
    date: 'input-date',
    datetime: 'input-datetime',
    time: 'input-time',
    lookup: 'select',
    master_detail: 'select',
    password: 'input-password',
    phone: 'input-text',
    html: 'rich-text',
    switch: 'switch',
    slider: 'input-range',
    color: 'input-color',
    rating: 'input-rating',
  };
  
  return typeMap[fieldType] || 'input-text';
}

// Utility to convert ObjectQL field types to AMIS table column types
export function objectqlTypeToAmisColumnType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    text: 'text',
    textarea: 'text',
    email: 'text',
    url: 'link',
    number: 'number',
    currency: 'number',
    percent: 'number',
    checkbox: 'status',
    select: 'text',
    picklist: 'text',
    multiselect: 'text',
    date: 'date',
    datetime: 'datetime',
    time: 'time',
    lookup: 'text',
    master_detail: 'text',
    image: 'image',
    file: 'link',
    switch: 'switch',
    rating: 'mapping',
    color: 'color',
  };
  
  return typeMap[fieldType] || 'text';
}

// Convert ObjectQL metadata to AMIS CRUD schema
export function buildAmisCRUDSchema(objectMeta: any, apiEndpoint: string) {
  const columns = Object.entries(objectMeta.fields || {}).map(([fieldName, fieldConfig]: [string, any]) => {
    const column: any = {
      name: fieldName,
      label: fieldConfig.label || fieldName,
      type: objectqlTypeToAmisColumnType(fieldConfig.type),
      sortable: true,
    };

    // Add specific configurations based on field type
    if (fieldConfig.type === 'checkbox') {
      column.type = 'status';
      column.map = {
        true: "<span class='label label-success'>是</span>",
        false: "<span class='label label-default'>否</span>",
        '*': "-"
      };
    } else if (fieldConfig.type === 'lookup' || fieldConfig.type === 'master_detail') {
      // For lookup fields, use mapping to display related object data
      column.type = 'mapping';
      const referenceTo = fieldConfig.reference_to;
      const labelField = fieldConfig.label_field || 'name';
      
      // Use source to fetch and map reference data
      column.source = {
        method: 'post',
        url: `/api/data/${referenceTo}/query`,
        data: {
          fields: ['_id', labelField],
          pageSize: 1000,
        },
        adaptor: `
          // Create mapping for lookup values
          const items = payload.data || [];
          const mapping = {};
          items.forEach(item => {
            mapping[item._id] = item.${labelField} || item._id;
          });
          return mapping;
        `,
      };
      
      // Fallback to plain text if source fails
      column.placeholder = '-';
    } else if (fieldConfig.type === 'currency') {
      column.prefix = '$';
      column.precision = fieldConfig.precision || 2;
    } else if (fieldConfig.type === 'percent') {
      column.suffix = '%';
    } else if (fieldConfig.type === 'url') {
      column.type = 'link';
      column.blank = true; // Open in new tab
    } else if (fieldConfig.type === 'image') {
      column.type = 'image';
      column.enlargeAble = true;
      column.thumbMode = 'cover';
    } else if (fieldConfig.type === 'date') {
      column.format = 'YYYY-MM-DD';
    } else if (fieldConfig.type === 'datetime') {
      column.format = 'YYYY-MM-DD HH:mm:ss';
    } else if (fieldConfig.type === 'rating') {
      column.type = 'mapping';
      const count = fieldConfig.count || 5;
      const stars: Record<string, string> = {};
      for (let i = 1; i <= count; i++) {
        stars[i.toString()] = '⭐'.repeat(i);
      }
      column.map = stars;
    }

    // Add width configuration if specified
    if (fieldConfig.width) {
      column.width = fieldConfig.width;
    }

    // Hide column if specified
    if (fieldConfig.hidden) {
      column.toggled = false;
    }

    return column;
  });

  const formFields = Object.entries(objectMeta.fields || {}).map(([fieldName, fieldConfig]: [string, any]) => {
    const field: any = {
      name: fieldName,
      label: fieldConfig.label || fieldName,
      type: objectqlTypeToAmisFormType(fieldConfig.type),
      required: fieldConfig.required || false,
    };

    // Add specific configurations based on field type
    if (fieldConfig.type === 'select' || fieldConfig.type === 'picklist') {
      field.options = (fieldConfig.options || []).map((opt: string) => ({
        label: opt,
        value: opt,
      }));
    } else if (fieldConfig.type === 'multiselect') {
      field.multiple = true;
      field.options = (fieldConfig.options || []).map((opt: string) => ({
        label: opt,
        value: opt,
      }));
    } else if (fieldConfig.type === 'lookup' || fieldConfig.type === 'master_detail') {
      // Enhanced lookup field with better API integration
      field.type = 'select';
      
      // Configure data source with proper API endpoint
      const referenceTo = fieldConfig.reference_to;
      field.source = {
        method: 'post',
        url: `/api/data/${referenceTo}/query`,
        data: {
          fields: fieldConfig.reference_fields || ['_id', 'name'],
          pageSize: 100,
        },
        adaptor: `
          // Transform response to AMIS format
          const items = payload.data || [];
          return {
            status: 0,
            msg: 'success',
            data: {
              options: items.map(item => ({
                label: item.name || item._id,
                value: item._id,
                ...item
              }))
            }
          };
        `,
      };
      
      // Enable search for better UX
      field.searchable = true;
      field.clearable = true;
      
      // Configure display fields
      field.labelField = fieldConfig.label_field || 'name';
      field.valueField = fieldConfig.value_field || '_id';
      
      // For master-detail, mark as required by default
      if (fieldConfig.type === 'master_detail') {
        field.required = true;
      }
      
      // Add option to create new record inline (if enabled)
      if (fieldConfig.allow_create) {
        field.creatable = true;
        field.createBtnLabel = `新建${fieldConfig.reference_label || referenceTo}`;
        field.addControls = [
          {
            type: 'text',
            name: 'name',
            label: '名称',
            required: true,
          },
        ];
        field.addApi = {
          method: 'post',
          url: `/api/data/${referenceTo}`,
        };
      }
      
      // Add dependent field filtering if specified
      if (fieldConfig.filters) {
        field.source.data = {
          ...field.source.data,
          filters: fieldConfig.filters,
        };
      }
      
      // Support for multiple selection (for many-to-many relationships)
      if (fieldConfig.multiple) {
        field.multiple = true;
        field.type = 'multi-select';
      }
    } else if (fieldConfig.type === 'textarea') {
      field.minRows = 3;
      field.maxRows = 10;
    } else if (fieldConfig.type === 'currency' || fieldConfig.type === 'number') {
      field.min = fieldConfig.min;
      field.max = fieldConfig.max;
      if (fieldConfig.type === 'currency') {
        field.prefix = '$';
      }
      if (fieldConfig.precision !== undefined) {
        field.precision = fieldConfig.precision;
      }
    } else if (fieldConfig.type === 'percent') {
      field.suffix = '%';
      field.min = fieldConfig.min || 0;
      field.max = fieldConfig.max || 100;
    } else if (fieldConfig.type === 'email') {
      // Add email validation
      field.validations = {
        isEmail: true,
      };
      field.validationErrors = {
        isEmail: '请输入有效的邮箱地址',
      };
    } else if (fieldConfig.type === 'url') {
      // Add URL validation
      field.validations = {
        isUrl: true,
      };
      field.validationErrors = {
        isUrl: '请输入有效的URL地址',
      };
    } else if (fieldConfig.type === 'phone') {
      // Add phone validation pattern
      field.validations = {
        matchRegexp: '/^1[3-9]\\d{9}$/',
      };
      field.validationErrors = {
        matchRegexp: '请输入有效的手机号码',
      };
    } else if (fieldConfig.type === 'rating') {
      field.count = fieldConfig.count || 5;
      field.half = fieldConfig.allowHalf || false;
    } else if (fieldConfig.type === 'slider') {
      field.min = fieldConfig.min || 0;
      field.max = fieldConfig.max || 100;
      field.step = fieldConfig.step || 1;
    }

    if (fieldConfig.placeholder) {
      field.placeholder = fieldConfig.placeholder;
    }

    if (fieldConfig.description) {
      field.description = fieldConfig.description;
    }

    if (fieldConfig.help) {
      field.hint = fieldConfig.help;
    }

    // Add custom validation rules
    if (fieldConfig.minLength) {
      field.minLength = fieldConfig.minLength;
    }

    if (fieldConfig.maxLength) {
      field.maxLength = fieldConfig.maxLength;
    }

    if (fieldConfig.pattern) {
      field.validations = field.validations || {};
      field.validations.matchRegexp = fieldConfig.pattern;
    }

    return field;
  });

  return {
    type: 'page',
    title: objectMeta.label || objectMeta.name,
    body: {
      type: 'crud',
      syncLocation: false,
      api: {
        method: 'post',
        url: `${apiEndpoint}/query`,
        data: {
          '&': '$$',
        },
        adaptor: `
          // Convert server response to AMIS format
          const items = payload.data || [];
          return {
            status: 0,
            msg: 'success',
            data: {
              items: items,
              total: payload.total || items.length
            }
          };
        `,
      },
      headerToolbar: [
        'bulkActions',
        {
          type: 'button',
          label: '新建',
          actionType: 'dialog',
          level: 'primary',
          dialog: {
            title: `新建${objectMeta.label || objectMeta.name}`,
            size: 'lg',
            body: {
              type: 'form',
              api: {
                method: 'post',
                url: apiEndpoint,
              },
              body: formFields,
            },
          },
        },
        'filter-toggler',
        'reload',
      ],
      footerToolbar: ['statistics', 'pagination'],
      columns: [
        ...columns,
        {
          type: 'operation',
          label: '操作',
          buttons: [
            {
              label: '编辑',
              type: 'button',
              actionType: 'dialog',
              level: 'link',
              dialog: {
                title: `编辑${objectMeta.label || objectMeta.name}`,
                size: 'lg',
                body: {
                  type: 'form',
                  api: {
                    method: 'patch',
                    url: `${apiEndpoint}/$id`,
                  },
                  body: formFields,
                },
              },
            },
            {
              type: 'button',
              label: '删除',
              actionType: 'ajax',
              level: 'link',
              className: 'text-danger',
              confirmText: '确定要删除吗？',
              api: {
                method: 'delete',
                url: `${apiEndpoint}/$id`,
              },
            },
          ],
        },
      ],
      bulkActions: [
        {
          label: '批量删除',
          actionType: 'ajax',
          api: {
            method: 'delete',
            url: `${apiEndpoint}/batch`,
            data: {
              ids: '$ids',
            },
          },
          confirmText: '确定要删除选中的记录吗？',
        },
      ],
      filter: {
        title: '筛选',
        body: formFields.filter((f: any) => 
          !['textarea', 'rich-text'].includes(f.type)
        ).map((f: any) => ({
          ...f,
          required: false,
        })),
      },
      perPage: 20,
      perPageAvailable: [10, 20, 50, 100],
    },
  };
}
