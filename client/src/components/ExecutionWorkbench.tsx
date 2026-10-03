import React, { useState } from 'react';
import type { ExecutionResult, MigrationPlan } from '../types';
import {
  Play,
  RotateCcw,
  AlertCircle,
  Database,
  Lock,
  Layers,
  Scale,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExecutionWorkbenchProps {
  plan: MigrationPlan;
  lastExecution: ExecutionResult | null;
  targetRecords: Record<string, any>[];
  isExecuting: boolean;
  isRollingBack: boolean;
  onExecuteMigration: (idempotencyToken?: string) => void;
  onRollback: (executionId: string, snapshotId?: string) => void;
  onRefreshTargetData: () => void;
}

export const ExecutionWorkbench: React.FC<ExecutionWorkbenchProps> = ({
  plan,
  lastExecution,
  targetRecords,
  isExecuting,
  isRollingBack,
  onExecuteMigration,
  onRollback,
  onRefreshTargetData,
}) => {
  const [customToken, setCustomToken] = useState('');
  const isApproved = plan.status === 'approved';

  const handleExecute = () => {
    onExecuteMigration(customToken.trim() || undefined);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (_) {}
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              color: '#34d399',
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Live Target Database Execution & 1-Click Rollback
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Execute into staging mock store, test idempotent retry suppression, and verify source-to-target reconciliation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Idempotency Token (Auto)"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              style={{ width: '160px', fontSize: '0.75rem' }}
              title="Leave blank for auto-generated token or enter token to test duplicate suppression"
            />
          </div>

          <button
            onClick={handleExecute}
            disabled={!isApproved || isExecuting}
            className="btn btn-success"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            title={!isApproved ? 'Requires human plan approval before execution' : 'Execute migration into mock DB'}
          >
            {isExecuting ? (
              <>
                <RefreshCw size={14} className="pulse-glow" /> Staging into Target DB...
              </>
            ) : (
              <>
                <Play size={14} /> Commit Migration to Target DB
              </>
            )}
          </button>
        </div>
      </div>

      {!isApproved && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={18} color="#f59e0b" />
          <span style={{ fontSize: '0.8rem', color: '#fde68a' }}>
            <strong>Human Approval Required:</strong> You must approve the migration plan in the <strong>Plan Approval</strong> tab before executing data writes into the mock target database.
          </span>
        </div>
      )}

      {lastExecution && (
        <div
          style={{
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            background:
              lastExecution.status === 'rolled_back'
                ? 'rgba(244, 63, 94, 0.05)'
                : 'var(--btn-sec-bg)',
            border: `1px solid ${
              lastExecution.status === 'rolled_back'
                ? 'rgba(244, 63, 94, 0.3)'
                : 'var(--border-active)'
            }`,
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Reconciliation Balance Sheet ({lastExecution.executionId})
              </h3>
              <span
                className={`badge ${
                  lastExecution.status === 'rolled_back'
                    ? 'badge-danger'
                    : lastExecution.reconciliation.parityMatched
                    ? 'badge-success'
                    : 'badge-warning'
                }`}
              >
                {lastExecution.status === 'rolled_back'
                  ? 'ROLLED BACK'
                  : lastExecution.reconciliation.parityMatched
                  ? 'PERFECT RECONCILIATION (100% PARITY)'
                  : 'DISCREPANCY DETECTED'}
              </span>
            </div>

            {lastExecution.status === 'completed' && (
              <button
                onClick={() => onRollback(lastExecution.executionId, lastExecution.snapshotId)}
                disabled={isRollingBack}
                className="btn btn-danger"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                title="Revert mock target table back to pre-migration snapshot"
              >
                {isRollingBack ? (
                  <>
                    <RefreshCw size={13} className="pulse-glow" /> Rolling back...
                  </>
                ) : (
                  <>
                    <RotateCcw size={13} /> 1-Click Rollback Migration
                  </>
                )}
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Source Total
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {lastExecution.reconciliation.sourceCount}
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                Target Inserted
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {lastExecution.insertedRecordsCount}
              </div>
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', textTransform: 'uppercase' }}>
                Quarantined
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                {lastExecution.quarantinedRecordsCount}
              </div>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Idempotency Guard
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: lastExecution.isDuplicateExecutionSuppressed ? 'var(--accent-amber)' : 'var(--accent-emerald)', marginTop: '4px' }}>
                {lastExecution.isDuplicateExecutionSuppressed ? 'Duplicate Suppressed' : 'Fresh Commit'}
              </div>
            </div>
          </div>

          {lastExecution.isDuplicateExecutionSuppressed && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.75rem',
                color: 'var(--accent-amber)',
              }}
            >
              🔒 <strong>Idempotency Active:</strong> Duplicate execution was recognized and suppressed. Target database was preserved without inserting duplicate rows.
            </div>
          )}
        </div>
      )}

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} color="var(--accent-cyan)" /> Target Staging Table ({plan.targetSchema.name}) — {targetRecords.length} Active Records
          </h3>
          <button
            onClick={onRefreshTargetData}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {targetRecords.length > 0 ? (
          <div style={{ overflowX: 'auto', maxHeight: '300px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  {plan.targetSchema.fields.map((f) => (
                    <th key={f.name}>{f.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {targetRecords.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    {plan.targetSchema.fields.map((f) => (
                      <td key={f.name} style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>
                        {row[f.name] !== undefined && row[f.name] !== null
                          ? String(row[f.name])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Target database table is currently empty. Execute an approved plan above to stage records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
