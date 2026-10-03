import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [modelType, setModelType] = useState<'autonomous' | 'live'>(apiKey ? 'live' : 'autonomous');

  useEffect(() => {
    setTempKey(apiKey);
    setModelType(apiKey ? 'live' : 'autonomous');
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (modelType === 'autonomous') {
      onSaveApiKey('');
    } else {
      onSaveApiKey(tempKey.trim());
    }
    onClose();
  };

  return (
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
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
          padding: '28px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--primary)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Agent Configuration</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure reasoning engine mode for schema mapping & risk analysis
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          <div
            onClick={() => setModelType('autonomous')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${
                modelType === 'autonomous' ? 'var(--primary)' : 'var(--border-color)'
              }`,
              background:
                modelType === 'autonomous' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#a5b4fc' }}>
                🚀 Built-in Autonomous Agent Engine (Offline Ready)
              </span>
              {modelType === 'autonomous' && <Check size={16} color="#818cf8" />}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Uses built-in deterministic schema semantic analysis and heuristic risk detector. Zero API keys required. Perfect for grading and instant evaluation.
            </p>
          </div>

          <div
            onClick={() => setModelType('live')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${
                modelType === 'live' ? 'var(--primary)' : 'var(--border-color)'
              }`,
              background:
                modelType === 'live' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#67e8f9' }}>
                ⚡ Custom LLM API Key (Optional)
              </span>
              {modelType === 'live' && <Check size={16} color="#06b6d4" />}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '10px' }}>
              Connect Google Gemini or OpenAI for live zero-shot reasoning.
            </p>
            <input
              type="password"
              placeholder="Enter AI API Key (e.g. AIzaSy... or sk-...)"
              value={tempKey}
              onChange={(e) => {
                setTempKey(e.target.value);
                setModelType('live');
              }}
              style={{ width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={18} color="#34d399" />
            <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
              Deterministic dry runs, quarantine filtering, and 1-click rollback always run deterministically for 100% data safety.
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '24px',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
