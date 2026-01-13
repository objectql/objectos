export * from './objectos';
export { ObjectOSPlugin } from './plugins/objectql';

// Re-export specific types if needed to avoid conflicts
export { 
    AppConfig, 
    AppMenuSection, 
    AppMenuItem, 
    isAppMenuSection,
    ChartConfig,
    PageConfig,
    PageComponent
} from './types';

// Export merge utilities
export {
    mergeObjectConfig,
    mergeFieldConfig,
    mergeFields,
    isDeleted,
    DELETED_MARKER
} from './utils/merge';

