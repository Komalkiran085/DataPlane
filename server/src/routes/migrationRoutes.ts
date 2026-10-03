import { Router } from 'express';
import { DryRunResult, QuarantineRecord } from '../types';
import { TransformationEngine } from '../services/transformationEngine';
import { mockDb } from '../services/mockDatabase';

const router = Router();
let lastDryRunResult: DryRunResult | null = null;
let quarantineStore: QuarantineRecord[] = [];

// 1. Deterministic Dry Run Simulation
router.post('/dry-run', (req, res) => {
  const startTime = Date.now();
  const { plan, sampleRecords } = req.body;

  if (!plan || !sampleRecords || !Array.isArray(sampleRecords)) {
    return res.status(400).json({
      success: false,
      error: 'Migration plan and sampleRecords array are required.',
    });
  }

  const sampleTransformed: Record<string, any>[] = [];
  const quarantined: QuarantineRecord[] = [];
  const fieldSummary: Record<string, { success: number; errors: number }> = {};

  // Initialize summary for all target fields
  for (const f of plan.targetSchema.fields) {
    fieldSummary[f.name] = { success: 0, errors: 0 };
  }

  let acceptedCount = 0;

  for (let i = 0; i < sampleRecords.length; i++) {
    const record = sampleRecords[i];
    const outcome = TransformationEngine.transformRecord(
      record,
      i,
      plan.mappings,
      plan.targetSchema
    );

    if (outcome.isValid && outcome.transformedRecord) {
      acceptedCount++;
      sampleTransformed.push(outcome.transformedRecord);
      for (const k of Object.keys(outcome.transformedRecord)) {
        if (fieldSummary[k]) fieldSummary[k].success++;
      }
    } else {
      quarantined.push(...outcome.quarantineErrors);
      for (const err of outcome.quarantineErrors) {
        if (fieldSummary[err.failedField]) {
          fieldSummary[err.failedField].errors++;
        }
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const dryRunResult: DryRunResult = {
    planId: plan.id,
    planVersion: plan.version,
    totalSourceRecords: sampleRecords.length,
    transformedRecordsCount: acceptedCount,
    acceptedRecordsCount: acceptedCount,
    rejectedRecordsCount: sampleRecords.length - acceptedCount,
    sampleTransformed,
    quarantined,
    fieldLevelSummary: fieldSummary,
    durationMs,
    executedAt: new Date().toISOString(),
  };

  lastDryRunResult = dryRunResult;
  quarantineStore = quarantined;

  mockDb.addAuditLog('DRY_RUN_EXECUTED', 'DataPlane Engine', {
    planId: plan.id,
    version: plan.version,
    total: sampleRecords.length,
    accepted: acceptedCount,
    quarantined: sampleRecords.length - acceptedCount,
    durationMs,
  });

  res.json({
    success: true,
    data: dryRunResult,
  });
});

// 2. Execute Migration into Mock Target DB
router.post('/execute', (req, res) => {
  const { plan, sampleRecords, idempotencyToken } = req.body;

  if (!plan || !sampleRecords || !Array.isArray(sampleRecords)) {
    return res.status(400).json({
      success: false,
      error: 'Plan and sampleRecords are required.',
    });
  }

  const token =
    idempotencyToken ||
    `IDEM-${plan.id}-V${plan.version}-${Date.now()}`;

  // Execute deterministic transformation
  const validRecords: Record<string, any>[] = [];
  const errors: QuarantineRecord[] = [];

  for (let i = 0; i < sampleRecords.length; i++) {
    const outcome = TransformationEngine.transformRecord(
      sampleRecords[i],
      i,
      plan.mappings,
      plan.targetSchema
    );
    if (outcome.isValid && outcome.transformedRecord) {
      validRecords.push(outcome.transformedRecord);
    } else {
      errors.push(...outcome.quarantineErrors);
    }
  }

  quarantineStore = errors;

  const targetTableName = plan.targetSchema.name || 'target_table';
  const primaryKey = plan.targetSchema.primaryKey || 'id';

  const quarantinedRowCount = sampleRecords.length - validRecords.length;

  const { result, snapshotId } = mockDb.executeMigration(
    plan.id,
    plan.version,
    targetTableName,
    primaryKey,
    validRecords,
    sampleRecords.length,
    quarantinedRowCount,
    token
  );

  res.json({
    success: true,
    data: {
      ...result,
      snapshotId,
    },
  });
});

// 3. Rollback Migration
router.post('/rollback', (req, res) => {
  const { executionId, snapshotId } = req.body;

  if (!executionId) {
    return res.status(400).json({ success: false, error: 'executionId is required' });
  }

  const success = mockDb.rollback(executionId, snapshotId);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Execution not found or rollback failed' });
  }

  res.json({
    success: true,
    message: `Execution ${executionId} rolled back successfully. Target database restored.`,
  });
});

// 4. View Target DB Data
router.get('/target-data', (req, res) => {
  const tableName = (req.query.table as string) || 'identity_accounts_v2';
  const records = mockDb.getTable(tableName);
  res.json({
    success: true,
    data: {
      tableName,
      rowCount: records.length,
      records,
    },
  });
});

// 5. View Quarantined Records
router.get('/quarantine', (_req, res) => {
  res.json({
    success: true,
    data: {
      count: quarantineStore.length,
      records: quarantineStore,
    },
  });
});

// 6. Execution History & Reconciliation
router.get('/history', (_req, res) => {
  const history = mockDb.getExecutionHistory();
  res.json({
    success: true,
    data: history,
  });
});

export default router;
