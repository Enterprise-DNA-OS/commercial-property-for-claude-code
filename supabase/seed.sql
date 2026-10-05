insert into property.owners(code,name,email) values ('HARBOUR','Harbour Holdings','owner@example.test'),('PACIFIC','Pacific Property','pacific@example.test') on conflict do nothing;
insert into property.properties(code,name,owner_id,jurisdiction,currency,address,bwof_required,bwof_due,bwof_reference) values
 ('QUAY','Quay Business Centre',(select id from property.owners where code='HARBOUR'),'NZ','NZD','12 Example Quay, Auckland',true,current_date-5,null),
 ('MARKET','Market Arcade',(select id from property.owners where code='PACIFIC'),'AU-NSW','AUD','18 Example Street, Sydney',false,null,null) on conflict do nothing;
insert into property.units(code,name,property_id,area_sqm) values
 ('Q1','Quay ground floor',(select id from property.properties where code='QUAY'),220),
 ('Q2','Quay upper floor',(select id from property.properties where code='QUAY'),180),
 ('Q3','Quay warehouse',(select id from property.properties where code='QUAY'),300),
 ('M1','Market shop 1',(select id from property.properties where code='MARKET'),90) on conflict do nothing;
insert into property.leases(code,name,unit_id,tenant,start_on,end_on,annual_rent_cents,renewal_by,insurance_until,insurance_reference,lease_reference,last_contact_on,retail,entered_on,disclosure_on,disclosure_reference) values
 ('LEASE-Q1','Harbour Design tenancy',(select id from property.units where code='Q1'),'Harbour Design',current_date-700,current_date+80,7200000,current_date+20,current_date-10,'POL-Q1','SIGNED-Q1',current_date-45,false,current_date-705,null,null),
 ('LEASE-Q2','Harbour Logistics tenancy',(select id from property.units where code='Q2'),'Harbour Logistics',current_date-500,current_date+500,5400000,current_date+400,current_date+200,'POL-Q2','SIGNED-Q2',current_date-3,false,current_date-507,null,null),
 ('LEASE-M1','Market Coffee tenancy',(select id from property.units where code='M1'),'Market Coffee',current_date-40,current_date+320,4800000,current_date+230,null,null,null,current_date-50,true,current_date-45,current_date-47,'DISC-M1') on conflict do nothing;
insert into property.charges(code,name,lease_id,kind,due_on,amount_cents,received_cents,reconciled_on,receipt_reference) values
 ('RENT-Q1','Monthly rent',(select id from property.leases where code='LEASE-Q1'),'rent',current_date-35,600000,200000,current_date-20,'BANK-DEMO-Q1'),
 ('RENT-Q2','Monthly rent',(select id from property.leases where code='LEASE-Q2'),'rent',current_date+5,450000,0,null,null),
 ('RENT-M1','Monthly rent',(select id from property.leases where code='LEASE-M1'),'rent',current_date-12,400000,0,null,null) on conflict do nothing;
insert into property.outgoings(code,name,lease_id,period_start,period_end,cost_cents,recovery_pct,recovered_cents,authority_reference) values
 ('OPEX-Q1','Annual rates allocation',(select id from property.leases where code='LEASE-Q1'),current_date-365,current_date-1,1200000,40,400000,'Lease clause demo 4'),
 ('OPEX-M1','Cleaning allocation',(select id from property.leases where code='LEASE-M1'),current_date-90,current_date-1,300000,50,170000,'Reviewed disclosure demo') on conflict do nothing;
insert into property.reviews(code,name,lease_id,due_on,notice_by,method,proposed_annual_cents) values
 ('REV-Q1','Market rent review',(select id from property.leases where code='LEASE-Q1'),current_date+30,current_date-5,'market',7800000),
 ('REV-Q2','CPI review',(select id from property.leases where code='LEASE-Q2'),current_date+60,current_date+20,'CPI',null) on conflict do nothing;
insert into property.maintenance(code,name,unit_id,due_on,priority,contractor,insurance_until) values
 ('JOB-Q1','Entry door closer',(select id from property.units where code='Q1'),current_date-2,'urgent','Example Building Services',current_date-1),
 ('JOB-Q3','Vacant unit inspection',(select id from property.units where code='Q3'),current_date+3,'routine','Example Building Services',current_date+150) on conflict do nothing;
insert into property.notes(code,name,lease_id,author,body) values ('NOTE-Q1','Tenant call',(select id from property.leases where code='LEASE-Q1'),'Demo manager','Tenant requested reconciliation of rates allocation.') on conflict do nothing;
