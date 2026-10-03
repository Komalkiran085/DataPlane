import { describe, it, expect, beforeEach } from 'vitest';
import { MockDatabaseStore } from '../services/mockDatabase';

describe('MockDatabase - Idempotency and Rollback State Machine', () => {
  let db: MockDatabaseStore;

  beforeEach(() => {
    db = new MockDatabaseStore();
  });

  it('should insert records and establish reconciliation parity', () => {
    const records = [
      { user_id: 'USR-1', first_name: 'Alice', email: 'alice@test.com' },
      { user_id: 'USR-2', first_name: 'Bob', email: 'bob@test.com' },
    ];

    const { result } = db.executeMigration(
      'PLAN-1',
      1,
      'users_table',
      'user_id',
      records,
      3, // 3 total source records
      1, // 1 quarantined record
      'IDEM-TOKEN-1'
    );

    expect(result.status).toBe('completed');
    expect(result.insertedRecordsCount).toBe(2);
    expect(result.reconciliation.targetCount).toBe(2);
    expect(result.reconciliation.parityMatched).toBe(true);
  });

  it('should suppress duplicate migration execution when using identical idempotency token', () => {
    const records = [{ user_id: 'USR-1', first_name: 'Alice', email: 'alice@test.com' }];

    const firstRun = db.executeMigration(
      'PLAN-1',
      1,
      'users_table',
      'user_id',
      records,
      1,
      0,
      'IDEM-DUPLICATE-CHECK'
    );

    expect(firstRun.result.isDuplicateExecutionSuppressed).toBe(false);

    // Second run with identical token
    const secondRun = db.executeMigration(
      'PLAN-1',
      1,
      'users_table',
      'user_id',
      records,
      1,
      0,
      'IDEM-DUPLICATE-CHECK'
    );

    expect(secondRun.result.isDuplicateExecutionSuppressed).toBe(true);
    expect(db.getTable('users_table').length).toBe(1); // Row count not duplicated
  });

  it('should atomically rollback target database to pre-migration snapshot', () => {
    const records = [
      { user_id: 'USR-1', first_name: 'Alice' },
      { user_id: 'USR-2', first_name: 'Bob' },
    ];

    const { result, snapshotId } = db.executeMigration(
      'PLAN-1',
      1,
      'users_table',
      'user_id',
      records,
      2,
      0,
      'IDEM-TOKEN-ROLLBACK'
    );

    expect(db.getTable('users_table').length).toBe(2);

    // Trigger rollback
    const rollbackSuccess = db.rollback(result.executionId, snapshotId);
    expect(rollbackSuccess).toBe(true);
    expect(db.getTable('users_table').length).toBe(0); // Restored to clean state

    const history = db.getExecutionHistory();
    const rolledBackExec = history.find((e) => e.executionId === result.executionId);
    expect(rolledBackExec?.status).toBe('rolled_back');
    expect(rolledBackExec?.rolledBackAt).toBeDefined();
  });
});
