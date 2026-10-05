import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const FIELDS={
 owners:['code','name','email'],
 properties:['code','name','owner_id','jurisdiction','currency','address','bwof_required','bwof_due','bwof_reference'],
 units:['code','name','property_id','area_sqm'],
 leases:['code','name','unit_id','tenant','start_on','end_on','status','annual_rent_cents','renewal_by','insurance_until','insurance_reference','lease_reference','retail','entered_on','disclosure_on','disclosure_reference','tenant_disclosure_on','tenant_disclosure_reference','disclosure_extension_until','disclosure_extension_reference','last_contact_on'],
 charges:['code','name','lease_id','kind','due_on','amount_cents','received_cents','reconciled_on','receipt_reference'],
 outgoings:['code','name','lease_id','period_start','period_end','cost_cents','recovery_pct','recovered_cents','authority_reference'],
 reviews:['code','name','lease_id','due_on','notice_by','method','proposed_annual_cents','status','agreed_reference','agreed_on'],
 maintenance:['code','name','unit_id','due_on','priority','status','contractor','insurance_until','closed_reference']
};
export const TABLES=[...Object.keys(FIELDS),'notes','import_rows'];
const FK={owner_id:'owners',property_id:'properties',unit_id:'units',lease_id:'leases'};
export const READS={
 'owners':'select code,name,email from property.owners order by code',
 'properties':'select p.code,p.name,o.name owner,p.jurisdiction,p.currency,p.bwof_due from property.properties p join property.owners o on o.id=p.owner_id order by p.code',
 'rent-roll':"select code,tenant,property,unit,currency,annual_rent_cents,start_on,end_on,renewal_by from property.lease_register where status='active' and start_on<=current_date and end_on>=current_date order by property,unit",
 'leases':'select code,tenant,property,status,currency,annual_rent_cents,start_on,end_on from property.lease_register order by code',
 'arrears':'select code,lease,tenant,currency,balance_cents,days_overdue from property.balances where balance_cents>0 and due_on<current_date order by days_overdue desc,code',
 'renewals-due':"select code,tenant,property,renewal_by,end_on,currency,annual_rent_cents from property.lease_register where status='active' and renewal_by<=current_date+60 order by renewal_by,code",
 'rent-reviews':"select r.code,l.tenant,r.method,r.notice_by,r.due_on,l.currency,r.proposed_annual_cents from property.reviews r join property.lease_register l on l.id=r.lease_id where r.status='pending' and l.status='active' order by notice_by,r.code",
 'outgoings':'select code,lease,period_end,currency,recoverable_cents,recovered_cents,variance_cents from property.recovery order by code',
 'maintenance':"select m.code,m.name,u.code unit,m.priority,m.due_on,m.contractor,m.insurance_until from property.maintenance m join property.units u on u.id=m.unit_id where m.status='open' order by due_on,m.code",
 'vacancies':"select u.code,u.name,p.name property,u.area_sqm from property.units u join property.properties p on p.id=u.property_id where not exists(select 1 from property.leases l where l.unit_id=u.id and l.status='active' and l.start_on<=current_date and l.end_on>=current_date) order by u.code",
 'compliance':'select * from property.compliance order by rule,record',
 'attention':'select * from property.attention order by due_on,record,kind',
 'expiry-exposure':"select owner,currency,count(*) leases,sum(annual_rent_cents) annual_rent_cents from property.lease_register where status='active' and end_on between current_date and current_date+180 group by owner,currency order by owner,currency",
 'renewal-arrears':"select l.code,l.tenant,l.renewal_by,l.currency,sum(b.balance_cents) overdue_cents from property.lease_register l join property.balances b on b.lease_id=l.id where l.status='active' and l.renewal_by<=current_date+60 and b.due_on<current_date and b.balance_cents>0 group by l.code,l.tenant,l.renewal_by,l.currency order by l.code",
 'quiet-tenants':"select code,tenant,last_contact_on,current_date-last_contact_on quiet_days from property.leases where status='active' and (last_contact_on is null or last_contact_on<current_date-30) order by last_contact_on nulls first,code",
 'owner-exposure':"select owner,currency,sum(balance_cents) overdue_cents,count(*) unpaid_charges from property.balances where balance_cents>0 and due_on<current_date group by owner,currency order by owner,currency",
 'contractor-check':"select code,name,contractor,insurance_until,due_on from property.maintenance where status='open' and (contractor is null or insurance_until is null or insurance_until<greatest(current_date,due_on)) order by code",
 'review-uplift':"select r.code,l.tenant,r.notice_by,l.currency,r.proposed_annual_cents-l.annual_rent_cents annual_change_cents from property.reviews r join property.lease_register l on l.id=r.lease_id where r.status='pending' and l.status='active' and r.proposed_annual_cents is not null order by r.notice_by,r.code",
 'over-recoveries':'select code,lease,currency,recoverable_cents,recovered_cents,variance_cents from property.recovery where variance_cents<0 order by code',
 'rent-density':"select code,tenant,unit,area_sqm,currency,round(annual_rent_cents/area_sqm)::bigint annual_per_sqm_cents from property.lease_register where status='active' order by currency,annual_rent_cents/area_sqm desc,code",
 'lease-gaps':"select code,tenant,property,end_on,renewal_by,lease_reference from property.lease_register where status='active' and (renewal_by is null or nullif(trim(lease_reference),'') is null or end_on<current_date) order by code"
};
export function date(value){const s=String(value);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Invalid ISO date: '+s);return s;}
function need(v,name){if(v===undefined||v===null||String(v).trim()==='')throw Error('Required '+name);return v;}
export async function resolve(db,type,ref){
 if(!TABLES.includes(type))throw Error('Unknown record type');need(ref,'reference');
 const rows=await db.query(`select * from property.${type} where lower(code)=lower($1) or lower(name)=lower($1) or id::text like $2 order by code`,[ref,String(ref).toLowerCase()+'%']);
 if(!rows.length)throw Error('No '+type+' match '+ref);
 if(rows.length!==1)throw Error('Ambiguous '+type+': '+rows.map(r=>r.code+' '+r.name).join('; '));return rows[0];
}
async function payload(db,type,obj,{update=false}={}){
 if(!FIELDS[type]||!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Unsupported record type or data');
 for(const [k,v] of Object.entries(obj)){
  if(!FIELDS[type].includes(k)||update&&['code',...Object.keys(FK)].includes(k))throw Error('Unsupported field '+k);
  if(v===null)continue;
  if(k.endsWith('_on')||k.endsWith('_by')||k.endsWith('_until')||['bwof_due','period_start','period_end'].includes(k))date(v);
  else if(k.endsWith('_cents')){if(!Number.isSafeInteger(v)||v<0)throw Error(k+' must be nonnegative integer cents');}
  else if(['area_sqm','recovery_pct'].includes(k)){if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid number '+k);}
  else if(['bwof_required','retail'].includes(k)){if(typeof v!=='boolean')throw Error('Invalid boolean '+k);}
  else if(typeof v!=='string'||!v.trim())throw Error('Invalid text '+k);
  if(FK[k])obj[k]=(await resolve(db,FK[k],v)).id;
 }
 if(!Object.keys(obj).length)throw Error('Empty data');return obj;
}
async function insert(db,type,obj){const keys=Object.keys(obj);return (await db.query(`insert into property.${type}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(obj)))[0];}
async function transaction(db,fn,dry=false){await db.exec('BEGIN');try{const r=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
function parse(args){const pos=[],opts={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(Object.hasOwn(opts,k))throw Error('Repeated option '+k);opts[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {pos,opts};}
function money(value){const s=String(value).trim().replace(/,/g,'');if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Invalid annual rent '+value);const [whole,part='']=s.split('.');const cents=Number(whole)*100+Number(part.padEnd(2,'0'));if(!Number.isSafeInteger(cents))throw Error('Amount too large');return cents;}
function reportDate(v,format){if(/^\d{4}-\d{2}-\d{2}$/.test(v))return date(v);if(!format)throw Error('Ambiguous report date: specify --date-format=DMY or MDY');const m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(!m)throw Error('Invalid report date '+v);return date(`${m[3]}-${(format==='DMY'?m[2]:m[1]).padStart(2,'0')}-${(format==='DMY'?m[1]:m[2]).padStart(2,'0')}`);}
// Re-Leased reports are configurable. The mapping is explicit and source rows are retained.
export async function importReLeased(db,file,{dry=false,dateFormat,map={},currency}={}){
 if(dateFormat&&!['DMY','MDY'].includes(dateFormat))throw Error('Invalid date format');
 const aliases={id:['Tenancy ID','Lease ID'],property:['Property','Property Name'],unit:['Area','Suite','Unit'],tenant:['Tenancy','Tenant','Tenancy Name'],start:['Lease Start','Start Date','Commencement Date'],end:['Lease End','Expiry Date','Lease Expiry'],rent:['Annual Rent','Annual Base Rent'],currency:['Currency'],renewal:['Renewal Option Expiry Date','Renewal By']};
 for(const k of Object.keys(map))if(!Object.hasOwn(aliases,k)||typeof map[k]!=='string')throw Error('Unsupported mapping '+k);
 const rows=parseCsv(fs.readFileSync(file,'utf8'));if(!rows.length)throw Error('Empty report');
 return transaction(db,async()=>{
  let inserted=0,skipped=0;const seen=new Set();
  for(const row of rows){
   const get=k=>String(pick(row,...(map[k]?[map[k]]:aliases[k]))).trim();
   for(const k of ['id','property','unit','tenant','start','end','rent'])need(get(k),'report '+k);
   const id=get('id');if(seen.has(id))throw Error('Duplicate tenancy ID '+id);seen.add(id);
   const unit=await resolve(db,'units',get('unit')),p=await resolve(db,'properties',get('property'));
   if(unit.property_id!==p.id)throw Error('Unit does not belong to property for '+id);
   const cur=get('currency')||currency;need(cur,'report currency or --currency');if(cur!==p.currency)throw Error('Currency mismatch '+id);
   const obj={code:'RL-'+id,name:get('tenant')+' tenancy',unit_id:unit.id,tenant:get('tenant'),start_on:reportDate(get('start'),dateFormat),end_on:reportDate(get('end'),dateFormat),annual_rent_cents:money(get('rent')),status:'proposed',renewal_by:get('renewal')?reportDate(get('renewal'),dateFormat):null};
   const digest=createHash('sha256').update(JSON.stringify({obj,currency:cur})).digest('hex');
   const old=(await db.query('select * from property.import_rows where code=$1',[obj.code]))[0];
   if(old){if(old.digest!==digest)throw Error('Changed imported tenancy '+id+': reconcile before updating');skipped++;continue;}
   const lease=await insert(db,'leases',obj);await insert(db,'import_rows',{code:obj.code,name:'Re-Leased tenancy schedule',lease_id:lease.id,digest,source_row:JSON.stringify(row)});inserted++;
  }
  return {inserted,skipped,dry_run:dry,status:'proposed; reconcile dates, status and evidence before activation'};
 },dry);
}
export async function run(db,args){
 const {pos,opts}=parse(args);const [cmd='help',...rest]=pos;
 const allowed=['json',...(cmd==='add'||cmd==='update'?['data']:[]),...(cmd==='log'?['author','text','date']:[]),...(cmd==='import'?['file','map','currency','date-format','dry-run']:[]),...(cmd==='export'?['out']:[])];
 for(const [k,v] of Object.entries(opts)){if(!allowed.includes(k))throw Error('Unknown option --'+k);if(['json','dry-run'].includes(k)&&v!==true)throw Error('Expected boolean flag --'+k);if(!['json','dry-run'].includes(k)&&v===true)throw Error('Required value --'+k);}
 const counts={help:0,lease:1,add:1,update:2,log:1,import:1,export:0,'draft-weekly':0,'draft-arrears':1};
 if(rest.length!==(READS[cmd]?0:counts[cmd]??-1))throw Error('Unknown command or unexpected arguments: '+cmd);
 if(READS[cmd])return db.query(READS[cmd]);
 if(cmd==='help')return {reads:Object.keys(READS),writes:['add <type> --data=record.json','update <type> <reference> --data=changes.json','log <lease> --author=name --text=note [--date=YYYY-MM-DD]','import re-leased --file=report.csv [--map=mapping.json] [--currency=NZD] [--date-format=DMY] [--dry-run]','export [--out=new-backup.json]','draft-weekly','draft-arrears <lease>'],detail:'lease <code, exact name or UUID prefix>',types:Object.keys(FIELDS)};
 if(cmd==='lease'){const l=await resolve(db,'leases',rest[0]);const out={lease:(await db.query('select * from property.lease_register where id=$1',[l.id]))[0]};for(const t of ['charges','reviews','outgoings','notes'])out[t]=await db.query(`select * from property.${t} where lease_id=$1 order by code`,[l.id]);return out;}
 if(cmd==='add')return insert(db,rest[0],await payload(db,rest[0],JSON.parse(fs.readFileSync(need(opts.data,'--data'),'utf8'))));
 if(cmd==='update'){
  const type=rest[0];const obj=await payload(db,type,JSON.parse(fs.readFileSync(need(opts.data,'--data'),'utf8')),{update:true});
  return transaction(db,async()=>{const record=await resolve(db,type,rest[1]);
   if(type==='leases'&&obj.status==='active'&&!String(obj.lease_reference??record.lease_reference??'').trim())throw Error('Activation requires executed lease reference');
   const keys=Object.keys(obj);const row=(await db.query(`update property.${type} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(obj),record.id]))[0];
   const leaseId=type==='leases'?record.id:record.lease_id;
   if(leaseId)await insert(db,'notes',{code:randomUUID(),name:'Record update',lease_id:leaseId,author:'CLI operator',body:JSON.stringify({type,code:record.code,before:record,after:row})});return row;
  });
 }
 if(cmd==='log')return transaction(db,async()=>{const l=await resolve(db,'leases',rest[0]);const result=await insert(db,'notes',{code:randomUUID(),name:'Lease note',lease_id:l.id,author:need(opts.author,'--author'),body:need(opts.text,'--text')});if(opts.date)await db.query('update property.leases set last_contact_on=$1 where id=$2',[date(opts.date),l.id]);return result;});
 if(cmd==='import'){if(rest[0]!=='re-leased')throw Error('Supported import: re-leased');return importReLeased(db,need(opts.file,'--file'),{dry:opts['dry-run']===true,dateFormat:opts['date-format'],currency:opts.currency,map:opts.map?JSON.parse(fs.readFileSync(opts.map,'utf8')):{}});}
 if(cmd==='export'){const out=await transaction(db,async()=>{await db.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');const all={format:'commercial-property-v1',exported_at:new Date().toISOString()};for(const t of TABLES)all[t]=await db.query(`select * from property.${t} order by code`);return all;});if(opts.out){fs.writeFileSync(opts.out,JSON.stringify(out,null,2)+'\n',{flag:'wx'});return {file:path.resolve(opts.out),tables:TABLES.length};}return out;}
 if(cmd.startsWith('draft-')){
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});let body;
  if(cmd==='draft-weekly'){body='# Draft weekly property review\n\n';for(const key of ['attention','owner-exposure','compliance'])body+='## '+key+'\n\n'+render(await db.query(READS[key]))+'\n\n';}
  else {const l=await resolve(db,'leases',rest[0]);const rows=await db.query('select code,name,currency,balance_cents,due_on from property.balances where lease_id=$1 and due_on<current_date and balance_cents>0 order by due_on',[l.id]);body=`# Draft balance enquiry: ${l.tenant}\n\nPlease review these recorded balances against your payment records. This is not a default, termination or statutory notice.\n\n${render(rows)}\n`;}
  const file=path.join(dir,cmd+'-'+randomUUID()+'.md');fs.writeFileSync(file,body,{flag:'wx'});return {file,sent:false};
 }
}
export function render(result){if(!Array.isArray(result))return JSON.stringify(result,null,2);if(!result.length)return '(none)';return table(result,Object.keys(result[0]).map(k=>({key:k,label:k.replace(/_cents$/,'').replaceAll('_',' '),format:v=>k.endsWith('_cents')&&v!==null?(Number(v)/100).toFixed(2):v&&typeof v==='object'?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):render(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
