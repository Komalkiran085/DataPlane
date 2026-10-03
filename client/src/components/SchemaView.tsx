import React, { useState } from 'react';
import type { DatasetSchema } from '../types';
import { Database, FileText, Table, Key } from 'lucide-react';

interface SchemaViewProps {
  sourceSchema: DatasetSchema;
  targetSchema: DatasetSchema;
  sampleRecords: Record<string, any>[];
}

export const SchemaView: React.FC<SchemaViewProps> = ({
  sourceSchema,
  targetSchema,
  sampleRecords,
}) => {
  const [viewTab, setViewTab] = useState<'fields' | 'raw_data'>('fields');

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
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Schema Specification & Inspection</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Source structure ({sourceSchema.name}) vs Target requirement ({targetSchema.name})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--btn-sec-bg)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewTab('fields')}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '6px',
              background: viewTab === 'fields' ? 'var(--primary)' : 'transparent',
              color: viewTab === 'fields' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={14} /> Schema Fields
          </button>
          <button
            onClick={() => setViewTab('raw_data')}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: '6px',
              background: viewTab === 'raw_data' ? 'var(--primary)' : 'transparent',
              color: viewTab === 'raw_data' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Table size={14} /> Source Sample Records ({sampleRecords.length})
          </button>
        </div>
      </div>

      {viewTab === 'fields' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--btn-sec-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-cyan">SOURCE</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{sourceSchema.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {sourceSchema.fields.length} columns
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {sourceSchema.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sourceSchema.fields.map((f) => (
                <div
                  key={f.name}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {f.name === sourceSchema.primaryKey ? (
                      <span title="Primary Key">
                        <Key size={13} color="#f59e0b" />
                      </span>
                    ) : (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-dim)' }} />
                    )}
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {f.name}
                    </span>
                    {f.required && (
                      <span style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 700 }}>*</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(6, 182, 212, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {f.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'var(--btn-sec-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-primary">TARGET</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{targetSchema.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {targetSchema.fields.length} target fields
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {targetSchema.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {targetSchema.fields.map((f) => (
                <div
                  key={f.name}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {f.name === targetSchema.primaryKey ? (
                      <span title="Primary Key">
                        <Key size={13} color="#f59e0b" />
                      </span>
                    ) : (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                    )}
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {f.name}
                    </span>
                    {f.required && (
                      <span className="badge badge-danger" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {f.constraints?.enumValues && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: '#fcd34d',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '2px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        enum[{f.constraints.enumValues.length}]
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        color: 'var(--primary)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {f.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                {sourceSchema.fields.map((f) => (
                  <th key={f.name}>{f.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRecords.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{idx + 1}</td>
                  {sourceSchema.fields.map((f) => {
                    const val = row[f.name];
                    const isMissing = val === null || val === undefined || val === '';
                    return (
                      <td key={f.name} style={{ fontFamily: 'monospace' }}>
                        {isMissing ? (
                          <span style={{ color: '#f43f5e', opacity: 0.8, fontStyle: 'italic' }}>null</span>
                        ) : typeof val === 'object' ? (
                          JSON.stringify(val)
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
