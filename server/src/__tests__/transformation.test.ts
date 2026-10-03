import { describe, it, expect } from 'vitest';
import { TransformationEngine } from '../services/transformationEngine';
import { DatasetSchema, FieldMapping, SchemaField } from '../types';

describe('TransformationEngine - Deterministic Field Transformations', () => {
  it('should split full name into first and last name correctly', () => {
    const record = { full_name: 'Sarah Jenkins' };

    const firstNameMapping: FieldMapping = {
      targetField: 'first_name',
      sourceFields: ['full_name'],
      transformation: 'split_string',
      params: { splitIndex: 0, splitDelimiter: ' ' },
      confidence: 0.95,
      status: 'approved',
    };

    const lastNameMapping: FieldMapping = {
      targetField: 'last_name',
      sourceFields: ['full_name'],
      transformation: 'split_string',
      params: { splitIndex: 1, splitDelimiter: ' ' },
      confidence: 0.95,
      status: 'approved',
    };

    const targetField: SchemaField = { name: 'first_name', type: 'string', required: true };

    const firstRes = TransformationEngine.transformFieldValue(record, firstNameMapping, targetField);
    const lastRes = TransformationEngine.transformFieldValue(record, lastNameMapping, targetField);

    expect(firstRes.isValid).toBe(true);
    expect(firstRes.value).toBe('Sarah');

    expect(lastRes.isValid).toBe(true);
    expect(lastRes.value).toBe('Jenkins');
  });

  it('should format unformatted phone strings into E.164 format (+1XXXXXXXXXX)', () => {
    const mapping: FieldMapping = {
      targetField: 'phone_e164',
      sourceFields: ['cell'],
      transformation: 'phone_e164',
      params: { countryCode: '+1' },
      confidence: 0.9,
      status: 'approved',
    };

    const targetField: SchemaField = {
      name: 'phone_e164',
      type: 'phone',
      required: false,
      constraints: { regex: '^\\+[1-9]\\d{1,14}$' },
    };

    // Test formatted US phone
    const res1 = TransformationEngine.transformFieldValue({ cell: '(415) 555-0192' }, mapping, targetField);
    expect(res1.isValid).toBe(true);
    expect(res1.value).toBe('+14155550192');

    // Test invalid unparseable phone
    const res2 = TransformationEngine.transformFieldValue({ cell: 'INVALID_PHONE' }, mapping, targetField);
    expect(res2.isValid).toBe(false);
    expect(res2.errorCode).toBe('INVALID_PHONE_E164');
  });

  it('should normalize dates to ISO format (YYYY-MM-DD)', () => {
    const mapping: FieldMapping = {
      targetField: 'birth_date',
      sourceFields: ['dob'],
      transformation: 'date_format',
      confidence: 0.95,
      status: 'approved',
    };

    const targetField: SchemaField = { name: 'birth_date', type: 'date', required: true };

    const res = TransformationEngine.transformFieldValue({ dob: '04/15/1990' }, mapping, targetField);
    expect(res.isValid).toBe(true);
    expect(res.value).toBe('1990-04-15');
  });

  it('should compute age in years from birth date accurately', () => {
    const mapping: FieldMapping = {
      targetField: 'age',
      sourceFields: ['dob'],
      transformation: 'compute_age',
      confidence: 0.9,
      status: 'approved',
    };

    const targetField: SchemaField = {
      name: 'age',
      type: 'integer',
      required: false,
      constraints: { minValue: 0, maxValue: 120 },
    };

    const res = TransformationEngine.transformFieldValue({ dob: '01/01/2000' }, mapping, targetField);
    expect(res.isValid).toBe(true);
    expect(typeof res.value).toBe('number');
    expect(res.value).toBeGreaterThanOrEqual(24);
  });

  it('should cast currency dollars to integer cents', () => {
    const mapping: FieldMapping = {
      targetField: 'lifetime_value_cents',
      sourceFields: ['spend_dollars'],
      transformation: 'type_cast',
      params: { targetType: 'integer' },
      confidence: 0.95,
      status: 'approved',
    };

    const targetField: SchemaField = { name: 'lifetime_value_cents', type: 'integer', required: true };

    const res = TransformationEngine.transformFieldValue({ spend_dollars: 1249 }, mapping, targetField);
    expect(res.isValid).toBe(true);
    expect(res.value).toBe(1249);
  });
});
