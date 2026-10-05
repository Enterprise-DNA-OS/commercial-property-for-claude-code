create schema property;
create function property.touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table property.owners(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, email text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.owners for each row execute function property.touch();
alter table property.owners enable row level security;
create table property.properties(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, owner_id uuid not null references property.owners, jurisdiction text not null check(jurisdiction in ('NZ','AU-NSW','OTHER')), currency text not null check(currency in ('NZD','AUD')), address text, bwof_required boolean not null default false, bwof_due date, bwof_reference text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.properties for each row execute function property.touch();
alter table property.properties enable row level security;
create table property.units(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, property_id uuid not null references property.properties, area_sqm numeric(12,2) not null check(area_sqm>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.units for each row execute function property.touch();
alter table property.units enable row level security;
create table property.leases(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, unit_id uuid not null references property.units, tenant text not null,
 start_on date not null, end_on date not null, status text not null default 'active' check(status in ('active','proposed','ended')),
 annual_rent_cents bigint not null check(annual_rent_cents>=0), renewal_by date, insurance_until date, insurance_reference text,
 lease_reference text, retail boolean not null default false, entered_on date, disclosure_on date, disclosure_reference text,
 tenant_disclosure_on date, tenant_disclosure_reference text, disclosure_extension_until date, disclosure_extension_reference text,
 last_contact_on date, check(end_on>=start_on), check(renewal_by is null or renewal_by<=end_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.leases for each row execute function property.touch();
alter table property.leases enable row level security;
create table property.charges(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, lease_id uuid not null references property.leases, kind text not null check(kind in ('rent','outgoings','other')), due_on date not null, amount_cents bigint not null check(amount_cents>=0), received_cents bigint not null default 0 check(received_cents>=0 and received_cents<=amount_cents), reconciled_on date, receipt_reference text, check(received_cents=0 or (reconciled_on is not null and nullif(trim(receipt_reference),'') is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.charges for each row execute function property.touch();
alter table property.charges enable row level security;
create table property.outgoings(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, lease_id uuid not null references property.leases, period_start date not null, period_end date not null, cost_cents bigint not null check(cost_cents>=0), recovery_pct numeric(7,4) not null check(recovery_pct between 0 and 100), recovered_cents bigint not null default 0 check(recovered_cents>=0), authority_reference text not null check(length(trim(authority_reference))>0), check(period_end>=period_start), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.outgoings for each row execute function property.touch();
alter table property.outgoings enable row level security;
create table property.reviews(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, lease_id uuid not null references property.leases, due_on date not null, notice_by date not null, method text not null check(method in ('fixed','CPI','market')), proposed_annual_cents bigint check(proposed_annual_cents>=0), status text not null default 'pending' check(status in ('pending','agreed')), agreed_reference text, agreed_on date, check(notice_by<=due_on), check(status<>'agreed' or (proposed_annual_cents is not null and agreed_on is not null and nullif(trim(agreed_reference),'') is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.reviews for each row execute function property.touch();
alter table property.reviews enable row level security;
create table property.maintenance(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, unit_id uuid not null references property.units, due_on date not null, priority text not null check(priority in ('routine','urgent')), status text not null default 'open' check(status in ('open','closed')), contractor text, insurance_until date, closed_reference text, check(status<>'closed' or nullif(trim(closed_reference),'') is not null), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.maintenance for each row execute function property.touch();
alter table property.maintenance enable row level security;
create table property.notes(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, lease_id uuid not null references property.leases, author text not null, body text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.notes for each row execute function property.touch();
alter table property.notes enable row level security;
create table property.import_rows(id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, lease_id uuid not null references property.leases, digest text not null, source_row jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch before update on property.import_rows for each row execute function property.touch();
alter table property.import_rows enable row level security;

create function property.immutable() returns trigger language plpgsql as $$ begin raise exception 'append-only record'; end $$;
create trigger immutable before update or delete on property.notes for each row execute function property.immutable();
create trigger immutable before update or delete on property.import_rows for each row execute function property.immutable();
create function property.lease_overlap() returns trigger language plpgsql as $$
begin
 perform 1 from property.units where id=new.unit_id for update;
 if new.status='active' and exists(select 1 from property.leases where unit_id=new.unit_id and id<>new.id and status='active' and start_on<=new.end_on and end_on>=new.start_on) then raise exception 'Overlapping active lease'; end if;
 return new;
end $$;
create trigger lease_overlap before insert or update on property.leases for each row execute function property.lease_overlap();
create index on property.leases(unit_id); create index on property.charges(lease_id); create index on property.reviews(lease_id);
create view property.lease_register with (security_invoker=true) as
 select l.*,u.code unit,u.area_sqm,p.id property_id,p.code property,p.name property_name,p.jurisdiction,p.currency,o.code owner,o.name owner_name
 from property.leases l join property.units u on u.id=l.unit_id join property.properties p on p.id=u.property_id join property.owners o on o.id=p.owner_id;
create view property.balances with (security_invoker=true) as
 select c.*,l.code lease,l.tenant,l.property,l.owner,l.currency,c.amount_cents-c.received_cents balance_cents,
 greatest(current_date-c.due_on,0) days_overdue from property.charges c join property.lease_register l on l.id=c.lease_id;
create view property.recovery with (security_invoker=true) as
 select o.*,l.code lease,l.tenant,l.property,l.owner,l.currency,round(o.cost_cents*o.recovery_pct/100)::bigint recoverable_cents,
 round(o.cost_cents*o.recovery_pct/100)::bigint-o.recovered_cents variance_cents from property.outgoings o join property.lease_register l on l.id=o.lease_id;
create view property.compliance with (security_invoker=true) as
 select p.code record,'NZ-BWOF' rule,coalesce(p.bwof_due,current_date) due_on,'Missing or overdue building warrant evidence' issue
 from property.properties p where jurisdiction='NZ' and bwof_required and (bwof_due is null or bwof_due<current_date or nullif(trim(bwof_reference),'') is null)
 union all
 select code,'NSW-LESSOR',coalesce(entered_on,start_on)-7,'Check disclosure delivery at least seven days before entering lease'
 from property.lease_register where jurisdiction='AU-NSW' and retail and status<>'ended' and
 (entered_on is null or disclosure_on is null or disclosure_on>entered_on-7 or nullif(trim(disclosure_reference),'') is null)
 union all
 select code,'NSW-LESSEE',coalesce(disclosure_extension_until,disclosure_on+7),'Missing or late tenant disclosure response evidence'
 from property.lease_register where jurisdiction='AU-NSW' and retail and status<>'ended' and disclosure_on is not null and
 ((tenant_disclosure_on is null and coalesce(disclosure_extension_until,disclosure_on+7)<current_date) or
 tenant_disclosure_on>coalesce(disclosure_extension_until,disclosure_on+7) or
 (tenant_disclosure_on is not null and nullif(trim(tenant_disclosure_reference),'') is null) or
 (disclosure_extension_until is not null and nullif(trim(disclosure_extension_reference),'') is null))
 union all
 select code,'LEASE-EVIDENCE',start_on,'Missing executed lease reference' from property.leases where status='active' and nullif(trim(lease_reference),'') is null
 union all
 select code,'TENANT-INSURANCE',coalesce(insurance_until,current_date),'Check contractual insurance evidence'
 from property.leases where status='active' and (insurance_until is null or insurance_until<current_date or nullif(trim(insurance_reference),'') is null);
create view property.attention with (security_invoker=true) as
 select code record,'arrears' kind,due_on,tenant||': '||name detail from property.balances where balance_cents>0 and due_on<current_date
 union all select r.code,'rent review',r.notice_by,l.tenant||': '||r.method from property.reviews r join property.leases l on l.id=r.lease_id where r.status='pending' and r.notice_by<=current_date+30
 union all select code,'renewal',renewal_by,tenant from property.leases where status='active' and renewal_by<=current_date+60
 union all select code,'maintenance',due_on,name from property.maintenance where status='open' and due_on<=current_date+14
 union all select record,rule,due_on,issue from property.compliance;
