# Quick Entry

## ADDED Requirements

### Requirement: Transaction types
The quick-entry flow MUST support expense, income, and transfer tabs.



#### Scenario: Basic behavior
- **WHEN** the user uses this capability with valid data
- **THEN** the app completes the requested action and preserves the documented state
### Requirement: Validated save
The app MUST reject zero, negative, or more-than-two-decimal amounts and MUST preserve all input on save failure.



#### Scenario: Basic behavior
- **WHEN** the user uses this capability with valid data
- **THEN** the app completes the requested action and preserves the documented state
### Requirement: Transaction fields
The flow MUST support category, account, occurred date/time, note, and a custom numeric input path.

#### Scenario: Successful save
- **WHEN** a valid transaction is submitted once
- **THEN** one record is persisted and the source page refreshes.
