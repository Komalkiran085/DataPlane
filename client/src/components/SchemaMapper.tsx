import React from 'react';
import type {
  DatasetSchema,
  FieldMapping,
  TransformationType,
} from '../types';
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Cpu,
} from 'lucide-react';

interface SchemaMapperProps {
  sourceSchema: DatasetSchema;
  targetSchema: DatasetSchema;
  mappings: FieldMapping[];
  onUpdateMapping: (updated: FieldMapping) => void;
  onToggleStatus: (targetField: string, status: FieldMapping['status']) => void;
  reasoningLog?: string;
  isAiLoading: boolean;
  onTriggerAiPlan: () => void;
}

const TRANSFORMATION_OPTIONS: { type: TransformationType; label: string }[] = [
  { type: 'direct', label: 'Direct 1:1 Copy' },
  { type: 'split_string', label: 'Split String (by delimiter)' },
  { type: 'join_strings', label: 'Join Multiple Strings' },
  { type: 'date_format', label: 'Normalize Date (YYYY-MM-DD)' },
  { type: 'phone_e164', label: 'Normalize Phone (E.164)' },
  { type: 'type_cast', label: 'Type Cast (Integer / Float / Bool)' },
  { type: 'case_transform', label: 'Case / Trim Transform' },
  { type: 'default_value', label: 'Default Fallback Value' },
  { type: 'lookup_map', label: 'Enum Lookup Mapping' },
  { type: 'compute_age', label: 'Compute Age from DOB' },
  { type: 'regex_replace', label: 'Regex Pattern Replace' },
];

export const SchemaMapper: React.FC<SchemaMapperProps> = ({
  sourceSchema,
  targetSchema,
  mappings,
  onUpdateMapping,
  onToggleStatus,
  reasoningLog,
  isAiLoading,
  onTriggerAiPlan,
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
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--primary)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              AI Field Mapping & Transformation Workbench
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Review, tweak, or override AI-proposed field mappings before deterministic execution
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerAiPlan}
          className="btn btn-primary"
          disabled={isAiLoading}
          style={{ fontSize: '0.8rem', padding: '8px 16px' }}
        >
          {isAiLoading ? (
            <>
              <Cpu size={14} className="pulse-glow" /> AI Reasoning in Progress...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Re-run AI Mapping Analysis
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {targetSchema.fields.map((targetField) => {
          const mapping = mappings.find((m) => m.targetField === targetField.name);

          if (!mapping) {
            return (
              <div
                key={targetField.name}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px dashed rgba(244, 63, 94, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="#f43f5e" />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fda4af' }}>
                      {targetField.name}
                    </span>{' '}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      ({targetField.type})
                    </span>
                    {targetField.required && (
                      <span className="badge badge-danger" style={{ marginLeft: '8px' }}>
                        Required
                      </span>
                    )}
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      No source mapping configured for this target field.
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={() => {
                    onUpdateMapping({
                      targetField: targetField.name,
                      sourceFields: [sourceSchema.fields[0]?.name || ''],
                      transformation: 'direct',
                      confidence: 0.5,
                      status: 'modified',
                      isUserOverridden: true,
                    });
                  }}
                >
                  + Add Manual Mapping
                </button>
              </div>
            );
          }

          const isApproved = mapping.status === 'approved';
          const isRejected = mapping.status === 'rejected';

          return (
            <div
              key={targetField.name}
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: isRejected
                  ? 'transparent'
                  : isApproved
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'var(--btn-sec-bg)',
                border: `1px solid ${
                  isRejected
                    ? 'var(--border-color)'
                    : isApproved
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'var(--border-color)'
                }`,
                opacity: isRejected ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                  <div style={{ minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {targetField.name}
                      </span>
                      {targetField.required && (
                        <span style={{ color: '#f43f5e', fontSize: '0.75rem', fontWeight: 700 }}>*</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {targetField.type}
                    </span>
                  </div>

                  <ArrowRight size={16} style={{ color: 'var(--text-dim)' }} />

                  <div style={{ minWidth: '200px' }}>
                    <select
                      value={mapping.transformation}
                      onChange={(e) => {
                        onUpdateMapping({
                          ...mapping,
                          transformation: e.target.value as TransformationType,
                          isUserOverridden: true,
                          status: 'modified',
                        });
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {TRANSFORMATION_OPTIONS.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight size={16} style={{ color: 'var(--text-dim)' }} />

                  <div style={{ minWidth: '180px' }}>
                    <select
                      value={mapping.sourceFields[0] || ''}
                      onChange={(e) => {
                        onUpdateMapping({
                          ...mapping,
                          sourceFields: [e.target.value],
                          isUserOverridden: true,
                          status: 'modified',
                        });
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}
                    >
                      {sourceSchema.fields.map((sf) => (
                        <option key={sf.name} value={sf.name}>
                          {sf.name} ({sf.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className="badge badge-primary"
                    style={{
                      fontSize: '0.72rem',
                    }}
                  >
                    {Math.round(mapping.confidence * 100)}% match
                  </span>

                  <button
                    onClick={() => onToggleStatus(mapping.targetField, isApproved ? 'proposed' : 'approved')}
                    className={`btn ${isApproved ? 'btn-success' : 'btn-secondary'}`}
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    title={isApproved ? 'Mark as Proposed' : 'Approve Mapping'}
                  >
                    <Check size={14} />
                    {isApproved ? 'Approved' : 'Approve'}
                  </button>

                  <button
                    onClick={() => onToggleStatus(mapping.targetField, isRejected ? 'proposed' : 'rejected')}
                    className={`btn ${isRejected ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                    title={isRejected ? 'Restore Mapping' : 'Exclude / Reject Mapping'}
                  >
                    <X size={14} />
                    {isRejected ? 'Excluded' : 'Exclude'}
                  </button>
                </div>
              </div>

              {mapping.notes && (
                <div style={{ marginTop: '10px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  💡 <span style={{ fontStyle: 'italic' }}>{mapping.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reasoningLog && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Cpu size={14} color="#34d399" />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6ee7b7' }}>
              Agent Reasoning & Heuristic Inspection Stream
            </span>
          </div>
          <div className="terminal-window" style={{ maxHeight: '140px' }}>
            {reasoningLog.split('\n').map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
