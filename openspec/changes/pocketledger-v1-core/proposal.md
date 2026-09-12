## Why

PocketLedger currently has a visual prototype and local-only flows, but the PRD defines a complete, consistent V1 bookkeeping loop. This change turns the prototype into a reliable V1 product where users can record manually or with AI, understand spending, control a monthly budget, and manage their data without losing input or corrupting money calculations.

## What Changes

- Establish the PRD visual system and shared mobile states across all pages.
- Implement home summary, quick entry, bill list/detail/edit/delete, statistics, monthly budget, and profile/settings flows.
- Add AI text parsing with multi-transaction drafts, confidence display, deterministic validation, and explicit confirmation before persistence.
- Add local mock/service boundaries so the client can later switch to FastAPI and PostgreSQL without changing page contracts.
- Use decimal-safe amount handling, idempotent saves, recoverable errors, loading/empty states, and cache-aware rendering.

## Capabilities

### New Capabilities

- `home`: Home summary, shortcuts, trend, recent bills, search, and notification entry.
- `quick-entry`: Expense, income, transfer, categories, account, date/time, note, validation, and save flow.
- `ai-entry`: Natural-language parsing, multi-bill candidates, confidence, confirmation, edit, and fallback.
- `transactions`: Searchable and filterable bill list plus detail, edit, and delete behavior.
- `statistics`: Period switching, income/expense analysis, category chart, trend, ranking, and insights.
- `budget`: Monthly and category budgets, progress, thresholds, and empty/over-budget states.
- `profile`: Login/onboarding, ledgers, categories, settings, data export/delete, and privacy controls.

### Modified Capabilities

- None; the existing prototype has no accepted OpenSpec requirements.

## Impact

- Affected client files under `miniprogram/`, shared styles, assets, and local storage/service adapters.
- Adds OpenSpec requirements and task tracking under `openspec/changes/pocketledger-v1-core/`.
- Future API integration points map to the PRD endpoints for auth, transactions, AI, statistics, budgets, accounts, categories, ledgers, data, and settings.
