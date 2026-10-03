import React, { useState, useEffect } from 'react';
import type {
  AuditLogEntry,
  DatasetSchema,
  DryRunResult,
  ExecutionResult,
  FieldMapping,
  MigrationPlan,
  SampleDatasetBundle,
} from './types';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SchemaView } from './components/SchemaView';
import { SchemaMapper } from './components/SchemaMapper';
import { RiskAnalysis } from './components/RiskAnalysis';
import { PlanReview } from './components/PlanReview';
import { DryRunConsole } from './components/DryRunConsole';
import { QuarantineViewer } from './components/QuarantineViewer';
import { ExecutionWorkbench } from './components/ExecutionWorkbench';
import { AuditTrailViewer } from './components/AuditTrailViewer';
import {
  Layers,
  Sparkles,
  ShieldAlert,
  FileCheck,
  Activity,
  AlertOctagon,
  Database,
  History,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [samplesList, setSamplesList] = useState<Array<{ id: string; name: string; domain: string }>>([]);
  const [currentBundle, setCurrentBundle] = useState<SampleDatasetBundle | null>(null);
  const [activePlan, setActivePlan] = useState<MigrationPlan | null>(null);
  const [reasoningLog, setReasoningLog] = useState<string>('');
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [lastExecution, setLastExecution] = useState<ExecutionResult | null>(null);
  const [targetRecords, setTargetRecords] = useState<Record<string, any>[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<
    'schema' | 'mapper' | 'risks' | 'plan' | 'dryrun' | 'quarantine' | 'execute' | 'audit'
  >('mapper');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRunningDryRun, setIsRunningDryRun] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('dataplane_api_key') || '');
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('dataplane_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dataplane_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchSamples();
    fetchAuditLogs();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const fetchSamples = async () => {
    try {
      const res = await fetch('/api/schemas/samples');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSamplesList(data.data);
        loadSampleBundle(data.data[0].id);
      }
    } catch (err: any) {
      showError('Failed to connect to backend server: ' + err.message);
    }
  };

  const loadSampleBundle = async (sampleId: string) => {
    setIsAiLoading(true);
    setDryRunResult(null);
    setLastExecution(null);
    setTargetRecords([]);
    try {
      const res = await fetch(`/api/schemas/samples/${sampleId}`);
      const data = await res.json();
      if (data.success) {
        const bundle: SampleDatasetBundle = data.data;
        setCurrentBundle(bundle);
        await generateAiPlan(bundle.sourceSchema, bundle.targetSchema, bundle.sampleRecords);
      }
    } catch (err: any) {
      showError('Error loading sample dataset: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateAiPlan = async (
    sourceSchema: DatasetSchema,
    targetSchema: DatasetSchema,
    sampleRecords: Record<string, any>[],
    keyOverride?: string
  ) => {
    setIsAiLoading(true);
    try {
      const effectiveKey = keyOverride !== undefined ? keyOverride : apiKey;
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSchema,
          targetSchema,
          sampleRecords,
          apiKey: effectiveKey && effectiveKey.trim().length > 0 ? effectiveKey.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const planData = data.data;
        const newPlan: MigrationPlan = {
          id: `PLAN-${Date.now().toString().slice(-6)}`,
          version: 1,
          name: `${sourceSchema.name} -> ${targetSchema.name}`,
          sourceSchema,
          targetSchema,
          mappings: planData.mappings,
          risks: planData.risks,
          clarifications: planData.clarifications,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setActivePlan(newPlan);
        setReasoningLog(planData.reasoningLog || '');
        showSuccess('AI Agent analyzed schemas and proposed transformation mappings.');
        fetchAuditLogs();
      }
    } catch (err: any) {
      showError('AI Agent planning failed: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUpdateMapping = (updated: FieldMapping) => {
    if (!activePlan) return;
    const newMappings = activePlan.mappings.map((m) =>
      m.targetField === updated.targetField ? updated : m
    );
    if (!activePlan.mappings.some((m) => m.targetField === updated.targetField)) {
      newMappings.push(updated);
    }
    setActivePlan({
      ...activePlan,
      mappings: newMappings,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleStatus = (targetField: string, newStatus: FieldMapping['status']) => {
    if (!activePlan) return;
    const newMappings = activePlan.mappings.map((m) =>
      m.targetField === targetField ? { ...m, status: newStatus } : m
    );
    setActivePlan({
      ...activePlan,
      mappings: newMappings,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSelectClarification = (qId: string, option: string) => {
    if (!activePlan) return;
    const newClarifications = activePlan.clarifications.map((q) =>
      q.id === qId ? { ...q, selectedOption: option, answered: true } : q
    );
    setActivePlan({
      ...activePlan,
      clarifications: newClarifications,
      updatedAt: new Date().toISOString(),
    });
    showSuccess('Operator decision saved.');
  };

  const handleApprovePlan = (operatorName: string) => {
    if (!activePlan) return;
    const now = new Date().toISOString();
    const approved: MigrationPlan = {
      ...activePlan,
      status: 'approved',
      approvedAt: now,
      approvedBy: operatorName || 'Lead Data Engineer',
      updatedAt: now,
      mappings: activePlan.mappings.map((m) =>
        m.status === 'proposed' ? { ...m, status: 'approved' } : m
      ),
    };
    setActivePlan(approved);
    showSuccess(`Plan v${approved.version} formally approved by ${approved.approvedBy}.`);
    fetchAuditLogs();
    setActiveTab('dryrun');
  };

  const handleBumpVersion = () => {
    if (!activePlan) return;
    const bumped: MigrationPlan = {
      ...activePlan,
      version: activePlan.version + 1,
      status: 'draft',
      approvedAt: undefined,
      approvedBy: undefined,
      updatedAt: new Date().toISOString(),
    };
    setActivePlan(bumped);
    showSuccess(`Created Plan Draft v${bumped.version}. You may now edit mappings.`);
    fetchAuditLogs();
  };

  const handleExecuteDryRun = async () => {
    if (!activePlan || !currentBundle) return;
    setIsRunningDryRun(true);
    try {
      const res = await fetch('/api/migration/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: activePlan,
          sampleRecords: currentBundle.sampleRecords,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDryRunResult(data.data);
        showSuccess(
          `Dry-Run Completed: ${data.data.acceptedRecordsCount} accepted, ${data.data.rejectedRecordsCount} quarantined.`
        );
        fetchAuditLogs();
      }
    } catch (err: any) {
      showError('Dry-run simulation failed: ' + err.message);
    } finally {
      setIsRunningDryRun(false);
    }
  };

  const handleExecuteMigration = async (idempotencyToken?: string) => {
    if (!activePlan || !currentBundle) return;
    setIsExecuting(true);
    try {
      const res = await fetch('/api/migration/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: activePlan,
          sampleRecords: currentBundle.sampleRecords,
          idempotencyToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastExecution(data.data);
        if (data.data.isDuplicateExecutionSuppressed) {
          showSuccess('Idempotency Guard: Duplicate execution suppressed safely!');
        } else {
          showSuccess(
            `Migration Committed! ${data.data.insertedRecordsCount} rows inserted into mock target store.`
          );
        }
        fetchTargetData();
        fetchAuditLogs();
      }
    } catch (err: any) {
      showError('Execution failed: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRollback = async (executionId: string, snapshotId?: string) => {
    setIsRollingBack(true);
    try {
      const res = await fetch('/api/migration/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId, snapshotId }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Rollback Successful: Target database restored to clean pre-migration snapshot.');
        if (lastExecution) {
          setLastExecution({ ...lastExecution, status: 'rolled_back' });
        }
        fetchTargetData();
        fetchAuditLogs();
      }
    } catch (err: any) {
      showError('Rollback failed: ' + err.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  const fetchTargetData = async () => {
    if (!activePlan) return;
    try {
      const res = await fetch(`/api/migration/target-data?table=${activePlan.targetSchema.name}`);
      const data = await res.json();
      if (data.success) {
        setTargetRecords(data.data.records);
      }
    } catch (err) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {}
  };

  const handleSaveApiKey = (key: string) => {
    const trimmed = key ? key.trim() : '';
    setApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('dataplane_api_key', trimmed);
      showSuccess('Custom LLM API Key applied.');
    } else {
      localStorage.removeItem('dataplane_api_key');
      showSuccess('Switched to Built-in Autonomous Agent Engine (Offline).');
    }

    if (currentBundle) {
      generateAiPlan(currentBundle.sourceSchema, currentBundle.targetSchema, currentBundle.sampleRecords, trimmed);
    }
  };

  const handleReset = () => {
    if (currentBundle) {
      loadSampleBundle(currentBundle.id);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 60px' }}>
      <Header
        samples={samplesList}
        selectedSampleId={currentBundle?.id || ''}
        onSelectSample={loadSampleBundle}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleReset}
        isAiProcessing={isAiLoading}
        hasApiKey={Boolean(apiKey)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {successMessage && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fda4af',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {/* Workflow Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => setActiveTab('schema')}
          className={`btn ${activeTab === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Layers size={14} /> Schemas & Data
        </button>

        <button
          onClick={() => setActiveTab('mapper')}
          className={`btn ${activeTab === 'mapper' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Sparkles size={14} /> AI Field Mapper
          {activePlan && (
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              {activePlan.mappings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('risks')}
          className={`btn ${activeTab === 'risks' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <ShieldAlert size={14} /> Risks & Q&A
          {activePlan && activePlan.risks.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
              {activePlan.risks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`btn ${activeTab === 'plan' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <FileCheck size={14} /> Plan Approval
          {activePlan && (
            <span
              className={`badge ${activePlan.status === 'approved' ? 'badge-success' : 'badge-warning'}`}
              style={{ fontSize: '0.65rem' }}
            >
              v{activePlan.version} {activePlan.status.toUpperCase()}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dryrun')}
          className={`btn ${activeTab === 'dryrun' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Activity size={14} /> Dry-Run Simulator
        </button>

        <button
          onClick={() => setActiveTab('quarantine')}
          className={`btn ${activeTab === 'quarantine' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <AlertOctagon size={14} /> Quarantine Workbench
          {dryRunResult && dryRunResult.rejectedRecordsCount > 0 && (
            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
              {dryRunResult.rejectedRecordsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('execute');
            fetchTargetData();
          }}
          className={`btn ${activeTab === 'execute' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Database size={14} /> Staging Execution & Rollback
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            fetchAuditLogs();
          }}
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <History size={14} /> Audit Trail
        </button>
      </div>

      {/* Main Views */}
      {currentBundle && (
        <div>
          {activeTab === 'schema' && (
            <SchemaView
              sourceSchema={currentBundle.sourceSchema}
              targetSchema={currentBundle.targetSchema}
              sampleRecords={currentBundle.sampleRecords}
            />
          )}

          {activeTab === 'mapper' && activePlan && (
            <SchemaMapper
              sourceSchema={currentBundle.sourceSchema}
              targetSchema={currentBundle.targetSchema}
              mappings={activePlan.mappings}
              onUpdateMapping={handleUpdateMapping}
              onToggleStatus={handleToggleStatus}
              reasoningLog={reasoningLog}
              isAiLoading={isAiLoading}
              onTriggerAiPlan={() =>
                generateAiPlan(
                  currentBundle.sourceSchema,
                  currentBundle.targetSchema,
                  currentBundle.sampleRecords
                )
              }
            />
          )}

          {activeTab === 'risks' && activePlan && (
            <RiskAnalysis
              risks={activePlan.risks}
              clarifications={activePlan.clarifications}
              onSelectOption={handleSelectClarification}
            />
          )}

          {activeTab === 'plan' && activePlan && (
            <PlanReview
              plan={activePlan}
              onApprovePlan={handleApprovePlan}
              onBumpVersion={handleBumpVersion}
            />
          )}

          {activeTab === 'dryrun' && activePlan && (
            <DryRunConsole
              plan={activePlan}
              dryRunResult={dryRunResult}
              isRunningDryRun={isRunningDryRun}
              onExecuteDryRun={handleExecuteDryRun}
            />
          )}

          {activeTab === 'quarantine' && (
            <QuarantineViewer quarantined={dryRunResult?.quarantined || []} />
          )}

          {activeTab === 'execute' && activePlan && (
            <ExecutionWorkbench
              plan={activePlan}
              lastExecution={lastExecution}
              targetRecords={targetRecords}
              isExecuting={isExecuting}
              isRollingBack={isRollingBack}
              onExecuteMigration={handleExecuteMigration}
              onRollback={handleRollback}
              onRefreshTargetData={fetchTargetData}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTrailViewer logs={auditLogs} onRefreshLogs={fetchAuditLogs} />
          )}
        </div>
      )}

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
};

export default App;
