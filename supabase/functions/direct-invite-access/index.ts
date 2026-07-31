import { createClient } from 'npm:@supabase/supabase-js@2';

const url=Deno.env.get('SUPABASE_URL')!;
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const client=createClient(url,serviceKey,{auth:{persistSession:false}});
const origins=new Set(['https://plataformaeleitoral.ia.br','http://127.0.0.1:4173','http://localhost:4173']);
const cors=(origin:string|null)=>({
  'Access-Control-Allow-Origin':origin&&origins.has(origin)?origin:'https://plataformaeleitoral.ia.br',
  'Access-Control-Allow-Headers':'apikey,authorization,content-type,x-device-id',
  'Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'
});
const json=(status:number,body:Record<string,unknown>,origin:string|null)=>new Response(JSON.stringify(body),{
  status,headers:{...cors(origin),'Content-Type':'application/json','Cache-Control':'no-store'}
});
const sha256=async(value:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))]
  .map(x=>x.toString(16).padStart(2,'0')).join('');

Deno.serve(async req=>{
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=='POST'||(origin&&!origins.has(origin))) return json(403,{error:'forbidden'},origin);
  const deviceId=req.headers.get('x-device-id')||'';
  if(deviceId.length<16) return json(400,{error:'invalid_device'},origin);
  const body=await req.json().catch(()=>({}));
  const action=String(body.action||'activate');

  if(action==='validate'||action==='logout') {
    const token=String((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''));
    if(!/^[a-f0-9]{64}$/i.test(token)) return json(401,{error:'invalid_session'},origin);
    const rpc=action==='validate'?'validar_sessao_convite_direto':'revogar_sessao_convite_direto';
    const {data,error}=await client.rpc(rpc,{p_token:token,p_device_id:deviceId});
    if(error) return json(503,{error:'session_unavailable'},origin);
    return json(200,action==='validate'?data:{success:data===true},origin);
  }

  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||req.headers.get('cf-connecting-ip')||'unknown';
  const ipHash=await sha256(`direct-invite:ip:${ip}`);
  const deviceHash=await sha256(`direct-invite:device:${deviceId}`);
  const since=new Date(Date.now()-15*60*1000).toISOString();
  const [ipAttempts,deviceAttempts]=await Promise.all([
    client.from('tentativas_convite_direto').select('*',{count:'exact',head:true}).eq('ip_hash',ipHash).eq('sucesso',false).gte('criado_em',since),
    client.from('tentativas_convite_direto').select('*',{count:'exact',head:true}).eq('device_hash',deviceHash).eq('sucesso',false).gte('criado_em',since)
  ]);
  if(ipAttempts.error||deviceAttempts.error) return json(503,{error:'rate_limit_unavailable'},origin);
  if((ipAttempts.count||0)>=5||(deviceAttempts.count||0)>=5) return json(429,{error:'too_many_attempts'},origin);

  const code=String(body.code||'').trim().toUpperCase();
  const {data,error}=await client.rpc('emitir_sessao_convite_direto',{p_codigo:code,p_device_id:deviceId});
  if(error) return json(503,{error:'activation_unavailable'},origin);
  const success=data?.sucesso===true;
  const audit=await client.from('tentativas_convite_direto').insert({ip_hash:ipHash,device_hash:deviceHash,sucesso:success});
  if(audit.error) return json(503,{error:'audit_unavailable'},origin);
  if(!success) return json(401,{error:data?.motivo||'invalid_code'},origin);
  return json(200,data,origin);
});
