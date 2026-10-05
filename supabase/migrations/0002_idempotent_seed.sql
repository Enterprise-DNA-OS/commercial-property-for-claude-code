create or replace function property.lease_overlap() returns trigger language plpgsql as $$
begin
 perform 1 from property.units where id=new.unit_id for update;
 if new.status='active' and exists(select 1 from property.leases where unit_id=new.unit_id and id<>new.id and code<>new.code and status='active' and start_on<=new.end_on and end_on>=new.start_on) then raise exception 'Overlapping active lease'; end if;
 return new;
end $$;
