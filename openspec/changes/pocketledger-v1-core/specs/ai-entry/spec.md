# AI Entry

## ADDED Requirements

### Requirement: Structured drafts
AI text input MUST return one or more structured drafts containing type, positive decimal amount, category, title/note, occurred date, account hint, and confidence.



#### Scenario: Basic behavior
- **WHEN** the user uses this capability with valid data
- **THEN** the app completes the requested action and preserves the documented state
### Requirement: Confirmation gate
The app MUST validate every draft and require user confirmation before persistence; AI MUST NOT write records directly.

#### Scenario: Multiple bills
- **WHEN** the user enters multiple amounts in one sentence
- **THEN** the app shows independently editable candidates and confirms them as a batch.

### Requirement: Fallback
Parse failure or service unavailability MUST preserve the input and offer manual entry.


#### Scenario: Basic behavior
- **WHEN** the user uses this capability with valid data
- **THEN** the app completes the requested action and preserves the documented state
