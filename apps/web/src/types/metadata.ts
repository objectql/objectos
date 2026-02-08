/**
 * Metadata type definitions for ObjectStack business objects and apps.
 *
 * These types mirror the @objectstack/spec protocol and are used to drive
 * the metadata-based UI rendering in the Business App Shell.
 */

// ── Field Types ─────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'select'
  | 'reference'
  | 'textarea'
  | 'email'
  | 'url'
  | 'phone'
  | 'currency'
  | 'percent'
  | 'object';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  readonly?: boolean;
  defaultValue?: unknown;
  options?: SelectOption[];
  referenceTo?: string;
  group?: string;
  description?: string;
}

// ── Object Definition ───────────────────────────────────────────

export interface ObjectDefinition {
  name: string;
  label: string;
  pluralLabel: string;
  icon?: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
  primaryField?: string;
  listFields?: string[];
}

// ── App Definition ──────────────────────────────────────────────

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  objects: string[];
  defaultObject?: string;
  status: 'active' | 'paused';
  category: 'system' | 'business' | 'custom';
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

// ── API Envelope ────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
