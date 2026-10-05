# Commercial Property for Claude Code

Leases, renewals, rent reviews, outgoings and maintenance in a database you own. MIT licensed code from Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free code. Install and operate it. Hosting and agent costs remain yours. | Your fields, lease rules, screens, connections and Re-Leased data mapping. [Discuss your version](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=re-leased&utm_medium=github). | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/re-leased). |

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/commercial-property-for-claude-code.git
cd commercial-property-for-claude-code
npm install
npm run demo
npm test
npm run property -- rent-roll
npm run view
npm run docs
```

Node 20 or newer. Demo records are fictional NZ and NSW commercial properties with overdue rent, approaching renewals, expired insurance and incomplete evidence. The seed is idempotent. Never seed a live business database. Start with /attention, /renewals-due and /rent-reviews.

For PostgreSQL 15 or newer, set DATABASE_URL through your environment and run npm run migrate. Without it, PGlite stores records locally. PGlite supports one process at a time. Database tables have row security enabled with no public policies. Views respect caller permissions. Shared use needs staff identity, roles, encrypted backups, monitoring and deployment validation.

## What works today

Ten record types and five joined views cover owners, properties, units, leases, charges, outgoings, rent reviews, maintenance, append-only notes and import provenance. Twenty-one read commands answer the weekly operating questions. Overlapping active leases are rejected. Currencies stay separate. Proposed rent changes never alter the rent roll automatically.

Four document families produce draft owner operating statements, rent review briefs, outgoings reconciliations and maintenance work orders in the business brand. Two HTML reports show the week and the portfolio. These files are read-only, not a property portal.

The base checks NZ building warrant evidence and NSW retail disclosure timing for records explicitly marked in scope. Contractual insurance and lease evidence are separate operating checks. Read [the rules and their sources](docs/compliance.md). The checks do not certify legal compliance.

This is a property operations base. It does not reproduce Re-Leased's trust accounting, bank feeds, payments, automatic invoice generation, document storage, multi-area lease model or mobile portals. Charges and receipts are externally reconciled snapshots. Those systems and connections need separate implementation. Owner paperwork is not a trust distribution statement.

Re-Leased quotes Core, Pro and Enterprise privately on its [NZ pricing page](https://www.re-leased.com/en-nz/pricing), checked 5 October 2026. No public price or savings figure is claimed. Re-Leased already offers custom reporting. The difference here is ownership of the records, rules and code.

## Weekly property jobs

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

## Ten questions across your records

Each question below is implemented. These are useful cross-record queries, not a claim that Re-Leased cannot build an equivalent report.

1. Which tenants owe money while their renewal deadline approaches? (`renewal-arrears`)
2. Which owners have the most overdue rent, kept separate by currency? (`owner-exposure`)
3. Where do recovered outgoings exceed the recorded lease allocation? (`over-recoveries`)
4. Which proposed rent increases have notice deadlines approaching? (`review-uplift`)
5. Which open jobs have contractor insurance that will not cover the work date? (`contractor-check`)
6. How much annual rent expires within six months for each owner? (`expiry-exposure`)
7. Which tenants have gone quiet for more than thirty days? (`quiet-tenants`)
8. Which occupied units have the highest annual rent per square metre? (`rent-density`)
9. Which active leases lack renewal dates or signed evidence? (`lease-gaps`)
10. Which building and retail lease records need evidence checked? (`compliance`)

## Your first hour: ten things to ask for

1. Put our name and logo on owner statements.
2. Add our property manager field.
3. Record our renewal reminder window.
4. Map a checked sample of our Re-Leased export.
5. Show overdue rent by owner and currency.
6. Add our contractor evidence checklist.
7. Group rent reviews by manager.
8. Record our executed lease references.
9. Add our outgoing cost categories.
10. Draft Monday's renewal and arrears review.

/customise writes and applies a migration. /new-view adds a read-only report. Read [CLI usage](docs/cli.md), [the switch guide](docs/replace-re-leased.md) and [why there is no front end](docs/why-no-front-end.md).

## Bring your tenancy schedule

```bash
npm run property -- import re-leased --file=examples/re-leased-tenancy-schedule.csv --dry-run
npm run property -- import re-leased --file=examples/re-leased-tenancy-schedule.csv
npm run property -- leases
```

Create and map properties and units before real imports. The included example works against the demo. Configurable columns use --map. Dates and currencies are checked. Imported leases remain proposed until the operator verifies dates, source status and signed evidence. Duplicate IDs fail, repeats skip and changed mapped rows stop for reconciliation. This is a tenancy schedule import, not a whole-account migration.

## Validation

npm test runs on a temporary database, clears inherited DATABASE_URL and exercises reads, writes, negative cases, lease overlap, currency checks, import rollback, disclosure date boundaries, drafts, documents and record security. TEST_DATABASE_URL can select an empty disposable PostgreSQL database. Tests use Node APIs on Windows and Linux. The included workflow covers both systems and a PostgreSQL service.

Imports, exports, generated reports and drafts stay outside Git. Keep database backups and test restoration. Nothing in this base sends messages, posts money or serves a legal notice.

Built by Enterprise DNA. Re-Leased is a third-party trademark. This independent project is not affiliated with Re-Leased.
