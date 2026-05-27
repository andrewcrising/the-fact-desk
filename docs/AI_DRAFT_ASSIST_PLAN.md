# AI Draft Assist plan

AI Draft Assist is implemented as an admin-only, human-reviewed drafting aid.
It is disabled unless explicitly configured.

## Purpose

AI Draft Assist should help editors prepare neutral draft briefings faster while
preserving The Fact Desk's evidence-ranked, human-reviewed workflow.

It must not turn the product into an auto-published AI news site.

## Configuration

```bash
AI_DRAFT_ASSIST_ENABLED=true
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini # optional
```

If these are missing, the admin UI reports: "AI Draft Assist is not configured."

## Inputs

AI drafting receives only bounded editorial context:

- selected feed item
- attached source links
- source names and source types
- Evidence Assist profile
- existing story fields
- editor-provided notes

## Outputs

AI may suggest structured JSON draft text for:

- neutral summary
- what happened
- why it matters
- source spread explanation
- uncertainty note
- confidence/evidence rationale

These outputs are draft suggestions, not publishable copy. They are shown in
editable preview fields in the admin story editor.

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

The editor must explicitly:

1. generate suggestions,
2. review/edit suggestions,
3. click Apply for desired fields,
4. click Save draft,
5. click Publish separately.

AI suggestions never auto-save and never auto-publish.

## How Evidence Assist should be used

Evidence Assist should run before AI drafting and be passed as context. AI should
use it to understand source posture and uncertainty, not to assert truth.

Example:

- Low evidence + single source -> cautious draft language and explicit uncertainty.
- Strong evidence + primary document + secondary source -> more direct language,
  while still linking to source support.
- Disputed confidence -> avoid settled wording and explain disagreement.

## Current implementation notes

- AI call is server-side only.
- Output is validated as JSON before returning to the UI.
- Public pages never show raw AI output, claims to verify, metadata limitations,
  or internal warnings unless an editor explicitly saves text into approved story
  fields.
- If source content is unavailable, the prompt instructs the model to disclose
  metadata limitations and draft cautiously.

## Future implementation notes

- Log prompt inputs/outputs for editorial audit where appropriate.
- Store AI draft suggestions separately from published story fields.
- Require explicit editor apply/save actions.
- Never allow AI output to bypass the existing publish endpoint.
- Add source article fetching/extraction.
- Add claim extraction and source-grounded citation checking.
- Add clustering across related feed items before drafting.
