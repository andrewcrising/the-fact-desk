# AI Draft Assist plan

This is a planning note only. No AI calls are implemented in the MVP.

## Purpose

AI Draft Assist should help editors prepare neutral draft briefings faster while
preserving The Fact Desk's evidence-ranked, human-reviewed workflow.

It must not turn the product into an auto-published AI news site.

## Inputs

Future AI drafting should receive only bounded editorial context:

- selected feed item
- attached source links
- source names and source types
- Evidence Assist profile
- existing story fields
- editor-provided notes

## Outputs

AI may suggest draft text for:

- neutral summary
- what happened
- why it matters
- source spread explanation
- uncertainty note
- confidence/evidence rationale

These outputs are draft suggestions, not publishable copy.

## Guardrails

AI may not:

- fabricate sources
- cite sources that are not attached
- invent facts not supported by attached sources
- present disputed information as settled
- generate sensational headlines
- publish or change story status
- overwrite human-entered fields without editor action

## Human review

Editors must review and approve:

- headline
- summary
- what happened
- why it matters
- confidence and evidence labels
- uncertainty note
- attached source list

Publication remains human-reviewed.

## How Evidence Assist should be used

Evidence Assist should run before AI drafting and be passed as context. AI should
use it to understand source posture and uncertainty, not to assert truth.

Example:

- Low evidence + single source -> cautious draft language and explicit uncertainty.
- Strong evidence + primary document + secondary source -> more direct language,
  while still linking to source support.
- Disputed confidence -> avoid settled wording and explain disagreement.

## Future implementation notes

- Keep the AI call server-side.
- Log prompt inputs/outputs for editorial audit where appropriate.
- Store AI draft suggestions separately from published story fields.
- Require explicit editor apply/save actions.
- Never allow AI output to bypass the existing publish endpoint.
