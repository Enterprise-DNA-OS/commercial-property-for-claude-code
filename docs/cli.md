# Property CLI

Run `npm run property -- help`. Every command accepts `--json`. Flags use `--name=value`. Unknown flags, repeated flags, missing values and extra arguments fail. Codes and exact names match case insensitively. Partial UUIDs work. Ambiguous matches list the candidates and exit 1.

## Writes

`add <type> --data=imports/record.json` creates one record. Types are owners, properties, units, leases, charges, outgoings, reviews and maintenance. The accepted fields are the FIELDS export in scripts/property.mjs and the database migration. Foreign keys accept the related code, exact name or UUID prefix. Records use UUID ids, unique codes and created/updated timestamps.

`update <type> <reference> --data=imports/changes.json` changes only supplied fields. Codes and record links cannot be reassigned. A lease or a linked charge, review or outgoing update creates an append-only before/after note. Building, owner, unit and maintenance edits update timestamps but do not have a separate immutable change history. An operator name is recorded on manually logged notes; shared identity is a deployment concern.

Dates must be real YYYY-MM-DD calendar dates. Money is nonnegative integer cents. A charge cannot receive more than its amount, and receipts need a reconciliation date and evidence reference. Received amounts are cumulative: repeating the same total cannot double count it. Credits need a separately designed and tested workflow. Area is positive. Recovery percentages run from zero to one hundred. A reviewed allocation can show over-recovery for correction. A rent review cannot be agreed without its proposed amount, agreement date and reference.

Active leases cannot overlap on the same unit. Ended or proposed leases do not occupy a unit. Imports are proposed by default, and activation through update needs an executed lease reference. A newly added active lease without evidence is surfaced by compliance. A future active lease occupies its date range but does not enter today's rent roll until its start date. An expired active lease appears in lease-gaps.

`log <lease> --author="Manager" --text="Tenant called" --date=2026-10-05` appends a note. The optional date sets last_contact_on. Supply only an actual contact date.

## Reconcile a receipt

Save this to a private changes file, then run `npm run property -- update charges RENT-Q1 --data=imports/changes.json`:

```json
{"received_cents":200000,"reconciled_on":"2026-10-05","receipt_reference":"External bank reconciliation reference"}
```

This records a balance already checked elsewhere. It neither collects money nor posts to a trust ledger.

## Rent reviews and maintenance

For a CPI review, supply the clause-specific calculation and index evidence. For a market review, supply the valuation. Store the proposed annual rent, then record status agreed with agreed_on and agreed_reference when agreed. Annual lease rent changes separately on the effective date after verification. No automatic statutory notice or inflation feed is present.

A work order can be closed only with closed_reference. The contractor check compares recorded insurance expiry with both today and the planned work date. It does not contact the contractor or verify a policy with an insurer.

## Backup and drafts

`export --out=exports/new-backup.json` takes a consistent snapshot of all ten collections and refuses to overwrite a file. JSON exports preserve source import rows and notes. Restore using a reviewed mapping into an empty migrated database in foreign-key order, then compare counts and financial totals. This base does not provide a one-command restore. Keep database backups too.

`draft-weekly` saves the current attention, owner-exposure and compliance results. `draft-arrears <lease>` saves a balance enquiry. Neither sends. `npm run docs` creates four families of draft HTML paperwork. `npm run view` creates two read-only HTML reports.
