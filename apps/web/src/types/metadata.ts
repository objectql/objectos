/**
 * Metadata type definitions for ObjectStack business objects and apps.
 *
 * These types mirror the @objectstack/spec protocol and are used to drive
 * the metadata-based UI rendering in the Business App Shell.
 *
 * The canonical source for these types is the `@objectstack/spec` package,
 * but we define local interfaces here so page-level code does not import
 * the full spec dependency and for convenient use in the frontend.
 */

// ── Field Types ─────────────────────────────────────────────────

/**
 * All field types supported by @objectstack/spec FieldSchema.
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'phone'
  | 'password'
  | 'markdown'
  | 'html'
  | 'richtext'
  | 'number'
  | 'currency'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'time'
  | 'boolean'
  | 'toggle'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkboxes'
  | 'lookup'
  | 'master_detail'
  | 'tree'
  | 'image'
  | 'file'
  | 'avatar'
  | 'video'
  | 'audio'
  | 'formula'
  | 'summary'
  | 'autonumber'
  | 'location'
  | 'address'
  | 'code'
  | 'json'
  | 'color'
  | 'rating'
  | 'slider'
  | 'signature'
  | 'qrcode'
  | 'progress'
  | 'tags'
  | 'vector';

export interface SelectOption {
  label: string;
  value: string;
  color?: string;
}

export interface FieldDefinition {
  name?: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  readonly?: boolean;
  searchable?: boolean;
  unique?: boolean;
  multiple?: boolean;
  defaultValue?: unknown;
  options?: SelectOption[];
  reference?: string;
  description?: string;
  expression?: string;
  formula?: string;
}

// ── Object Definition ───────────────────────────────────────────

export interface ObjectDefinition {
  name: string;
  label?: string;
  pluralLabel?: string;
  icon?: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
  primaryField?: string;
  listFields?: string[];
  /** @objectstack/spec flags */
  active?: boolean;
  isSystem?: boolean;
}

// ── App Definition ──────────────────────────────────────────────

export interface AppDefinition {
  /** App name / identifier (spec: `name`) */
  name: string;
  /** Display label */
  label: string;
  description?: string;
  icon?: string;
  /** Object names belonging to this app */
  objects?: string[];
  /** Whether the app is active */
  active?: boolean;
  /** Whether this is the default app */
  isDefault?: boolean;
  branding?: {
    primaryColor?: string;
    logo?: string;
    favicon?: string;
  };
  navigation?: unknown[];
}

// ── Record Types ────────────────────────────────────────────────

export type RecordData = Record<string, unknown>;

export interface RecordListResponse {
  records: RecordData[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RecordDetailResponse {
  record: RecordData;
}
