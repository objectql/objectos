export const Field = {
  text: (options: any = {}) => ({ type: 'text', ...options }),
  textarea: (options: any = {}) => ({ type: 'textarea', ...options }),
  boolean: (options: any = {}) => ({ type: 'boolean', ...options }),
  date: (options: any = {}) => ({ type: 'date', ...options }),
  datetime: (options: any = {}) => ({ type: 'datetime', ...options }),
  number: (options: any = {}) => ({ type: 'number', ...options }),
  currency: (options: any = {}) => ({ type: 'currency', ...options }),
  select: (options: any = {}) => ({ type: 'select', ...options }),
  lookup: (options: any = {}) => ({ type: 'lookup', ...options }),
  masterDetail: (options: any = {}) => ({ type: 'master_detail', ...options }),
  email: (options: any = {}) => ({ type: 'email', ...options }),
  url: (options: any = {}) => ({ type: 'url', ...options }),
  password: (options: any = {}) => ({ type: 'password', ...options }),
  json: (options: any = {}) => ({ type: 'json', ...options }),
    avatar: (options: any = {}) => ({ type: 'avatar', ...options }),
};
export const ObjectSchema = {
  create: (definition: any) => definition
};
