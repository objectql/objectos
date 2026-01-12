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
    } else if (fieldConfig.type === 'currency') {
      column.prefix = '$';
    } else if (fieldConfig.type === 'percent') {
      column.suffix = '%';
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
      // For lookup fields, we would need to fetch reference data
      field.type = 'select';
      field.source = `/api/data/${fieldConfig.reference_to}?fields=_id,name&pageSize=100`;
      field.labelField = 'name';
      field.valueField = '_id';
    } else if (fieldConfig.type === 'textarea') {
      field.minRows = 3;
      field.maxRows = 10;
    } else if (fieldConfig.type === 'currency' || fieldConfig.type === 'number') {
      field.min = fieldConfig.min;
      field.max = fieldConfig.max;
      if (fieldConfig.type === 'currency') {
        field.prefix = '$';
      }
    }

    if (fieldConfig.placeholder) {
      field.placeholder = fieldConfig.placeholder;
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
