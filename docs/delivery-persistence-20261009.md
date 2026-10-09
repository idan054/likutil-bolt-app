# Delivery decision persistence — 2026-10-09

## Scope and cause

Version 1.2.10 repairs decision persistence without changing delivery eligibility,
site routing precedence, manual override behavior, or shipment creation.
The deployed 1.2.9 producer emitted `checks[].detail: undefined`; Firestore rejected
the entire write. Its persistence service filtered optional top-level fields only.

## Repair

- Decision producers omit absent optional explanations.
- The existing shared save service validates required decision fields and encodes
  checks explicitly. Missing optional explanations are omitted; false and empty
  string values survive. Invalid values fail before a database write.
- The saved and returned checks match, without mutating the caller's data.
- The existing explicit deletion of an obsolete Woo sync timestamp is preserved.
- No global Firestore setting, schema migration, or business-rule change.

## Validation before publication

- 133 Node tests passed, including 11 new persistence regression tests.
- Production Vite build passed (existing bundle-size, Browserslist and dependency
  eval warnings remain).
- New tests exercise the real Firebase SDK serializer and local cache with network
  disabled. They cover automatic regular/fast/review/blocked decisions, manual and
  site decisions, store isolation, absent optional values, invalid data, timestamp
  deletion, rejected writes and waiting for asynchronous completion.
- Offline tests replace server acknowledgement and do not prove server persistence.

## Release

Baseline: 2320e4ef585575668d4ee9ce549d578aa5da78a4, confirmed as published production.
Production target: existing Netlify site a2dcfff4-8c46-4d25-a395-246c27964806.
Previous deploy: 6ac841d0e5e7020008147ad0 (retained by Netlify).
Publication and live reload verification pending at the time of this commit.
Recovery: revert this scoped code change in Git and publish the resulting build.
