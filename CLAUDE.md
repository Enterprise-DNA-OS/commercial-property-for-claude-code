# Commercial Property for Claude Code

For an NZ or NSW commercial property manager who reviews tenancy dates, operating balances and building records. Configure the business identity and applicable policies before live use.

Every answer starts with the CLI. Run `npm run property -- help` and read docs/cli.md before writing. Names are exact and case insensitive. UUID prefixes work. An ambiguous reference lists candidates and exits 1. AGENTS.md routes Codex, OpenCode and Cursor here.

## Recurring jobs

| Recipe | Job |
|---|---|
| /owners | Read the owner contacts. |
| /properties | Review buildings, ownership, currency and recorded warrant dates. |
| /rent-roll | Read current active tenancies and annual contractual rent. |
| /leases | Read all leases, including proposed imports and ended records. |
| /arrears | Review overdue charges less recorded receipts, with ageing and currency. |
| /renewals-due | Review renewal deadlines within sixty days, including overdue deadlines. |
| /rent-reviews | Review pending fixed, CPI and market reviews and contractual notice dates. |
| /outgoings | Compare recoverable costs against recorded recoveries. |
| /maintenance | Review open work, contractor evidence and due dates. |
| /vacancies | Find units with no active lease covering today. |
| /compliance | Read docs/compliance.md first. Review missing or overdue evidence. A clear list is not legal certification. |
| /attention | Review overdue and approaching property work, then read the affected lease before drafting. |
| /expiry-exposure | Group annual rent expiring within six months by owner and currency. |
| /renewal-arrears | Find tenants with a renewal deadline and unpaid overdue charges. |
| /quiet-tenants | Find active tenants with no contact date or no recorded contact for thirty days. |
| /owner-exposure | Group unpaid overdue charges by owner and currency. |
| /contractor-check | Find open jobs whose contractor insurance is missing or expires before the work date. |
| /review-uplift | Compare proposed review amounts with current annual rent. These are proposals, never automatic rent changes. |
| /over-recoveries | Find outgoings recovered above the recorded contractual allocation. |
| /rent-density | Compare annual rent per square metre within each currency. |
| /lease-gaps | Find active leases missing renewal dates or signed evidence, and expired active leases. |
| /lease | Run `npm run property -- lease "<code, exact name or UUID prefix>"`. Read the lease, charges, outgoings, reviews and notes before drafting. Ambiguous names list candidates and exit 1. Resolve the reference with the operator. |
| /add | Read docs/cli.md and the migration. Put only supplied fields in a private imports/record.json file. Run `npm run property -- add <type> --data=imports/record.json`. Read back the result. Create owners, properties and units before leases. Never infer a lease clause, rent amount or legal applicability. |
| /update | Read the current record and docs/cli.md. Put supplied changes in imports/changes.json. Run `npm run property -- update <type> <reference> --data=imports/changes.json`. Read back the record. Receipt amounts are cumulative snapshots, not increments. Check them against the external ledger. Changing a review to agreed does not change the lease rent. Apply a verified rent change separately when effective. No notice or payment is sent. |
| /log | Read the lease. Run `npm run property -- log <lease> --author="<recorder>" --text="<observed event>" --date=YYYY-MM-DD`. The optional date records when contact actually happened. Notes are append-only. Correct an earlier note by adding another that references it. |
| /import | Read docs/replace-re-leased.md. Map properties and units first. Run `npm run property -- import re-leased --file=imports/tenancy-schedule.csv --dry-run`. Supply --map, --currency or --date-format when needed. Compare the results with the source, then repeat without --dry-run. Imported leases remain proposed until dates, status and signed evidence are verified. Preserve the source export privately. |
| /export | Create a private exports folder. Run `npm run property -- export --out=exports/new-backup.json`. Verify all ten record collections. Existing files are never overwritten. Keep an independent database backup and test restoration before migration. |
| /weekly-review | Run `npm run property -- attention`, `npm run property -- owner-exposure` and `npm run property -- compliance`. Name each decision, responsible person and deadline. Keep NZD and AUD separate. Run draft-weekly to save the supporting records. |
| /draft-weekly | Run `npm run property -- draft-weekly`. Read the generated Markdown file in drafts/. Check it against the latest records. It contains attention, owner exposure and compliance results. Nothing sends. |
| /draft-arrears | Read the lease and charges. Run `npm run property -- draft-arrears <lease>`. Inspect the draft balance enquiry in drafts/. Check payments with the external ledger before using it. It is not a legal default or termination notice. Nothing sends. |
| /documents | Set brand.json to the business name, logo and colours. Run `npm run docs`. Inspect draft owner statements, rent review briefs, outgoings reconciliations and work orders. Verify evidence and amounts before use. These are operating documents, not trust statements or served notices. |
| /new-view | Read views.json and the database views. Add a fixed SELECT query for the requested report. Run `npm run view` and `npm test`. Inspect the HTML report. Keep it read-only and keep customer records local. |
| /customise | Read CLAUDE.md and export a backup first. Write a new numbered migration for the requested field, stage or rule. Apply it with `npm run migrate`. Update the CLI field allowlist, queries, documents and recipes as needed. Run `npm test` and show the changed workflow with fictional data. Never edit an applied migration or invent business rules. |

## Rules

- Never send, serve a legal notice, take payment or release owner funds. Drafts stay local.
- Never invent rates, signed evidence, dates, jurisdiction, CPI movements or lease clauses.
- Keep currencies separate. Charges and receipts are externally reconciled snapshots, not an accounting ledger.
- Read docs/compliance.md before interpreting evidence flags. A clear check is not legal approval.
- Read existing records before writes. No deletion command exists. End leases and close completed work with evidence.
- Customer imports, exports, reports and drafts stay out of Git.
- Database owner access is for a controlled operator. Staff access requires identity, permissions, backups and deployment validation.
- Add numbered migrations for changes. Never edit an applied migration.

Schema: supabase/migrations. CLI: scripts/property.mjs. Reports: views.json. Paperwork: documents.json. Branding: brand.json. Omni by Enterprise DNA customises and operates the system.
