import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const client = createClient(url, serviceKey, { auth: { persistSession: false } });
const origins = new Set(['https://plataformaeleitoral.ia.br','http://127.0.0.1:4173','http://localhost:4173']);
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && origins.has(origin) ? origin : 'https://plataformaeleitoral.ia.br',
  'Access-Control-Allow-Headers': 'apikey,content-type,x-device-id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Vary': 'Origin'
});
const json = (status:number, body:Record<string,unknown>, origin:string|null) =>
  new Response(JSON.stringify(body), { status, headers:{...cors(origin),'Content-Type':'application/json','Cache-Control':'no-store'}});
const sha256 = async (value:string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
const equal = (a:string,b:string) => {
  if(a.length!==b.length) return false;
  let diff=0; for(let i=0;i<a.length;i++) diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
};
const MASTER_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

Deno.serve(async req => {
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=='POST'||(origin&&!origins.has(origin))) return json(403,{error:'forbidden'},origin);
  const deviceId=req.headers.get('x-device-id')||'';
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||req.headers.get('cf-connecting-ip')||'unknown';
  const ipHash=await sha256(`ip:${ip}`);
  const deviceHash=await sha256(`device:${deviceId}`);
  const since=new Date(Date.now()-15*60*1000).toISOString();
  const [ipAttempts,deviceAttempts]=await Promise.all([
    client.from('tentativas_tester').select('*',{count:'exact',head:true})
      .eq('ip_hash',ipHash).eq('sucesso',false).gte('criado_em',since),
    client.from('tentativas_tester').select('*',{count:'exact',head:true})
      .eq('device_hash',deviceHash).eq('sucesso',false).gte('criado_em',since)
  ]);
  if(ipAttempts.error||deviceAttempts.error) return json(503,{error:'rate_limit_unavailable'},origin);
  if((ipAttempts.count||0)>=5||(deviceAttempts.count||0)>=5)
    return json(429,{error:'too_many_attempts'},origin);
  const body=await req.json().catch(()=>({}));
  const password=String(body.password||'');
  const {data:masterConfig,error:masterError}=await client.from('configuracao_seguranca')
    .select('valor_hash').eq('chave','tester_master_password_hash').maybeSingle();
  const expectedHash=masterConfig?.valor_hash||Deno.env.get('TESTER_MASTER_PASSWORD_HASH')||'';
  if(masterError||!expectedHash) return json(503,{error:'master_unavailable'},origin);
  const valid=deviceId.length>=16 && MASTER_PATTERN.test(password)
    && equal(await sha256(password),expectedHash);
  const audit=await client.from('tentativas_tester').insert({
    fingerprint_hash:await sha256(`${ip}:${deviceId}`),ip_hash:ipHash,device_hash:deviceHash,sucesso:valid
  });
  if(audit.error) return json(503,{error:'audit_unavailable'},origin);
  if(!valid) return json(401,{error:'invalid_credentials'},origin);
  const {data,error}=await client.rpc('emitir_sessao_tester',{p_device_id:deviceId});
  if(error) return json(503,{error:'session_unavailable'},origin);
  return json(200,data,origin);
});
