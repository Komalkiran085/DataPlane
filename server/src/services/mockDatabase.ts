import { v4 as uuidv4 } from 'uuid';
import { AuditLogEntry, ExecutionResult } from '../types';

export interface DatabaseSnapshot {
  snapshotId: string;
  timestamp: string;
  tableName: string;
  records: Record<string, any>[];
}

export class MockDatabaseStore {
  private tables: Map<string, Record<string, any>[]> = new Map();
  private snapshots: Map<string, DatabaseSnapshot> = new Map();
  private executionHistory: ExecutionResult[] = new ExecutionResultStore();
  private auditLogs: AuditLogEntry[] = [];
  private executedTokens: Set<string> = new Set();

  constructor() {
    this.addAuditLog('PLAN_CREATED', 'SYSTEM', { message: 'Mock database store initialized' });
  }

  public getTable(tableName: string): Record<string, any>[] {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    return this.tables.get(tableName)!;
  }

  public clearTable(tableName: string) {
    this.tables.set(tableName, []);
  }

  /**
   * Captures an atomic snapshot of the target table state prior to execution
   */
  public createSnapshot(tableName: string): string {
    const snapshotId = `SNAP-${uuidv4().substring(0, 8).toUpperCase()}`;
    const currentRecords = JSON.parse(JSON.stringify(this.getTable(tableName)));
    this.snapshots.set(snapshotId, {
      snapshotId,
      timestamp: new Date().toISOString(),
      tableName,
      records: currentRecords,
    });
    return snapshotId;
  }

  /**
   * Executes migration with idempotency check and duplicate suppression
   */
  public executeMigration(
    planId: string,
    planVersion: number,
    tableName: string,
    primaryKey: string,
    recordsToInsert: Record<string, any>[],
    totalSourceCount: number,
    quarantinedCount: number,
    idempotencyToken: string
  ): { result: ExecutionResult; snapshotId: string } {
    const isDuplicate = this.executedTokens.has(idempotencyToken);

    if (isDuplicate) {
      // Duplicate execution suppressed to preserve idempotency
      const existingExecution = this.executionHistory.find((e) => e.idempotencyToken === idempotencyToken);
      this.addAuditLog('DUPLICATE_SUPPRESSED', 'DataPlane Engine', {
        idempotencyToken,
        planId,
        planVersion,
        message: 'Duplicate migration execution suppressed by idempotency guard.',
      });

      if (existingExecution) {
        return {
          result: {
            ...existingExecution,
            isDuplicateExecutionSuppressed: true,
          },
          snapshotId: '',
        };
      }
    }

    // Step 1: Create snapshot for rollback safety
    const snapshotId = this.createSnapshot(tableName);

    // Step 2: Insert records into target table with primary key deduplication / upsert
    const table = this.getTable(tableName);
    const existingPks = new Set(table.map((r) => String(r[primaryKey])));

    let newlyInserted = 0;
    for (const record of recordsToInsert) {
      const pkVal = String(record[primaryKey]);
      if (!existingPks.has(pkVal)) {
        table.push({ ...record });
        existingPks.add(pkVal);
        newlyInserted++;
      }
    }

    this.executedTokens.add(idempotencyToken);

    const targetCount = table.length;
    const parityMatched = totalSourceCount === newlyInserted + quarantinedCount;

    const executionResult: ExecutionResult = {
      executionId: `EXEC-${uuidv4().substring(0, 8).toUpperCase()}`,
      planId,
      planVersion,
      idempotencyToken,
      status: 'completed',
      totalSourceRecords: totalSourceCount,
      insertedRecordsCount: newlyInserted,
      quarantinedRecordsCount: quarantinedCount,
      isDuplicateExecutionSuppressed: false,
      reconciliation: {
        sourceCount: totalSourceCount,
        targetCount,
        quarantineCount: quarantinedCount,
        parityMatched,
        discrepancyCount: Math.abs(totalSourceCount - (newlyInserted + quarantinedCount)),
      },
      executedAt: new Date().toISOString(),
    };

    this.executionHistory.push(executionResult);
    this.addAuditLog('MIGRATION_EXECUTED', 'DataPlane Engine', {
      executionId: executionResult.executionId,
      planId,
      planVersion,
      inserted: newlyInserted,
      quarantined: quarantinedCount,
      snapshotId,
    });

    return { result: executionResult, snapshotId };
  }

  /**
   * Reverts target database to previous snapshot
   */
  public rollback(executionId: string, snapshotId?: string): boolean {
    const exec = this.executionHistory.find((e) => e.executionId === executionId);
    if (!exec) return false;

    if (snapshotId && this.snapshots.has(snapshotId)) {
      const snap = this.snapshots.get(snapshotId)!;
      this.tables.set(snap.tableName, JSON.parse(JSON.stringify(snap.records)));
    } else {
      // Fallback: clear the table if no prior snapshot
      this.tables.clear();
    }

    // Release the token so the user can re-commit freshly after rolling back
    if (exec.idempotencyToken) {
      this.executedTokens.delete(exec.idempotencyToken);
    }

    exec.status = 'rolled_back';
    exec.rolledBackAt = new Date().toISOString();

    this.addAuditLog('ROLLBACK_EXECUTED', 'User / Operator', {
      executionId,
      snapshotId,
      revertedAt: exec.rolledBackAt,
    });

    return true;
  }

  public addAuditLog(
    action: AuditLogEntry['action'],
    actor: string,
    details: Record<string, any>
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `LOG-${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      details,
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  public getExecutionHistory(): ExecutionResult[] {
    return this.executionHistory;
  }
}

// Helper class for execution history array
class ExecutionResultStore extends Array<ExecutionResult> {}

export const mockDb = new MockDatabaseStore();
