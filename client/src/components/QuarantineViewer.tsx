import React, { useState } from 'react';
import type { QuarantineRecord } from '../types';
import { ShieldAlert, Download, Search, Eye, X } from 'lucide-react';

interface QuarantineViewerProps {
  quarantined: QuarantineRecord[];
}

export const QuarantineViewer: React.FC<QuarantineViewerProps> = ({ quarantined }) => {
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = quarantined.filter(
    (q) =>
      q.failedField.toLowerCase().includes(filterQuery.toLowerCase()) ||
      q.errorCode.toLowerCase().includes(filterQuery.toLowerCase()) ||
      q.errorMessage.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleExportCsv = () => {
    if (quarantined.length === 0) return;
    const headers = ['ID', 'SourceRowIndex', 'FailedField', 'ErrorCode', 'ErrorMessage', 'AttemptedValue', 'SourceRecordJSON'];
    const rows = quarantined.map((q) => [
      q.id,
      q.sourceRowIndex + 1,
      q.failedField,
      q.errorCode,
      `"${q.errorMessage.replace(/"/g, '""')}"`,
      `"${String(q.attemptedValue || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(q.sourceRecord).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dataplane_quarantine_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueRowsCount = new Set(quarantined.map((q) => q.sourceRowIndex)).size;

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
              background: 'rgba(244, 63, 94, 0.2)',
              color: 'var(--accent-rose)',
            }}
          >
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Quarantine & Error Evidence Workbench
              </h2>
              <span className={`badge ${uniqueRowsCount > 0 ? 'badge-danger' : 'badge-success'}`}>
                {uniqueRowsCount} Quarantined Record{uniqueRowsCount === 1 ? '' : 's'} ({quarantined.length} Field Error{quarantined.length === 1 ? '' : 's'})
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Field-level error diagnostics, non-conforming data records, and exportable remediation logs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Filter errors..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{ paddingLeft: '30px', fontSize: '0.78rem', width: '160px' }}
            />
          </div>

          <button
            onClick={handleExportCsv}
            disabled={quarantined.length === 0}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '7px 12px' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {quarantined.length > 0 ? (
        <div style={{ overflowX: 'auto', maxHeight: '350px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Row #</th>
                <th>Failed Field</th>
                <th>Error Code</th>
                <th>Error Reason / Evidence</th>
                <th>Attempted Value</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-dim)' }}>{item.sourceRowIndex + 1}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#fda4af', fontFamily: 'monospace' }}>
                      {item.failedField}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>
                      {item.errorCode}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#f1f5f9' }}>{item.errorMessage}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#fcd34d' }}>
                    {item.attemptedValue === undefined || item.attemptedValue === null
                      ? 'null'
                      : String(item.attemptedValue)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedRecord(item)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      title="Inspect full source record"
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
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
            background: 'rgba(16, 185, 129, 0.03)',
            border: '1px dashed rgba(16, 185, 129, 0.3)',
          }}
        >
          <p style={{ fontSize: '0.88rem', color: '#6ee7b7', fontWeight: 600 }}>
            🎉 Zero Quarantine Violations Detected!
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            All source records conform to target schema constraints and transformation rules.
          </p>
        </div>
      )}

      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--modal-bg)',
              padding: '24px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedRecord(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: '#fda4af' }}>
              Quarantine Diagnostic — Row #{selectedRecord.sourceRowIndex + 1}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Failed on field <code style={{ color: '#ffffff' }}>{selectedRecord.failedField}</code> ({selectedRecord.errorCode})
            </p>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Error Diagnostic:
              </span>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fecdd3',
                  fontSize: '0.8rem',
                  marginTop: '4px',
                }}
              >
                {selectedRecord.errorMessage}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Raw Source Record Data (JSON):
              </span>
              <pre
                style={{
                  background: '#06080e',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  color: '#38bdf8',
                  marginTop: '4px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedRecord.sourceRecord, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
