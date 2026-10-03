import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MigrationPlan } from '../types';
import { mockDb } from '../services/mockDatabase';

const router = Router();
const plansStore = new Map<string, MigrationPlan>();

// Helper to seed an initial plan if requested
router.get('/', (_req, res) => {
  const plans = Array.from(plansStore.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json({ success: true, data: plans });
});

router.get('/:id', (req, res) => {
  const plan = plansStore.get(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Migration plan not found' });
  }
  res.json({ success: true, data: plan });
});

router.post('/', (req, res) => {
  const { name, sourceSchema, targetSchema, mappings, risks, clarifications } = req.body;

  if (!sourceSchema || !targetSchema) {
    return res.status(400).json({ success: false, error: 'Schemas required' });
  }

  const now = new Date().toISOString();
  const plan: MigrationPlan = {
    id: `PLAN-${uuidv4().substring(0, 8).toUpperCase()}`,
    version: 1,
    name: name || `Migration: ${sourceSchema.name} -> ${targetSchema.name}`,
    sourceSchema,
    targetSchema,
    mappings: mappings || [],
    risks: risks || [],
    clarifications: clarifications || [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  plansStore.set(plan.id, plan);
  mockDb.addAuditLog('PLAN_CREATED', 'Operator', {
    planId: plan.id,
    version: plan.version,
    name: plan.name,
  });

  res.status(201).json({ success: true, data: plan });
});

router.put('/:id', (req, res) => {
  const existing = plansStore.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  const { mappings, risks, clarifications, bumpVersion } = req.body;
  const now = new Date().toISOString();

  if (bumpVersion) {
    existing.version += 1;
    existing.status = 'draft'; // Revert to draft if version bumped
    mockDb.addAuditLog('PLAN_VERSIONED', 'Operator', {
      planId: existing.id,
      newVersion: existing.version,
    });
  }

  if (mappings) existing.mappings = mappings;
  if (risks) existing.risks = risks;
  if (clarifications) existing.clarifications = clarifications;
  existing.updatedAt = now;

  plansStore.set(existing.id, existing);
  mockDb.addAuditLog('PLAN_MODIFIED', 'Operator', {
    planId: existing.id,
    version: existing.version,
  });

  res.json({ success: true, data: existing });
});

router.post('/:id/approve', (req, res) => {
  const existing = plansStore.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  const { approvedBy } = req.body;
  existing.status = 'approved';
  existing.approvedAt = new Date().toISOString();
  existing.approvedBy = approvedBy || 'Data Lead / Reviewer';
  existing.updatedAt = existing.approvedAt;

  // Mark all active mappings as approved
  existing.mappings = existing.mappings.map((m) =>
    m.status === 'proposed' ? { ...m, status: 'approved' } : m
  );

  plansStore.set(existing.id, existing);
  mockDb.addAuditLog('PLAN_APPROVED', existing.approvedBy || 'Operator', {
    planId: existing.id,
    version: existing.version,
    approvedAt: existing.approvedAt,
  });

  res.json({ success: true, data: existing });
});

export default router;
