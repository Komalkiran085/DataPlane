import { Router } from 'express';
import { SAMPLE_DATASETS } from '../data/samples';

const router = Router();

router.get('/samples', (_req, res) => {
  const list = SAMPLE_DATASETS.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    description: s.description,
    sourceSchemaName: s.sourceSchema.name,
    targetSchemaName: s.targetSchema.name,
    recordCount: s.sampleRecords.length,
  }));
  res.json({ success: true, data: list });
});

router.get('/samples/:id', (req, res) => {
  const sample = SAMPLE_DATASETS.find((s) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json({ success: false, error: 'Sample dataset not found' });
  }
  res.json({ success: true, data: sample });
});

export default router;
