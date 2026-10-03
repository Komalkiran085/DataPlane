import { DatasetSchema, FieldMapping, QuarantineRecord, SchemaField } from '../types';

export interface TransformFieldResult {
  value: any;
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface TransformRecordResult {
  sourceRowIndex: number;
  sourceRecord: Record<string, any>;
  transformedRecord?: Record<string, any>;
  isValid: boolean;
  quarantineErrors: QuarantineRecord[];
}

export class TransformationEngine {
  /**
   * Transforms a single field value based on the specified mapping rule
   */
  public static transformFieldValue(
    sourceRecord: Record<string, any>,
    mapping: FieldMapping,
    targetFieldDef?: SchemaField
  ): TransformFieldResult {
    const params = mapping.params || {};
    const primarySourceVal =
      mapping.sourceFields.length > 0 ? sourceRecord[mapping.sourceFields[0]] : undefined;

    let computedValue: any = primarySourceVal;

    try {
      switch (mapping.transformation) {
        case 'direct':
          computedValue = primarySourceVal;
          break;

        case 'split_string': {
          if (typeof primarySourceVal === 'string') {
            const delimiter = params.splitDelimiter || (primarySourceVal.includes(',') ? ',' : ' ');
            const parts = primarySourceVal.split(delimiter).map((s) => s.trim()).filter(Boolean);
            const idx = params.splitIndex ?? 0;
            // Handle last name extraction when delimiter is space and full_name is single word
            if (idx >= parts.length) {
              computedValue = idx === 1 ? (parts.length === 1 ? parts[0] : '') : '';
            } else {
              computedValue = parts[idx];
            }
          } else {
            computedValue = '';
          }
          break;
        }

        case 'join_strings': {
          const delimiter = params.joinDelimiter ?? ' ';
          const parts = mapping.sourceFields
            .map((field) => sourceRecord[field])
            .filter((v) => v !== undefined && v !== null && String(v).trim().length > 0);
          computedValue = parts.join(delimiter);
          break;
        }

        case 'date_format': {
          if (!primarySourceVal) {
            computedValue = null;
            break;
          }
          const valStr = String(primarySourceVal).trim();
          // Try parse MM/DD/YYYY or YYYYMMDD or ISO
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(valStr)) {
            const [m, d, y] = valStr.split('/');
            computedValue = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          } else if (/^\d{8}$/.test(valStr)) {
            const y = valStr.substring(0, 4);
            const m = valStr.substring(4, 6);
            const d = valStr.substring(6, 8);
            computedValue = `${y}-${m}-${d}`;
          } else if (typeof primarySourceVal === 'number') {
            // Epoch seconds or ms
            const ms = primarySourceVal > 1e11 ? primarySourceVal : primarySourceVal * 1000;
            const dt = new Date(ms);
            computedValue = dt.toISOString().split('T')[0];
          } else {
            const parsed = new Date(valStr);
            if (!isNaN(parsed.getTime())) {
              computedValue = parsed.toISOString().split('T')[0];
            } else {
              return {
                value: primarySourceVal,
                isValid: false,
                errorCode: 'INVALID_DATE_FORMAT',
                errorMessage: `Unable to parse date '${primarySourceVal}' into ISO format (YYYY-MM-DD)`,
              };
            }
          }
          break;
        }

        case 'phone_e164': {
          if (!primarySourceVal) {
            computedValue = null;
            break;
          }
          const rawPhone = String(primarySourceVal).trim();
          // Remove all non-digits
          const digits = rawPhone.replace(/\D/g, '');
          if (digits.length === 10) {
            const country = params.countryCode || '+1';
            computedValue = `${country}${digits}`;
          } else if (digits.length === 11 && digits.startsWith('1')) {
            computedValue = `+${digits}`;
          } else if (rawPhone.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
            computedValue = `+${digits}`;
          } else {
            return {
              value: primarySourceVal,
              isValid: false,
              errorCode: 'INVALID_PHONE_E164',
              errorMessage: `Phone string '${primarySourceVal}' cannot be normalized to E.164 (+[Country][10-14 digits])`,
            };
          }
          break;
        }

        case 'type_cast': {
          const targetType = params.targetType || targetFieldDef?.type || 'string';
          if (primarySourceVal === null || primarySourceVal === undefined || primarySourceVal === '') {
            computedValue = null;
          } else if (targetType === 'integer') {
            const parsed = parseInt(String(primarySourceVal), 10);
            if (isNaN(parsed)) {
              return {
                value: primarySourceVal,
                isValid: false,
                errorCode: 'CAST_ERROR_INTEGER',
                errorMessage: `Cannot cast value '${primarySourceVal}' to integer`,
              };
            }
            computedValue = parsed;
          } else if (targetType === 'number') {
            const parsed = parseFloat(String(primarySourceVal));
            if (isNaN(parsed)) {
              return {
                value: primarySourceVal,
                isValid: false,
                errorCode: 'CAST_ERROR_NUMBER',
                errorMessage: `Cannot cast value '${primarySourceVal}' to number`,
              };
            }
            computedValue = parsed;
          } else if (targetType === 'boolean') {
            const str = String(primarySourceVal).toLowerCase().trim();
            if (str === 'true' || str === '1' || str === 'yes' || str === 't') {
              computedValue = true;
            } else if (str === 'false' || str === '0' || str === 'no' || str === 'f') {
              computedValue = false;
            } else {
              computedValue = Boolean(primarySourceVal);
            }
          } else {
            computedValue = String(primarySourceVal);
          }
          break;
        }

        case 'case_transform': {
          if (primarySourceVal === null || primarySourceVal === undefined) {
            computedValue = '';
            break;
          }
          const strVal = String(primarySourceVal);
          const caseType = params.caseType || 'trim';
          if (caseType === 'upper') computedValue = strVal.toUpperCase().trim();
          else if (caseType === 'lower') computedValue = strVal.toLowerCase().trim();
          else if (caseType === 'title') {
            computedValue = strVal
              .toLowerCase()
              .split(' ')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
              .trim();
          } else {
            computedValue = strVal.trim();
          }
          break;
        }

        case 'default_value': {
          if (
            primarySourceVal === undefined ||
            primarySourceVal === null ||
            primarySourceVal === ''
          ) {
            computedValue = params.defaultValue;
          } else {
            computedValue = primarySourceVal;
          }
          break;
        }

        case 'lookup_map': {
          const lookup = params.lookupTable || {};
          const key = String(primarySourceVal).trim();
          if (key in lookup) {
            computedValue = lookup[key];
          } else if ('*' in lookup) {
            computedValue = lookup['*'];
          } else if (params.defaultValue !== undefined) {
            computedValue = params.defaultValue;
          } else {
            return {
              value: primarySourceVal,
              isValid: false,
              errorCode: 'LOOKUP_VALUE_MISSING',
              errorMessage: `Key '${primarySourceVal}' not found in lookup mapping table`,
            };
          }
          break;
        }

        case 'regex_replace': {
          if (typeof primarySourceVal === 'string') {
            const pat = new RegExp(params.regexPattern || '', 'g');
            computedValue = primarySourceVal.replace(pat, params.regexReplacement || '');
          } else {
            computedValue = primarySourceVal;
          }
          break;
        }

        case 'compute_age': {
          if (!primarySourceVal) {
            computedValue = null;
            break;
          }
          let dt: Date;
          if (String(primarySourceVal).includes('/')) {
            const [m, d, y] = String(primarySourceVal).split('/');
            dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
          } else {
            dt = new Date(primarySourceVal);
          }
          if (isNaN(dt.getTime())) {
            return {
              value: primarySourceVal,
              isValid: false,
              errorCode: 'INVALID_DOB_FOR_AGE',
              errorMessage: `Cannot calculate age from invalid birth date '${primarySourceVal}'`,
            };
          }
          const now = new Date();
          let age = now.getFullYear() - dt.getFullYear();
          const m = now.getMonth() - dt.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dt.getDate())) {
            age--;
          }
          computedValue = Math.max(0, age);
          break;
        }

