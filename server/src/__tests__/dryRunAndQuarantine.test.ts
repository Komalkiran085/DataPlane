import { describe, it, expect } from 'vitest';
import { TransformationEngine } from '../services/transformationEngine';
import { SAMPLE_DATASETS } from '../data/samples';
import { AiAgentService } from '../services/aiAgentService';

describe('Dry Run & Quarantine Engine', () => {
  const sampleBundle = SAMPLE_DATASETS[0]; // Ecommerce sample

  it('should quarantine invalid records with field-level error evidence', () => {
    const planData = AiAgentService.generateHeuristicPlan(
      sampleBundle.sourceSchema,
      sampleBundle.targetSchema,
      sampleBundle.sampleRecords
    );

    let accepted = 0;
    let quarantinedErrorsCount = 0;

    for (let i = 0; i < sampleBundle.sampleRecords.length; i++) {
      const rec = sampleBundle.sampleRecords[i];
      const outcome = TransformationEngine.transformRecord(
        rec,
        i,
        planData.mappings,
        sampleBundle.targetSchema
      );

      if (outcome.isValid) {
        accepted++;
        expect(outcome.transformedRecord).toBeDefined();
      } else {
        quarantinedErrorsCount += outcome.quarantineErrors.length;
        expect(outcome.quarantineErrors.length).toBeGreaterThan(0);
        // Verify quarantine record has field level context
        const firstErr = outcome.quarantineErrors[0];
        expect(firstErr.sourceRowIndex).toBe(i);
        expect(firstErr.errorCode).toBeDefined();
        expect(firstErr.failedField).toBeDefined();
      }
    }

    // Sample records contain intentional malformed rows (e.g. CUST-1005 with missing email and invalid status)
    expect(accepted).toBeGreaterThan(0);
    expect(quarantinedErrorsCount).toBeGreaterThan(0);
  });
});
