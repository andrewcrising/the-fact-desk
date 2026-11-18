# Preference model

The Fact Desk should eventually support self-updating briefings shaped by reader
preferences. Preferences affect ranking and source mix; they must never distort,
invent, or suppress facts inside a story.

No user accounts or personalization are implemented yet. This document defines
the future model.

## Topic preferences

Future topic dimensions:

- politics
- policy
- economy
- technology
- AI
- health policy/research
- world
- local
- legal/courts
- defense/security

Preferences should adjust story ordering and mix, not rewrite story facts.

## Political/source-balance preferences

Future source-balance dimensions:

- neutral/default
- center-right
- center-left
- conservative sources included
- progressive sources included
- primary/official sources prioritized
- contrarian/under-covered sources included

These preferences should affect which perspectives and source types are included
in a briefing mix. They must not create partisan framing or hide evidence.

## Ranking preferences

Future ranking modes:

- evidence-first
- under-covered-first
- breaking/developing
- official-source-heavy
- low-outrage mode

The default should remain evidence-first and low-outrage.

## Guardrails

Preferences may:

- adjust story ordering
- diversify source mix
- prioritize categories
- increase/decrease under-covered story weighting

Preferences may not:

- fabricate facts
- alter source quotes or links
- change evidence labels without support
- hide uncertainty
- make unsupported partisan claims

## Code readiness

`src/lib/automation/ranking.ts` includes placeholder preference hooks for
evidence-first, under-covered boost, breaking/developing boost, official-source
weighting, and low-outrage mode.
