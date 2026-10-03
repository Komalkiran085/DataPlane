export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'json'
  | 'array';

export interface FieldConstraints {
  minLength?: number;
  maxLength?: number;
  regex?: string;
  unique?: boolean;
  enumValues?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
  description?: string;
  constraints?: FieldConstraints;
}

export interface DatasetSchema {
  name: string;
  description: string;
  primaryKey: string;
  fields: SchemaField[];
}

export type TransformationType =
  | 'direct'
  | 'split_string'
  | 'join_strings'
  | 'date_format'
  | 'phone_e164'
  | 'type_cast'
  | 'case_transform'
  | 'default_value'
  | 'lookup_map'
  | 'regex_replace'
  | 'compute_age';

export interface FieldMapping {
  targetField: string;
  sourceFields: string[];
  transformation: TransformationType;
  params?: {
    splitIndex?: number;
    splitDelimiter?: string;
    joinDelimiter?: string;
    sourceDateFormat?: string;
    targetDateFormat?: string;
    countryCode?: string;
    targetType?: FieldType;
    caseType?: 'upper' | 'lower' | 'title' | 'trim';
    defaultValue?: any;
    lookupTable?: Record<string, any>;
    regexPattern?: string;
    regexReplacement?: string;
  };
  notes?: string;
  confidence: number;
  isUserOverridden?: boolean;
  status: 'proposed' | 'approved' | 'rejected' | 'modified';
}

export interface MappingRisk {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  targetField?: string;
  sourceField?: string;
  title: string;
  description: string;
  mitigation: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  context: string;
  options: string[];
  selectedOption?: string;
  answered: boolean;
}

export interface MigrationPlan {
  id: string;
  version: number;
  name: string;
  sourceSchema: DatasetSchema;
  targetSchema: DatasetSchema;
  mappings: FieldMapping[];
  risks: MappingRisk[];
  clarifications: ClarificationQuestion[];
  status: 'draft' | 'under_review' | 'approved' | 'stale';
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuarantineRecord {
  id: string;
  sourceRowIndex: number;
  sourceRecord: Record<string, any>;
  failedField: string;
  errorCode: string;
  errorMessage: string;
  attemptedValue: any;
  createdAt: string;
}

export interface DryRunResult {
  planId: string;
  planVersion: number;
  totalSourceRecords: number;
  transformedRecordsCount: number;
  acceptedRecordsCount: number;
  rejectedRecordsCount: number;
  sampleTransformed: Record<string, any>[];
  quarantined: QuarantineRecord[];
  fieldLevelSummary: Record<string, { success: number; errors: number }>;
  durationMs: number;
  executedAt: string;
}

export interface ExecutionResult {
  executionId: string;
  planId: string;
  planVersion: number;
  idempotencyToken: string;
  status: 'completed' | 'failed' | 'rolled_back';
  totalSourceRecords: number;
  insertedRecordsCount: number;
  quarantinedRecordsCount: number;
  isDuplicateExecutionSuppressed: boolean;
  snapshotId?: string;
  reconciliation: {
    sourceCount: number;
    targetCount: number;
    quarantineCount: number;
    parityMatched: boolean;
    discrepancyCount: number;
  };
  executedAt: string;
  rolledBackAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: Record<string, any>;
}

export interface SampleDatasetBundle {
  id: string;
  name: string;
  domain: string;
  description: string;
  sourceSchema: DatasetSchema;
  targetSchema: DatasetSchema;
  sampleRecords: Record<string, any>[];
}
