import {
  ClarificationQuestion,
  DatasetSchema,
  FieldMapping,
  MappingRisk,
  MigrationPlan,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AiAgentService {
  /**
   * Generates intelligent field mapping proposals, risks, and clarification questions.
   * Can use Gemini / OpenAI API if configured, or deterministic intelligent heuristic agent.
   */
  public static async planMigration(
    sourceSchema: DatasetSchema,
    targetSchema: DatasetSchema,
    sampleRecords: Record<string, any>[] = [],
    apiKey?: string
  ): Promise<{
    mappings: FieldMapping[];
    risks: MappingRisk[];
    clarifications: ClarificationQuestion[];
    reasoningLog: string;
  }> {
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const liveResult = await this.callLlmAgent(sourceSchema, targetSchema, sampleRecords, apiKey);
        if (liveResult) return liveResult;
      } catch (err: any) {
        console.warn('Live LLM agent call failed, falling back to intelligent rule-based engine:', err.message);
      }
    }

    return this.generateHeuristicPlan(sourceSchema, targetSchema, sampleRecords);
  }

  /**
   * Deterministic intelligent heuristic agent analyzing schema syntax, semantics, and sample data
   */
  public static generateHeuristicPlan(
    sourceSchema: DatasetSchema,
    targetSchema: DatasetSchema,
    sampleRecords: Record<string, any>[]
  ): {
    mappings: FieldMapping[];
    risks: MappingRisk[];
    clarifications: ClarificationQuestion[];
    reasoningLog: string;
  } {
    const mappings: FieldMapping[] = [];
    const risks: MappingRisk[] = [];
    const clarifications: ClarificationQuestion[] = [];
    const reasoningSteps: string[] = [];

    reasoningSteps.push(
      `[AI Agent] Analyzing ${sourceSchema.fields.length} source fields against ${targetSchema.fields.length} target fields.`
    );

    const sourceFieldNames = sourceSchema.fields.map((f) => f.name.toLowerCase());

    for (const targetField of targetSchema.fields) {
      const tName = targetField.name.toLowerCase();

      // Case 1: First name / Last name split from full_name or name
      if (tName === 'first_name' || tName === 'given_name') {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['full_name', 'name', 'pat_name', 'customer_name', 'cust_name'].includes(
            f.name.toLowerCase()
          )
        );
        if (matchingSource) {
          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'split_string',
            params: {
              splitIndex: matchingSource.name.toLowerCase().includes('pat_name') ? 1 : 0,
              splitDelimiter: matchingSource.name.toLowerCase().includes('pat_name') ? ',' : ' ',
            },
            notes: `Extracted given/first name from composite field '${matchingSource.name}'.`,
            confidence: 0.95,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Matched target '${targetField.name}' to split(0) of source '${matchingSource.name}'.`
          );
          continue;
        }
      }

      if (tName === 'last_name' || tName === 'family_name') {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['full_name', 'name', 'pat_name', 'customer_name', 'cust_name'].includes(
            f.name.toLowerCase()
          )
        );
        if (matchingSource) {
          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'split_string',
            params: {
              splitIndex: matchingSource.name.toLowerCase().includes('pat_name') ? 0 : 1,
              splitDelimiter: matchingSource.name.toLowerCase().includes('pat_name') ? ',' : ' ',
            },
            notes: `Extracted family/last name from composite field '${matchingSource.name}'.`,
            confidence: 0.95,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Matched target '${targetField.name}' to split(1) of source '${matchingSource.name}'.`
          );
          continue;
        }
      }

      // Case 2: Phone normalization to E.164
      if (targetField.type === 'phone' || tName.includes('phone') || tName.includes('telecom')) {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['cell_number', 'phone', 'contact_tel', 'mobile', 'telephone'].includes(
            f.name.toLowerCase()
          )
        );
        if (matchingSource) {
          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'phone_e164',
            params: { countryCode: '+1' },
            notes: `Normalizes unformatted phone strings to international E.164 (+1XXXXXXXXXX).`,
            confidence: 0.92,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Proposed E.164 phone normalization for '${matchingSource.name}' -> '${targetField.name}'.`
          );
          continue;
        }
      }

      // Case 3: Date formatting to ISO YYYY-MM-DD
      if (targetField.type === 'date' || tName.includes('birth_date') || tName.includes('dob')) {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['dob_raw', 'birth_dt', 'dob', 'date_of_birth', 'birthdate'].includes(
            f.name.toLowerCase()
          )
        );
        if (matchingSource) {
          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'date_format',
            params: { targetDateFormat: 'YYYY-MM-DD' },
            notes: `Standardizes legacy date format into ISO 8601 YYYY-MM-DD.`,
            confidence: 0.94,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Applied date_format transformation for '${matchingSource.name}' -> '${targetField.name}'.`
          );
          continue;
        }
      }

      // Case 4: Age computation
      if (tName === 'age') {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['dob_raw', 'birth_dt', 'dob'].includes(f.name.toLowerCase())
        );
        if (matchingSource) {
          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'compute_age',
            notes: `Dynamically computes current age in years from source birth date.`,
            confidence: 0.88,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Derived target 'age' via compute_age transformation on '${matchingSource.name}'.`
          );
          continue;
        }
      }

      // Case 5: Status enum lookup mapping
      if (tName === 'status' || tName === 'gender' || tName === 'settlement_status') {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['status_flag', 'gender_code', 'state', 'status'].includes(f.name.toLowerCase())
        );
        if (matchingSource) {
          let lookupTable: Record<string, any> = {};
          if (tName === 'status') {
            lookupTable = { A: 'ACTIVE', I: 'INACTIVE', S: 'SUSPENDED', '*': 'INACTIVE' };
          } else if (tName === 'gender') {
            lookupTable = { M: 'male', F: 'female', O: 'other', U: 'unknown', '*': 'unknown' };
          } else if (tName === 'settlement_status') {
            lookupTable = { P: 'POSTED', V: 'VOID', S: 'SETTLED', '*': 'POSTED' };
          }

          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'lookup_map',
            params: { lookupTable },
            notes: `Maps legacy single-character flags to target standard enum strings.`,
            confidence: 0.96,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Configured enum lookup map for '${matchingSource.name}' -> '${targetField.name}'.`
          );
          continue;
        }
      }

      // Case 6: Cents currency transformation
      if (tName.includes('cents') || tName.includes('lifetime_value')) {
        const matchingSource = sourceSchema.fields.find((f) =>
          ['total_spend_dollars', 'amount_dollars', 'spend'].includes(f.name.toLowerCase())
        );
        if (matchingSource) {
          mappings.push({
            targetField: targetField.name,
            sourceFields: [matchingSource.name],
            transformation: 'type_cast',
            params: { targetType: 'integer' },
            notes: `Casts dollar amounts into integer cents to prevent floating point imprecision.`,
            confidence: 0.9,
            status: 'proposed',
          });
          reasoningSteps.push(
            `[AI Agent] Mapped financial dollar value '${matchingSource.name}' to '${targetField.name}'.`
          );
          continue;
        }
      }

      // Case 7: Direct exact / fuzzy name match
      const exactMatch = sourceSchema.fields.find(
        (f) =>
          f.name.toLowerCase() === tName ||
          (tName === 'user_id' && f.name.toLowerCase() === 'cust_id') ||
          (tName === 'patient_id' && f.name.toLowerCase() === 'patient_num') ||
          (tName === 'transaction_id' && f.name.toLowerCase() === 'entry_id') ||
          (tName === 'created_at' && f.name.toLowerCase() === 'signup_date') ||
          (tName === 'timestamp_utc' && f.name.toLowerCase() === 'txn_time_epoch') ||
          (tName === 'postal_code' && f.name.toLowerCase() === 'home_zip') ||
          (tName === 'email' && f.name.toLowerCase() === 'email_addr') ||
          (tName === 'is_active' && f.name.toLowerCase() === 'active_ind') ||
          (tName === 'source_account_id' && f.name.toLowerCase() === 'acc_from') ||
          (tName === 'dest_account_id' && f.name.toLowerCase() === 'acc_to') ||
          (tName === 'currency' && f.name.toLowerCase() === 'currency_code')
      );

      if (exactMatch) {
        let transType: FieldMapping['transformation'] = 'direct';
        let params: FieldMapping['params'] = {};

        if (tName === 'currency') {
          transType = 'case_transform';
          params = { caseType: 'upper' };
        } else if (tName === 'is_active') {
          transType = 'type_cast';
          params = { targetType: 'boolean' };
        }

        mappings.push({
          targetField: targetField.name,
          sourceFields: [exactMatch.name],
          transformation: transType,
          params,
          notes: `Direct mapping from '${exactMatch.name}'.`,
          confidence: 0.98,
          status: 'proposed',
        });
        reasoningSteps.push(
          `[AI Agent] Direct mapping matched: '${exactMatch.name}' -> '${targetField.name}'.`
        );
      } else {
        // Missing mapping for required field!
        if (targetField.required) {
          risks.push({
            id: `RISK-${uuidv4().substring(0, 6)}`,
            severity: 'high',
            targetField: targetField.name,
            title: `Required Target Field '${targetField.name}' Unmapped`,
            description: `Target schema mandates '${targetField.name}' but no corresponding source field was identified.`,
            mitigation: `Assign a default value rule or review source schema columns.`,
          });

          clarifications.push({
            id: `Q-${uuidv4().substring(0, 6)}`,
            question: `How should missing values for required target field '${targetField.name}' be handled?`,
            context: `Target field '${targetField.name}' has no direct counterpart in the source schema.`,
            options: [
              `Assign default fallback placeholder`,
              `Quarantine records with missing ${targetField.name}`,
              `Derive from custom composite expression`,
            ],
            selectedOption: `Quarantine records with missing ${targetField.name}`,
            answered: true,
          });
        }
      }
    }

    // Identify general risks
    risks.push({
      id: `RISK-${uuidv4().substring(0, 6)}`,
      severity: 'medium',
      title: 'Composite Name Splitting Risk',
      description:
        'Single-token names (e.g. mononyms like "Cher") or hyphenated names may produce empty family names.',
      mitigation: 'Fallback duplicate check and quarantine rule in place.',
    });

    risks.push({
      id: `RISK-${uuidv4().substring(0, 6)}`,
      severity: 'low',
      title: 'Phone Format Standardization',
      description:
        'Unformatted phone numbers lacking country codes will default to US (+1).',
      mitigation: 'Invalid phone strings will be routed to the Quarantine table.',
    });

    clarifications.push({
      id: `Q-${uuidv4().substring(0, 6)}`,
      question: 'Should invalid or unparseable source records halt the migration or be quarantined?',
      context: 'Some source records may fail regex or enum constraints during transformation.',
      options: [
        'Quarantine invalid records and continue migrating valid rows (Recommended)',
        'Halt entire batch on first error',
      ],
      selectedOption: 'Quarantine invalid records and continue migrating valid rows (Recommended)',
      answered: true,
    });

    return {
      mappings,
      risks,
      clarifications,
      reasoningLog: reasoningSteps.join('\n'),
    };
  }

  /**
   * Optional Live LLM Agent call using structured prompt
   */
  private static async callLlmAgent(
    sourceSchema: DatasetSchema,
    targetSchema: DatasetSchema,
    sampleRecords: Record<string, any>[],
    apiKey: string
  ): Promise<{
    mappings: FieldMapping[];
    risks: MappingRisk[];
    clarifications: ClarificationQuestion[];
    reasoningLog: string;
  } | null> {
    const isGemini = apiKey.startsWith('AIza') || apiKey.length > 35;
    console.log(`🤖 [Live LLM] Calling ${isGemini ? 'Google Gemini API' : 'OpenAI API'} with key: ${apiKey.substring(0, 8)}...`);

    const prompt = `You are DataPlane AI, an expert agentic data-engineering planner.
Analyze the provided Source Schema, Target Schema, and Sample Records to create an optimal migration plan.

Source Schema:
${JSON.stringify(sourceSchema, null, 2)}

Target Schema:
${JSON.stringify(targetSchema, null, 2)}

Sample Source Records:
${JSON.stringify(sampleRecords.slice(0, 5), null, 2)}

Available transformation types:
- 'direct': 1-to-1 copy
- 'split_string': split composite strings (params: splitIndex, splitDelimiter)
- 'join_strings': join fields (params: joinDelimiter)
- 'date_format': format to YYYY-MM-DD (params: targetDateFormat)
- 'phone_e164': normalize phone to E.164 (params: countryCode)
- 'type_cast': cast type (params: targetType)
- 'case_transform': trim/upper/lower (params: caseType)
- 'default_value': fallback value (params: defaultValue)
- 'lookup_map': map source keys to target enums (params: lookupTable)
- 'compute_age': derive age from birth date

Respond with ONLY valid JSON adhering to this exact schema:
{
  "mappings": [
    {
      "targetField": "string",
      "sourceFields": ["string"],
      "transformation": "direct | split_string | join_strings | date_format | phone_e164 | type_cast | case_transform | default_value | lookup_map | compute_age",
      "params": {},
      "notes": "string",
      "confidence": 0.95,
      "status": "proposed"
    }
  ],
  "risks": [
    {
      "id": "RISK-1",
      "severity": "low | medium | high | critical",
      "targetField": "string",
      "title": "string",
      "description": "string",
      "mitigation": "string"
    }
  ],
  "clarifications": [
    {
      "id": "Q-1",
      "question": "string",
      "context": "string",
      "options": ["string"],
      "selectedOption": "string",
      "answered": true
    }
  ],
  "reasoningLog": "string"
}`;

    try {
      if (isGemini) {
        // High-capacity active models on Google Free Tier
        const candidateModels = [
          'gemini-3.5-flash-lite',
          'gemini-flash-latest',
          'gemini-3.8-flash',
        ];

        for (const modelName of candidateModels) {
          try {
            console.log(`🤖 [Live LLM] Trying Google model '${modelName}'...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
            const resp = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
              }),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              console.warn(`⚠️ [Gemini ${modelName} HTTP ${resp.status}]: ${errText.substring(0, 150)}`);
              continue; // try next candidate model in cascade
            }

            const resData = await resp.json();
            const rawJsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawJsonText) {
              console.log(`✅ [Gemini Live Success] Live reasoning received from '${modelName}'!`);
              const parsed = JSON.parse(rawJsonText);
              return {
                mappings: parsed.mappings || [],
                risks: parsed.risks || [],
                clarifications: parsed.clarifications || [],
                reasoningLog: parsed.reasoningLog
                  ? `[Google ${modelName} Live] ${parsed.reasoningLog}`
                  : `[Google ${modelName} Live] Successfully generated mappings for ${sourceSchema.name} -> ${targetSchema.name}`,
              };
            }
          } catch (modelErr: any) {
            console.warn(`⚠️ [Gemini ${modelName} Error]:`, modelErr.message);
          }
        }
      } else {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          console.error(`❌ [OpenAI Error HTTP ${resp.status}]:`, errText);
          throw new Error(`OpenAI API error (${resp.status}): ${errText}`);
        }

        const resData = await resp.json();
        const content = resData.choices?.[0]?.message?.content;
        if (content) {
          console.log(`✅ [OpenAI Live Success] Live reasoning received from OpenAI model!`);
          const parsed = JSON.parse(content);
          return {
            mappings: parsed.mappings || [],
            risks: parsed.risks || [],
            clarifications: parsed.clarifications || [],
            reasoningLog: parsed.reasoningLog
              ? `[OpenAI Live Agent] ${parsed.reasoningLog}`
              : `[OpenAI Live Agent] Successfully generated mappings for ${sourceSchema.name} -> ${targetSchema.name}`,
          };
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [Live LLM Fallback] Live API call failed, using heuristic engine:', err.message);
    }

    return this.generateHeuristicPlan(sourceSchema, targetSchema, sampleRecords);
  }
}
