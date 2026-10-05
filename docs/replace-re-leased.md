# Move a Re-Leased tenancy schedule

Checked 5 October 2026. The vendor documents downloadable tenancy schedules and a configurable report builder on its [reporting page](https://www.re-leased.com/product/property-management-reporting). Its [October 2025 release notes](https://www.re-leased.com/blog/customer-love-sprint-october-2025) confirm tenancy ID and renewal option expiry columns. This base supports a configured tenancy schedule saved as CSV, not every possible report layout.

## Export and prepare

In Re-Leased, select the tenancy schedule from reporting. Include the unique tenancy ID, property, area or suite, tenant, commencement, expiry, annual base rent and currency. Add renewal option expiry if recorded. Download the report. If supplied as Excel, save the detail worksheet as UTF-8 CSV. Remove title and total rows so the first row contains field names and each subsequent row is one tenancy. Keep an untouched export for reconciliation.

The example in examples/re-leased-tenancy-schedule.csv is a fictional mapping fixture, not a captured vendor export. Report columns vary by configuration and region. Use examples/re-leased-mapping.json to map actual column headings to id, property, unit, tenant, start, end, rent, currency and optional renewal. No undocumented fixed vendor schema is claimed. The current [Invoice Details help article](https://help.re-leased.com/en/articles/14055141-invoice-details-report) documents Excel and PDF downloads for that report. It is not evidence that every tenancy report has a fixed CSV layout.

Create owners, properties and units first using add. Match each property's jurisdiction and currency and each unit's verified floor area. The importer refuses unknown or mismatched property/unit references. It never guesses ownership, area or legal applicability. For multi-area leases, choose a reviewed aggregate unit or extend the model before import. Duplicate tenancy IDs in one report fail, so repeated area rows cannot silently inflate annual rent.

## One import command after mapping

```bash
npm run property -- import re-leased --file=imports/tenancy-schedule.csv --map=imports/mapping.json --date-format=DMY --dry-run
npm run property -- import re-leased --file=imports/tenancy-schedule.csv --map=imports/mapping.json --date-format=DMY
```

ISO dates work without --date-format. Slashed dates require DMY or MDY. If the report lacks currency, supply --currency=NZD or AUD for a verified single-currency report. Currency must match the existing property. Annual rent must be a plain nonnegative amount with at most two decimals, with optional thousands commas. Supply the annual base amount, not a monthly amount, tax-inclusive total or a rent-free adjustment.

| Source | Destination |
|---|---|
| Tenancy ID or Lease ID | Unique code prefixed RL- and immutable import provenance |
| Property, Property Name | Existing property code or exact name |
| Area, Suite, Unit | Existing unit code or exact name |
| Tenancy, Tenant, Tenancy Name | Tenant and tenancy name |
| Lease Start, Start Date, Commencement Date | Start date |
| Lease End, Expiry Date, Lease Expiry | End date |
| Annual Rent, Annual Base Rent | Annual rent in integer cents |
| Currency | Checked against property currency |
| Renewal Option Expiry Date, Renewal By | Optional renewal deadline |

Every imported lease starts proposed. Reconcile count, annual rent by currency, dates, occupied areas and the source status before activating with an executed lease reference. Dry runs roll back the whole import. Repeating identical mapped rows skips them. Changed mapped rows stop the import for reconciliation rather than silently replacing operational records. The original row is retained as import provenance. Additional unmapped columns are retained there but do not drive calculations.

## What needs separate mapping

Invoices, receipts, trust balances, tax codes, arrears, outgoings history, rent review clauses, documents, communications, maintenance, insurance and legal disclosure evidence do not come from this tenancy schedule import. Export and map those separately with Enterprise DNA or extend the importer and tests. Files and evidence references must be preserved in the business's document storage. Keep accounting live in its existing system until a separate implementation is reconciled and signed off.

A prepared tenancy schedule can be imported in a working day. A complete accounting, document and integration migration needs its own scope. Run both systems in parallel, compare reports and resolve differences before ending any subscription.
