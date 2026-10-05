# /update

Read the current record and docs/cli.md. Put supplied changes in imports/changes.json. Run `npm run property -- update <type> <reference> --data=imports/changes.json`. Read back the record. Receipt amounts are cumulative snapshots, not increments. Check them against the external ledger. Changing a review to agreed does not change the lease rent. Apply a verified rent change separately when effective. No notice or payment is sent.
