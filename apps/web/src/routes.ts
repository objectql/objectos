// Root Routes
export const ROOT = '/';
export const LOGIN = '/login';
export const APPS = '/apps';

// App Routes (Workspace)
export const APP_ROOT = '/app/:appName';
export const APP_DASHBOARD = '/app/:appName/dashboard';
export const APP_OBJECT_LIST = '/app/:appName/object/:objectName';
export const APP_OBJECT_DETAIL = '/app/:appName/object/:objectName/view/:recordId';
export const APP_OBJECT_EDIT = '/app/:appName/object/:objectName/edit/:recordId';
export const APP_OBJECT_NEW = '/app/:appName/object/:objectName/new';
export const APP_PAGE = '/app/:appName/page/:pageId';

// Global Routes (Legacy/Global Context)
export const OBJECT_LIST = '/object/:objectName';
export const OBJECT_DETAIL = '/object/:objectName/view/:recordId'; // Standardized view/edit
export const SETTINGS = '/settings';
export const ORGANIZATION = '/organization';
export const USER_PROFILE = '/user/profile';

// Route Generators
export const routes = {
    root: () => ROOT,
    login: () => LOGIN,
    apps: () => APPS,
    app: (appName: string) => `/app/${appName}`,
    objectList: (appName: string, objectName: string) => `/app/${appName}/object/${objectName}`,
    objectDetail: (appName: string, objectName: string, id: string) => `/app/${appName}/object/${objectName}/view/${id}`,
    objectEdit: (appName: string, objectName: string, id: string) => `/app/${appName}/object/${objectName}/edit/${id}`,
    objectNew: (appName: string, objectName: string) => `/app/${appName}/object/${objectName}/new`,
};
