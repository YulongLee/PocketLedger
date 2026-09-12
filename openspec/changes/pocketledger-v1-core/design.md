## Context

PocketLedger is a TypeScript WeChat Mini Program with WXML/WXSS pages and a local-storage prototype. The PRD requires a 16-page product direction, but V1 must first close the core loop: onboarding/login, home, quick entry, transactions, statistics, budget, assets/profile, and AI text entry. Money calculations must remain deterministic and future backend writes must use decimal values, authorization, and idempotency.

## Goals / Non-Goals

**Goals:**

- Keep page contracts independent from storage so local mock data can be replaced by FastAPI/PostgreSQL.
- Provide consistent loading, empty, error, validation, submitting, and success states.
- Ensure AI produces validated drafts and never writes directly.
- Match the supplied mint-green product visual system across pages and responsive widths.

**Non-Goals:**

- Production authentication, payment provider synchronization, OCR, voice ASR, or cloud deployment in this client-only phase.
- Investment advice or automatic financial decisions.

## Decisions

1. Use a domain record model with `amount` represented as a decimal string at service boundaries; convert only for display and controlled aggregation. This avoids binary floating-point drift and matches the PRD.
2. Add service adapters (`services/`) with local implementations first. Pages call adapters rather than `wx.setStorageSync` directly, making API replacement incremental.
3. Treat AI output as a draft array validated against an explicit schema. The confirm action revalidates amount, type, date, category, account, and duplicate key before persistence.
4. Keep the five-tab information architecture and use navigation pages for budget/assets/detail. The central quick-entry action remains available from home and the tab bar.
5. Define design tokens for color, type, spacing, radius, and safe-area padding in shared WXSS; all pages consume tokens instead of one-off values.

## Risks / Trade-offs

- [Local storage is device-scoped] → Keep adapter boundaries and show data-local messaging until backend sync exists.
- [Mini Program CSS has limited chart primitives] → Use lightweight CSS charts for V1 and preserve a chart component API for a canvas implementation later.
- [AI parsing can be ambiguous] → Show field-level confidence and require confirmation for low-confidence drafts.
- [Existing starter typings report an upstream generic constraint] → Treat it separately from product code and verify compilation in Developer Tools.

## Migration Plan

1. Add tokens, models, adapters, and page contracts.
2. Replace prototype home and quick-entry pages while retaining local records compatibility.
3. Add transaction, statistics, budget, profile, and AI pages incrementally.
4. Run Developer Tools compile and acceptance path; then swap local adapters for API clients.

## Open Questions

- Which production AppID, backend base URL, and authentication session strategy will be used?
- Which exact mascot/icon assets are approved for release?
- Should a single-user ledger support multiple ledgers in the first backend release?
