/**
 * Metadata Service
 * 
 * Provides object schema and field metadata
 */

/**
 * Field type enum
 */
export enum FieldType {
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
    DATE = 'date',
    DATETIME = 'datetime',
    LOOKUP = 'lookup',
    MASTER_DETAIL = 'master_detail',
    FORMULA = 'formula',
    SELECT = 'select',
    MULTISELECT = 'multiselect',
    TEXT = 'text',
    EMAIL = 'email',
    URL = 'url',
    PHONE = 'phone',
}

/**
 * Field metadata
 */
export interface FieldMetadata {
    /** Field name */
    name: string;
    /** Field label */
    label?: string;
    /** Field type */
    type: FieldType;
    /** Is required */
    required?: boolean;
    /** Is unique */
    unique?: boolean;
    /** Default value */
    defaultValue?: any;
    /** Minimum value/length */
    min?: number;
    /** Maximum value/length */
    max?: number;
    /** Pattern for validation */
    pattern?: string;
    /** Select options */
    options?: Array<{ label: string; value: string }>;
    /** Lookup configuration */
    lookup?: {
        object: string;
        field: string;
    };
    /** Formula expression */
    formula?: string;
    /** Help text */
    helpText?: string;
    /** Is readonly */
    readonly?: boolean;
    /** Is visible */
    visible?: boolean;
}

/**
 * Object metadata
 */
export interface ObjectMetadata {
    /** Object name */
    name: string;
    /** Object label */
    label?: string;
    /** Object description */
    description?: string;
    /** Icon */
    icon?: string;
    /** Fields */
    fields: FieldMetadata[];
    /** Relationships */
    relationships?: RelationshipMetadata[];
    /** Permissions */
    permissions?: ObjectPermissions;
    /** Is custom object */
    isCustom?: boolean;
}

/**
 * Relationship metadata
 */
export interface RelationshipMetadata {
    /** Relationship name */
    name: string;
    /** Relationship type */
    type: 'lookup' | 'master_detail' | 'many_to_many';
    /** Related object */
    relatedObject: string;
    /** Foreign key field */
    foreignKey?: string;
    /** On delete behavior */
    onDelete?: 'cascade' | 'set_null' | 'restrict';
}

/**
 * Object permissions
 */
export interface ObjectPermissions {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
}

/**
 * Metadata provider interface
 */
export interface MetadataProvider {
    /** Get all object names */
    listObjects(): Promise<string[]>;
    /** Get object metadata */
    getObject(name: string): Promise<ObjectMetadata | undefined>;
    /** Get field metadata */
    getField(objectName: string, fieldName: string): Promise<FieldMetadata | undefined>;
}

/**
 * Metadata Service
 */
export class MetadataService {
    private provider: MetadataProvider;
    private cache: Map<string, ObjectMetadata> = new Map();

    constructor(provider: MetadataProvider) {
        this.provider = provider;
    }

    /**
     * List all objects
     */
    async listObjects(): Promise<string[]> {
        return await this.provider.listObjects();
    }

    /**
     * Get object metadata
     */
    async getObject(name: string): Promise<ObjectMetadata | undefined> {
        // Check cache first
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        // Fetch from provider
        const metadata = await this.provider.getObject(name);
        
        if (metadata) {
            this.cache.set(name, metadata);
        }

        return metadata;
    }

    /**
     * Get field metadata
     */
    async getField(objectName: string, fieldName: string): Promise<FieldMetadata | undefined> {
        const object = await this.getObject(objectName);
        return object?.fields.find(f => f.name === fieldName);
    }

    /**
     * Get all fields for an object
     */
    async getFields(objectName: string): Promise<FieldMetadata[]> {
        const object = await this.getObject(objectName);
        return object?.fields || [];
    }

    /**
     * Get relationships for an object
     */
    async getRelationships(objectName: string): Promise<RelationshipMetadata[]> {
        const object = await this.getObject(objectName);
        return object?.relationships || [];
    }

    /**
     * Search objects by label or description
     */
    async searchObjects(query: string): Promise<ObjectMetadata[]> {
        const objectNames = await this.listObjects();
        const results: ObjectMetadata[] = [];

        for (const name of objectNames) {
            const object = await this.getObject(name);
            if (object) {
                const searchText = `${object.label || ''} ${object.description || ''} ${object.name}`.toLowerCase();
                if (searchText.includes(query.toLowerCase())) {
                    results.push(object);
                }
            }
        }

        return results;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear cache for specific object
     */
    clearObjectCache(name: string): void {
        this.cache.delete(name);
    }
}

/**
 * Create metadata service
 */
export function createMetadataService(provider: MetadataProvider): MetadataService {
    return new MetadataService(provider);
}

/**
 * Register metadata endpoints on router
 */
export function registerMetadataEndpoints(
    router: any,
    metadata: MetadataService
): void {
    // List all objects
    router.get('/api/metadata/objects', async (req: any, res: any) => {
        const objects = await metadata.listObjects();
        
        if (res.json) {
            res.json({ success: true, data: objects });
        }
    }, {
        category: 'api',
        summary: 'List Objects',
        description: 'Get list of all objects',
        tags: ['metadata'],
    });

    // Get object metadata
    router.get('/api/metadata/objects/:objectName', async (req: any, res: any) => {
        const objectName = req.params?.objectName;
        const object = await metadata.getObject(objectName);
        
        if (res.json) {
            if (object) {
                res.json({ success: true, data: object });
            } else {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: `Object '${objectName}' not found`,
                    },
                });
            }
        }
    }, {
        category: 'api',
        summary: 'Get Object Metadata',
        description: 'Get metadata for a specific object',
        tags: ['metadata'],
    });

    // Get object fields
    router.get('/api/metadata/objects/:objectName/fields', async (req: any, res: any) => {
        const objectName = req.params?.objectName;
        const fields = await metadata.getFields(objectName);
        
        if (res.json) {
            res.json({ success: true, data: fields });
        }
    }, {
        category: 'api',
        summary: 'Get Object Fields',
        description: 'Get all fields for a specific object',
        tags: ['metadata'],
    });

    // Search objects
    router.get('/api/metadata/search', async (req: any, res: any) => {
        const query = req.query?.q || '';
        const results = await metadata.searchObjects(query);
        
        if (res.json) {
            res.json({ success: true, data: results });
        }
    }, {
        category: 'api',
        summary: 'Search Objects',
        description: 'Search objects by name, label, or description',
        tags: ['metadata'],
    });
}