        default:
          computedValue = primarySourceVal;
      }
    } catch (err: any) {
      return {
        value: primarySourceVal,
        isValid: false,
        errorCode: 'TRANSFORMATION_EXCEPTION',
        errorMessage: `Unexpected error during transformation: ${err.message}`,
      };
    }

    // Now validate the computedValue against the Target Schema field constraints
    if (targetFieldDef) {
      const valCheck = this.validateTargetField(computedValue, targetFieldDef);
      if (!valCheck.isValid) {
        return {
          value: computedValue,
          isValid: false,
          errorCode: valCheck.errorCode,
          errorMessage: valCheck.errorMessage,
        };
      }
    }

    return {
      value: computedValue,
      isValid: true,
    };
  }

  /**
   * Validates a value against target schema field constraints
   */
  public static validateTargetField(
    value: any,
    fieldDef: SchemaField
  ): { isValid: boolean; errorCode?: string; errorMessage?: string } {
    const isNullOrEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0);

    // Required check
    if (fieldDef.required && isNullOrEmpty) {
      return {
        isValid: false,
        errorCode: 'REQUIRED_FIELD_MISSING',
        errorMessage: `Target field '${fieldDef.name}' is required but received empty or null value.`,
      };
    }

    if (isNullOrEmpty) {
      return { isValid: true };
    }

    const c = fieldDef.constraints || {};

    // String / text checks
    if (fieldDef.type === 'string' || fieldDef.type === 'email' || fieldDef.type === 'phone') {
      const str = String(value);
      if (c.minLength !== undefined && str.length < c.minLength) {
        return {
          isValid: false,
          errorCode: 'MIN_LENGTH_VIOLATION',
          errorMessage: `Field '${fieldDef.name}' length ${str.length} is less than minimum ${c.minLength}.`,
        };
      }
      if (c.maxLength !== undefined && str.length > c.maxLength) {
        return {
          isValid: false,
          errorCode: 'MAX_LENGTH_VIOLATION',
          errorMessage: `Field '${fieldDef.name}' length ${str.length} exceeds maximum ${c.maxLength}.`,
        };
      }
      if (c.regex) {
        const reg = new RegExp(c.regex);
        if (!reg.test(str)) {
          return {
            isValid: false,
            errorCode: 'REGEX_PATTERN_MISMATCH',
            errorMessage: `Value '${str}' for '${fieldDef.name}' does not match required format constraint (${c.regex}).`,
          };
        }
      }
      if (c.enumValues && c.enumValues.length > 0) {
        if (!c.enumValues.includes(str)) {
          return {
            isValid: false,
            errorCode: 'INVALID_ENUM_VALUE',
            errorMessage: `Value '${str}' is not in allowed enum options: [${c.enumValues.join(', ')}].`,
          };
        }
      }
    }

    // Number / Integer checks
    if (fieldDef.type === 'integer' || fieldDef.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          isValid: false,
          errorCode: 'NOT_A_NUMBER',
          errorMessage: `Field '${fieldDef.name}' expects numeric value, got '${value}'.`,
        };
      }
      if (fieldDef.type === 'integer' && !Number.isInteger(num)) {
        return {
          isValid: false,
          errorCode: 'NOT_AN_INTEGER',
          errorMessage: `Field '${fieldDef.name}' expects integer value, got float '${value}'.`,
        };
      }
      if (c.minValue !== undefined && num < c.minValue) {
        return {
          isValid: false,
          errorCode: 'MIN_VALUE_VIOLATION',
          errorMessage: `Value ${num} is less than allowed minimum ${c.minValue}.`,
        };
      }
      if (c.maxValue !== undefined && num > c.maxValue) {
        return {
          isValid: false,
          errorCode: 'MAX_VALUE_VIOLATION',
          errorMessage: `Value ${num} is greater than allowed maximum ${c.maxValue}.`,
        };
      }
    }

    // Date checks
    if (fieldDef.type === 'date') {
      const str = String(value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return {
          isValid: false,
          errorCode: 'INVALID_DATE_FORMAT',
          errorMessage: `Field '${fieldDef.name}' must be formatted as YYYY-MM-DD.`,
        };
      }
      const d = new Date(str);
      if (isNaN(d.getTime())) {
        return {
          isValid: false,
          errorCode: 'INVALID_CALENDAR_DATE',
          errorMessage: `Date '${str}' is not a valid calendar date.`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Transforms an entire dataset record against all target schema mappings
   */
  public static transformRecord(
    sourceRecord: Record<string, any>,
    rowIndex: number,
    mappings: FieldMapping[],
    targetSchema: DatasetSchema
  ): TransformRecordResult {
    const transformed: Record<string, any> = {};
    const quarantineErrors: QuarantineRecord[] = [];
    let isRecordValid = true;

    // Build field lookup for target schema
    const targetFieldsMap = new Map<string, SchemaField>();
    for (const f of targetSchema.fields) {
      targetFieldsMap.set(f.name, f);
    }

    for (const mapping of mappings) {
      if (mapping.status === 'rejected') continue;

      const targetFieldDef = targetFieldsMap.get(mapping.targetField);
      const res = this.transformFieldValue(sourceRecord, mapping, targetFieldDef);

      if (!res.isValid) {
        isRecordValid = false;
        quarantineErrors.push({
          id: `QR-${rowIndex + 1}-${mapping.targetField}`,
          sourceRowIndex: rowIndex,
          sourceRecord: { ...sourceRecord },
          failedField: mapping.targetField,
          errorCode: res.errorCode || 'TRANSFORMATION_FAILURE',
          errorMessage: res.errorMessage || `Failed mapping to ${mapping.targetField}`,
          attemptedValue: res.value,
          createdAt: new Date().toISOString(),
        });
      } else {
        transformed[mapping.targetField] = res.value;
      }
    }

    // Check for any required target fields that had no mapping at all
    for (const targetField of targetSchema.fields) {
      if (targetField.required && !(targetField.name in transformed)) {
        isRecordValid = false;
        quarantineErrors.push({
          id: `QR-${rowIndex + 1}-${targetField.name}-unmapped`,
          sourceRowIndex: rowIndex,
          sourceRecord: { ...sourceRecord },
          failedField: targetField.name,
          errorCode: 'UNMAPPED_REQUIRED_FIELD',
          errorMessage: `Required target field '${targetField.name}' has no active mapping rule.`,
          attemptedValue: undefined,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return {
      sourceRowIndex: rowIndex,
      sourceRecord,
      transformedRecord: isRecordValid ? transformed : undefined,
      isValid: isRecordValid,
      quarantineErrors,
    };
  }
}
