# Linked additions: picker UI candidate

Owner approved implementation on 2026-10-14, including Git and production after verification. Owner subsequently chose **manual cancellation only**. This branch is a **draft**, not a deployed or complete payment flow.

## Implemented here

- Dedicated addition view, two decision buttons and explicit parent order link. Actual customer details stay intact.
- No ordinary status, courier, shipping-label or completion components mount for an addition.
- Fresh, uncached server state before decisions; synchronous click guard; ambiguous POST is reconciled with GET, never automatically repeated.
- Dedicated queue is visible only for Woo stores publishing the `s3-addition` status. Unrelated stores and Shopify retain their behavior.
- Ordinary picking, completion and shipment validation reject additions, including completed ones. Search may read additions using a separate cache key without granting shipping permission.
- Store/user changes unmount the selected order. Malformed addition metadata fails closed.

## Proposed site contract (not deployed)

Woo order response field `s3_addition`, and `GET /wp-json/wc/v3/s3-additions/:id`:

```
v: 1
parent_id: positive integer
parent_number: string
state: awaiting_authorization | awaiting_picker | capturing | captured |
       payment_unknown | releasing | release_unknown | rejected | completed
amount_minor: positive integer
decimals: integer 0..4
currency: string
can_decide: boolean (true only when awaiting_picker)
no_separate_shipping: true
cancellation_policy: manual
```

`POST` to the same endpoint accepts only `{decision:"attach"}` or `{decision:"reject"}` and returns persisted server state. The server must authenticate the Woo user, enforce order ownership/store binding, serialize decisions, recheck original order and stock, and perform payment verification. The UI is not that security boundary.

The source order remains a separate commercial record. Neither button directly updates its status. Provider authorization expiry must not automatically cancel the request; invalid authorization must block capture.

## Verification and release blockers

The targeted addition, order refresh and shipment/printing tests passed (77 tests), including after the final same-amount response check. Vite production build passed. Existing dependency warnings remain (large bundle, lottie eval, old Browserslist data). These are HTTP/UI boundary tests with test responses, not proof of a provider transaction or a deployed server authorization boundary.

The repository-wide `tsc --noEmit` is not green: 86 errors on both the candidate and the unchanged primary checkout. Comparison by source file and TypeScript diagnostic code found no added errors; neither new addition source file had a diagnostic. This is not reported as a passing typecheck.

With specific owner permission, one production GetUrl request for 1 ILS and SaleType=2 returned HTTP 200 / Status 0 / a valid iCredit page. No card was entered, no charge or customer message was made. **This proves page creation only.**

Live Woo gateway settings have no `CreditboxToken`. The documented ReleaseJ5 API uses that credential; authorization/capture/release and financial documents are not yet proven for this account. No replacement with generic cancellation is assumed.

Do not merge or deploy this UI as a complete feature until the site flow is implemented and independently verified, including parent-side pending banner, several products in one request, expired authorization, stock, receipt generation, recovery after capture and two-worker conflicts. Backend draft is separate and incomplete; the endpoint currently does not exist in production. No production enable switch or customer behavior was changed in this task.
