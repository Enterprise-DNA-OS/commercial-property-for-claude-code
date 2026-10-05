# Record checks, scope and sources

Checked 5 October 2026. These checks identify missing or overdue evidence for a human review. They do not inspect buildings, establish whether a statute applies, certify compliance or serve legal notices. Apply each rule only after the operator confirms the jurisdiction and lease type. OTHER is deliberately outside the jurisdiction-specific checks.

| Rule | Check implemented | Source |
|---|---|---|
| NZ-BWOF | On an NZ building marked bwof_required, flag missing warrant reference, missing due date or a date before today. | [MBIE compliance schedules](https://www.building.govt.nz/projects-and-consents/sign-off-and-maintenance/completing-your-project/compliance-schedules), [Building Act 2004, section 108](https://www.legislation.govt.nz/act/public/2004/72/en/latest/) |
| NSW-LESSOR | On an AU-NSW retail lease that is not ended, require the date the lease was entered into, a disclosure delivery date at least seven days earlier, and an evidence reference. | [NSW Small Business Commissioner, disclosure statements](https://www.smallbusiness.nsw.gov.au/help/common-questions/lease-disclosure-statements) |
| NSW-LESSEE | On the same lease, flag a missing response once the recorded response deadline passes, a late response or missing response evidence. Default deadline is seven days after delivery. A recorded extension needs its own evidence reference. | [NSW Small Business Commissioner, disclosure statements](https://www.smallbusiness.nsw.gov.au/help/common-questions/lease-disclosure-statements) |
| LEASE-EVIDENCE | Flag an active lease without an executed document reference. | Local operating policy, not a statutory deadline. |
| TENANT-INSURANCE | Flag missing or expired tenant policy evidence on active leases. | Local operating policy. Confirm the actual obligation from the executed lease. |

MBIE describes annual warrant duties for buildings with specified systems. The record stores the next verified anniversary; it does not derive it from a guessed date. The operator must separately check inspection records, required certifications, submission and display. A future due date with a reference does not prove those duties were performed.

NSW disclosure checks use entered_on, not rent commencement. The base models supplied evidence and timing only. It does not determine retail lease coverage, exemptions, statutory remedies, or the completeness and accuracy of the disclosure contents. An extension record must be checked against the actual correspondence and applicable rule before use. Other Australian states have separate rules and are not inferred from NSW.

Rent review notice dates, renewal option deadlines, recoverable outgoing percentages and insurance obligations come from the executed lease and verified evidence. There is no universal NZ commercial lease notice period in this base. Residential tenancy rules are not applied to commercial leases.

Amounts are operating snapshots. The system has no trust accounting, tax filing, payment processing or legal-notice service. Draft owner statements and rent review briefs must be checked before use.
