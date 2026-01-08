import { IObjectQL, ObjectConfig, FieldConfig } from '@objectql/core';

export function generateOpenApiSpec(objectql: IObjectQL) {
  const configs = objectql.getConfigs();
  
  const paths: any = {};
  const schemas: any = {};

  // 0. Metadata Endpoint
  paths['/api/_schema'] = {
      get: {
          summary: "Get Full Schema Metadata",
          tags: ["System"],
          responses: {
              200: {
                  description: "Full configuration of all objects",
                  content: {
                      'application/json': {
                          schema: {
                              type: 'object',
                              additionalProperties: {
                                  type: 'object',
                                  description: 'Object Configuration'
                              }
                          }
                      }
                  }
              }
          }
      }
  };

  paths['/api/_schema/{type}'] = {
      get: {
          summary: "Get Metadata by Type",
          tags: ["System"],
          parameters: [
              {
                  name: "type",
                  in: "path",
                  required: true,
                  schema: {
                      type: "string",
                      enum: ["object", "app"],
                      example: "app"
                  },
                  description: "Metadata type"
              }
          ],
          responses: {
              200: {
                  description: "Metadata configuration map",
                  content: {
                      'application/json': {
                          schema: {
                              type: 'object',
                              additionalProperties: true
                          }
                      }
                  }
              }
          }
      }
  };

  Object.values(configs).forEach((config) => {
    const objectName = config.name;
    const schemaName = objectName;

    // 1. Define Schema
    schemas[schemaName] = {
      type: 'object',
      properties: mapFieldsToProperties(config.fields)
    };

    // 2. Define Paths
    const basePath = `/api/${objectName}`;
    
    // GET /api/{obj} - List
    paths[basePath] = {
      get: {
        summary: `List ${config.label || objectName}`,
        tags: [config.label || objectName],
        parameters: [
          {
            name: 'fields',
            in: 'query',
            description: 'Comma separated fields to return',
            schema: { type: 'string' }
          },
          {
            name: 'filters',
            in: 'query',
            description: 'JSON string of filters',
            schema: { type: 'string' }
          },
        ],
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: `#/components/schemas/${schemaName}` }
                }
              }
            }
          }
        }
      },
      // POST /api/{obj} - Create
      post: {
        summary: `Create ${config.label || objectName}`,
        tags: [config.label || objectName],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` }
            }
          }
        },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                 schema: { $ref: `#/components/schemas/${schemaName}` }
              }
            }
          }
        }
      }
    };

    // /{id} operations
    const itemPath = `${basePath}/{id}`;
    paths[itemPath] = {
      // GET - Retrieve
      get: {
        summary: `Get ${config.label || objectName}`,
        tags: [config.label || objectName],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Success',
            content: {
                'application/json': {
                   schema: { $ref: `#/components/schemas/${schemaName}` }
                }
            }
          }
        }
      },
      // PUT - Update
      put: {
        summary: `Update ${config.label || objectName}`,
        tags: [config.label || objectName],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                  type: 'object',
                  properties: mapFieldsToProperties(config.fields)
              }
            }
          }
        },
        responses: {
          200: { description: 'Updated' }
        }
      },
      // DELETE
      delete: {
        summary: `Delete ${config.label || objectName}`,
        tags: [config.label || objectName],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Deleted' }
        }
      }
    };

  });

  return {
    openapi: '3.0.0',
    info: {
      title: 'ObjectQL API',
      version: '1.0.0',
    },
    paths,
    components: {
      schemas
    }
  };
}

function mapFieldsToProperties(fields: Record<string, FieldConfig>) {
  const props: any = {};
  Object.entries(fields).forEach(([key, field]) => {
    props[key] = {
      type: mapType(field.type),
      description: field.label
    };
  });
  // Add _id
  props['_id'] = { type: 'string' };
  return props;
}

function mapType(objectType: string) {
  switch (objectType) {
    case 'number':
    case 'currency':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
    case 'datetime':
      return 'string'; // format: date-time ideally
    default:
      return 'string';
  }
}
