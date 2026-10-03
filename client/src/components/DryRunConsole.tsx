import React from 'react';
import type { DryRunResult, MigrationPlan } from '../types';
import { Play, Activity } from 'lucide-react';

interface DryRunConsoleProps {
  plan: MigrationPlan;
  dryRunResult: DryRunResult | null;
  isRunningDryRun: boolean;
  onExecuteDryRun: () => void;
}

export const DryRunConsole: React.FC<DryRunConsoleProps> = ({
  plan,
  dryRunResult,
  isRunningDryRun,
  onExecuteDryRun,
}) => {
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
              background: 'rgba(6, 182, 212, 0.2)',
              color: 'var(--accent-cyan)',
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Deterministic Dry-Run Simulation
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Simulate full ETL transformations against sample records without writing to the target store
            </p>
          </div>
        </div>

        <button
          onClick={onExecuteDryRun}
          disabled={isRunningDryRun}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            padding: '8px 18px',
            fontSize: '0.82rem',
          }}
        >
          {isRunningDryRun ? (
            <>
              <Activity size={15} className="pulse-glow" /> Simulating Dry Run...
            </>
          ) : (
            <>
              <Play size={15} /> Execute Deterministic Dry-Run
            </>
          )}
        </button>
      </div>

      {dryRunResult ? (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Source Records
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)' }}>
                {dryRunResult.totalSourceRecords}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', fontWeight: 600 }}>
                Accepted (Valid)
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent-emerald)' }}>
                {dryRunResult.acceptedRecordsCount}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background:
                  dryRunResult.rejectedRecordsCount > 0
                    ? 'rgba(244, 63, 94, 0.06)'
                    : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${
                  dryRunResult.rejectedRecordsCount > 0
                    ? 'rgba(244, 63, 94, 0.3)'
                    : 'var(--border-color)'
                }`,
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', textTransform: 'uppercase', fontWeight: 600 }}>
                Quarantined (Errors)
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent-rose)' }}>
                {dryRunResult.rejectedRecordsCount}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Data Validity Pass Rate
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary)' }}>
                {Math.round(
                  (dryRunResult.acceptedRecordsCount / (dryRunResult.totalSourceRecords || 1)) * 100
                )}
                %
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--btn-sec-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Dry-Run Latency
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent-cyan)' }}>
                {dryRunResult.durationMs} ms
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
              Transformed Target Schema Preview (First {dryRunResult.sampleTransformed.length} Accepted Rows)
            </h3>
            <div style={{ overflowX: 'auto', maxHeight: '280px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
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
                  {dryRunResult.sampleTransformed.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{idx + 1}</td>
                      {plan.targetSchema.fields.map((f) => (
                        <td key={f.name} style={{ fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>
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
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Activity size={32} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            No Dry-Run executed yet for Plan v{plan.version}.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Click "Execute Deterministic Dry-Run" to test all transformations, validate schema constraints, and detect quarantine rows.
          </p>
        </div>
      )}
    </div>
  );
};
