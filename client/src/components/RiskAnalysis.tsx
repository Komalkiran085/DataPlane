import React from 'react';
import type { ClarificationQuestion, MappingRisk } from '../types';
import { ShieldAlert, HelpCircle, AlertTriangle, Check } from 'lucide-react';

interface RiskAnalysisProps {
  risks: MappingRisk[];
  clarifications: ClarificationQuestion[];
  onSelectOption: (questionId: string, option: string) => void;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({
  risks,
  clarifications,
  onSelectOption,
}) => {
  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: 'var(--accent-amber)',
          }}
        >
          <ShieldAlert size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            AI Risk Analysis & Interactive Clarifications
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Agent-identified schema gaps, incompatible types, and operator decisions
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#f59e0b" /> Identified Migration Risks ({risks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {risks.map((risk) => {
              const isHigh = risk.severity === 'high' || risk.severity === 'critical';
              return (
                <div
                  key={risk.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: isHigh ? 'rgba(244, 63, 94, 0.06)' : 'rgba(245, 158, 11, 0.05)',
                    border: `1px solid ${isHigh ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      {risk.title}
                    </span>
                    <span className={`badge ${isHigh ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {risk.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {risk.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    🛡️ <strong>Mitigation:</strong> {risk.mitigation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={15} color="#06b6d4" /> Operator Clarification Questions ({clarifications.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {clarifications.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--btn-sec-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px', color: 'var(--text-main)' }}>
                  {q.question}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {q.context}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {q.options.map((opt) => {
                    const isSelected = q.selectedOption === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => onSelectOption(q.id, opt)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                        {isSelected && <Check size={14} color="var(--primary)" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
