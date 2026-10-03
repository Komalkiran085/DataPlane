import React from 'react';
import { Database, Sparkles, Settings, RefreshCw, Cpu, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  samples: Array<{ id: string; name: string; domain: string }>;
  selectedSampleId: string;
  onSelectSample: (id: string) => void;
  onOpenSettings: () => void;
  onReset: () => void;
  isAiProcessing: boolean;
  hasApiKey: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  samples,
  selectedSampleId,
  onSelectSample,
  onOpenSettings,
  onReset,
  isAiProcessing,
  hasApiKey,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px' }}>
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
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Database size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
                DataPlane
              </h1>
              <span className="badge badge-primary">Workbench v1.0</span>
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} /> Agentic ETL
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Agentic Schema Migration Planner, Deterministic Dry-Run & Reconciliation Engine
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Dataset Scenario:
            </label>
            <select
              value={selectedSampleId}
              onChange={(e) => onSelectSample(e.target.value)}
              style={{ minWidth: '230px', fontWeight: 500 }}
              disabled={isAiProcessing}
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.domain})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenSettings}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            title="Configure AI Agent Engine or Custom API Key"
          >
            <Cpu size={14} color={hasApiKey ? '#34d399' : '#818cf8'} />
            {hasApiKey ? 'Live LLM Active' : 'Autonomous Engine'}
            <Settings size={13} style={{ marginLeft: '2px', opacity: 0.7 }} />
          </button>

          <button
            onClick={onToggleTheme}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} color="#f59e0b" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={14} color="#6366f1" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            title="Reset to default dataset state"
            disabled={isAiProcessing}
          >
            <RefreshCw size={14} />
            Reset State
          </button>
        </div>
      </div>
    </header>
  );
};
