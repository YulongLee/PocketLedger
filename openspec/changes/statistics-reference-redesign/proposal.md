# Statistics reference redesign

Rebuild the statistics tab following the user's supplied mint-green reference: overview, expense/income/balance analysis, period selection, category details, chart switching, and a mascot insight card.

## Behavior
- Month, year, and custom inclusive date ranges, with a confirmation sheet.
- Overview income/expense totals and a green balance card route to the corresponding analysis.
- Canvas category rings, trends (bar/line), expense category trends (amount/share), and six-month balance comparison.
- Category rows open read-only transaction detail sheets.
- Amounts aggregate in integer cents; transfers do not count as income/expense. Zero comparison denominators and absent income produce explicit neutral states.
- Insights are deterministic ledger summaries, not LLM-generated advice.
- API failures show retry. An explicit, labelled example-book option enables design review without changing or persisting financial records.

## Validation
- TypeScript compile of the statistics page and helpers.
- scripts/test-statistics.sh covers ranges, amount precision, excluded transfers, invalid records, date normalization, missing dates, and negative balance.
- Verify overview, analysis tabs, time filtering, charts, and category popup in WeChat developer tools using the labelled example book when the live API cannot load.

## Not included
- New server endpoints, publishing a mini program release, or restoring the currently unreachable live ledger service.

## Verification result (2026-09-16)
- Targeted TypeScript compilation and all four statistics tests passed; whitespace check passed.
- Verified in WeChat developer tools: overview, expense and income rings, category transaction sheet, balance comparison, and month filter. Selecting August changed the example income total from 6,800.00 to 6,528.00 and redrew the ring.
- Fixed duplicate canvas identifiers across views, explicit sheet positioning for WXSS compatibility, and native tab-bar overlap while sheets are open.
- Live ledger loading failed in the simulator. Visual checks used the explicitly labelled read-only example ledger; production data connectivity has not been verified by these checks.
