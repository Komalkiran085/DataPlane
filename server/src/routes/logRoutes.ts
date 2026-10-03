import { Router } from 'express';
import { mockDb } from '../services/mockDatabase';

const router = Router();

router.get('/', (_req, res) => {
  const logs = mockDb.getAuditLogs();
  res.json({
    success: true,
    data: logs,
  });
});

export default router;
