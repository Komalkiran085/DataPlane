import React, { useState } from 'react';
import type { MigrationPlan } from '../types';
import { CheckCircle2, GitBranch, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

interface PlanReviewProps {
  plan: MigrationPlan;
  onApprovePlan: (operatorName: string) => void;
  onBumpVersion: () => void;
}

export const PlanReview: React.FC<PlanReviewProps> = ({
  plan,
  onApprovePlan,
  onBumpVersion,
}) => {
  const [operatorName, setOperatorName] = useState('Data Lead / Engineer');
  const isApproved = plan.status === 'approved';

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isApproved ? '#34d399' : '#f59e0b',
            }}
          >
            {isApproved ? <ShieldCheck size={24} /> : <GitBranch size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {plan.name}
              </h2>
              <span className="badge badge-primary">Version {plan.version}.0</span>
              <span
                className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}
              >
                {isApproved ? 'APPROVED FOR EXECUTION' : 'DRAFT (APPROVAL REQUIRED)'}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isApproved
                ? `Approved by ${plan.approvedBy} on ${new Date(plan.approvedAt || '').toLocaleString()}`
                : 'Review all field mappings & mitigations above before formal approval.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!isApproved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Reviewer Name / Role"
                style={{ width: '180px', fontSize: '0.8rem' }}
              />
              <button
                className="btn btn-success"
                onClick={() => onApprovePlan(operatorName)}
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                <UserCheck size={16} /> Approve Migration Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Plan Ready for Dry-Run & Staging
              </div>
              <button
                className="btn btn-secondary"
                onClick={onBumpVersion}
                style={{ padding: '7px 12px', fontSize: '0.75rem' }}
                title="Create a new version to modify mappings"
              >
                <RefreshCw size={13} /> Edit / Bump to v{plan.version + 1}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
