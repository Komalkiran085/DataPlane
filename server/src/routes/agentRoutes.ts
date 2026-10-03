import { Router } from 'express';
import { AiAgentService } from '../services/aiAgentService';
import { mockDb } from '../services/mockDatabase';

const router = Router();

router.post('/plan', async (req, res) => {
  try {
    const { sourceSchema, targetSchema, sampleRecords, apiKey } = req.body;
    const effectiveKey =
      apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!sourceSchema || !targetSchema) {
      return res.status(400).json({
        success: false,
        error: 'Both sourceSchema and targetSchema are required.',
      });
    }

    console.log(
      `[AI Agent Plan Request] Received request with API Key present: ${Boolean(effectiveKey)}`
    );

    const planData = await AiAgentService.planMigration(
      sourceSchema,
      targetSchema,
      sampleRecords || [],
      effectiveKey
    );

    mockDb.addAuditLog('PLAN_CREATED', 'AI Agent', {
      sourceSchema: sourceSchema.name,
      targetSchema: targetSchema.name,
      proposedMappingsCount: planData.mappings.length,
      identifiedRisksCount: planData.risks.length,
    });

    res.json({
      success: true,
      data: planData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Agent Planning Error',
    });
  }
});

export default router;
