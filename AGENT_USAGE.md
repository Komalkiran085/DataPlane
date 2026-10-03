# 🤖 AGENT_USAGE.md — AI Agent Utilization & Verification Report

This document records the agentic workflows, prompts, delegated development tasks, agent corrections, and verification methodology used in the creation of **DataPlane**.

---

## 🛠️ Tools & Models Used

1. **AI Agent / LLM:** Gemini 3.7 Flash (via Google Antigravity Coding Agent)
2. **Runtime & Language:** Node.js v24.18.0, TypeScript 5.8.2, React 19, Express 4.21
3. **Validation & Testing:** Zod 3.24, Vitest 3.0.7
4. **UI Styling:** Vanilla CSS Design System with Glassmorphism tokens & Lucide React

---

## 💬 Representative Prompts

### 1. Architecture & Schema Mapping Design Prompt
> *"Design a robust full-stack architecture for an Agentic Data Migration & Reconciliation Workbench. The backend must enforce deterministic data transformations, field-level constraint validation (regex, enums, length, dates, E.164 phones), an in-memory staging store with atomic snapshot rollbacks, and idempotency token checks to prevent duplicate executions. Provide 3 diverse real-world domain scenarios (E-Commerce, Healthcare EHR, FinTech ledger) with intentionally clean and malformed records."*

### 2. Deterministic Execution & Quarantine Engine Prompt
> *"Implement a TypeScript TransformationEngine with pure deterministic functions for direct copy, composite string splitting/joining, date parsing to ISO 8601 (YYYY-MM-DD), phone number normalization to E.164, lookup table mapping, and numeric type casting. Any record that violates required constraints or fails transformations must be captured into a QuarantineStore preserving field-level error codes, diagnostic reasons, and raw source record snapshots."*

### 3. Human-in-the-Loop Approval & Rollback State Machine Prompt
> *"Create a RESTful API state machine where migration plans are versioned (v1, v2) and cannot execute data writes without explicit operator sign-off. Before inserting records into the mock target database, capture an immutable snapshot ID to permit 1-click rollback. Guard executions with an idempotency token to suppress accidental duplicate retries."*

---

## 🎯 Delegated Work

* **Backend Services:** Automated generation of `TransformationEngine`, `MockDatabaseStore`, `AiAgentService`, and sample domain datasets.
* **Frontend Components:** Construction of the interactive visual schema mapper, risk analysis and operator decision cards, deterministic dry-run KPI console, quarantine viewer with CSV export, and execution workbench.
* **Automated Unit Tests:** Development of 9 unit tests covering deterministic transformations, quarantine isolation, idempotency duplicate prevention, and atomic rollback.

---

## ⚠️ Important Agent Mistakes Caught & Rejected Suggestions

1. **Strict Type-Only Imports in TypeScript (`verbatimModuleSyntax`):**
   * *Issue:* The agent initially generated regular imports for TypeScript interfaces (`import { MigrationPlan } from './types'`), which failed the TypeScript build when `verbatimModuleSyntax` was active in the Vite template.
   * *Correction:* Refactored all type imports to use `import type { ... }` across all React component files.

2. **PowerShell Multi-Command Syntax:**
   * *Issue:* The agent initially attempted to chain bash-style `&` commands (`npm install --prefix server & npm install --prefix client`), which is rejected by Windows PowerShell.
   * *Correction:* Switched to standard PowerShell command separators (`;`) and configured `concurrently` in `package.json` for cross-platform execution.

3. **SVG DOM Attribute Type Safety:**
   * *Issue:* The agent placed a `title` attribute directly on a Lucide React SVG icon component (`<Key size={13} title="Primary Key" />`), causing a JSX intrinsic attribute type mismatch.
   * *Correction:* Wrapped the icon in a semantic `<span>` with the `title` tooltip attribute.

4. **Ensuring 100% Deterministic Fallback:**
   * *Issue:* Relying exclusively on external cloud LLM API calls introduces network latency and token quota failure risks during reviewer assessment.
   * *Correction:* Implemented an intelligent heuristic semantic agent fallback that executes locally with zero configuration or API keys, while still supporting live LLM API keys via the UI settings modal.

---

## 🔍 Output Verification & Quality Assurance

* **Automated Test Suite:** Executed `npm test --prefix server` ensuring all 9 unit tests pass.
* **Full Production Build:** Executed `npm run build` to verify both client and server compile cleanly with zero TypeScript errors.
* **End-to-End Workflow Verification:**
  - Tested scenario switching across E-Commerce, Healthcare EHR, and FinTech.
  - Verified that malformed records (e.g. bad phone numbers and missing emails) are routed to the Quarantine table.
  - Verified that duplicate execution attempts with identical idempotency tokens are suppressed.
  - Verified that 1-click rollback restores the target table to empty/pre-migration state.
