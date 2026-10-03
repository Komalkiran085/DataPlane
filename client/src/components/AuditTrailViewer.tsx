import React from 'react';
import type { AuditLogEntry } from '../types';
import { History, Clock } from 'lucide-react';

interface AuditTrailViewerProps {
  logs: AuditLogEntry[];
  onRefreshLogs: () => void;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ logs, onRefreshLogs }) => {
  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: 'var(--accent-purple)',
            }}
          >
            <History size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Immutable Audit Trail & Execution History
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Chronological log of AI proposals, human approvals, dry runs, retries, and rollbacks
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshLogs}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
        >
          Refresh Logs ({logs.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
        {logs.map((log) => {
          let badgeClass = 'badge-primary';
          if (log.action.includes('APPROVED')) badgeClass = 'badge-success';
          else if (log.action.includes('ROLLBACK') || log.action.includes('SUPPRESSED')) badgeClass = 'badge-warning';
          else if (log.action.includes('DRY_RUN')) badgeClass = 'badge-cyan';

          return (
            <div
              key={log.id}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge ${badgeClass}`} style={{ fontSize: '0.68rem' }}>
                  {log.action}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#f1f5f9', fontWeight: 500 }}>
                  Actor: <strong style={{ color: '#a5b4fc' }}>{log.actor}</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  {JSON.stringify(log.details)}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
