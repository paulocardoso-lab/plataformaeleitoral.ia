import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const client = createClient(url, serviceKey, { auth: { persistSession: false } });
const origins = new Set(['https://plataformaeleitoral.ia.br','http://127.0.0.1:4173','http://localhost:4173']);
const CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const cors = (origin:string|null) => ({
  'Access-Control-Allow-Origin': origin && origins.has(origin) ? origin : 'https://plataformaeleitoral.ia.br',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-device-id',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Vary': 'Origin'
});
const json = (status:number, body:unknown, origin:string|null) =>
  new Response(JSON.stringify(body), {status,headers:{...cors(origin),'Content-Type':'application/json','Cache-Control':'no-store'}});
const sha256 = async (value:string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
const randomCode = () => {
  const bytes=crypto.getRandomValues(new Uint8Array(12));
  const raw=[...bytes].map(value=>alphabet[value%alphabet.length]).join('');
  return raw.match(/.{4}/g)!.join('-');
};

async function authorize(req:Request) {
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token) return null;
  const {data,error}=await client.auth.getUser(token);
  const email=data.user?.email?.toLowerCase();
  if(!error&&email) {
    const {data:admin}=await client.from('administradores').select('email')
      .eq('email',email).eq('ativo',true).maybeSingle();
    if(admin) return {email,userId:data.user!.id,modo:'conta'};
  }
  const deviceId=req.headers.get('x-device-id')||'';
  if(!/^[a-f0-9]{64}$/i.test(token)||deviceId.length<16) return null;
  const {data:validation,error:validationError}=await client.rpc('validar_sessao',{
    p_token:token,p_device_id:deviceId
  });
  if(validationError||validation?.valida!==true||validation?.tipo!=='tester') return null;
  return {email:'Modo admin',userId:null,modo:'master'};
}
async function audit(email:string,acao:string,tipo:string,id?:string,detalhes:Record<string,unknown>={}) {
  await client.from('auditoria_administrativa').insert({
    administrador_email:email,acao,alvo_tipo:tipo,alvo_id:id||null,detalhes
  });
}

Deno.serve(async req => {
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=='POST'||(origin&&!origins.has(origin))) return json(403,{error:'forbidden'},origin);
  const admin=await authorize(req);
  if(!admin) return json(403,{error:'admin_required'},origin);
  const body=await req.json().catch(()=>({}));
  const action=String(body.action||'');

  if(action==='summary') {
    const [{data:codes},{data:licenses},{data:sessions},{data:logs},{data:users}] = await Promise.all([
      client.from('codigos_acesso').select('id,codigo,status,origem,criado_em,usado_em').neq('origem','tester').order('criado_em',{ascending:false}).limit(100),
      client.from('licencas').select('id,user_id,status,criada_em,ultimo_acesso_em,revogada_em,codigos_acesso(codigo)').order('criada_em',{ascending:false}).limit(100),
      client.from('sessoes_acesso').select('id,device_id,ultimo_acesso_em,expira_em,revogado_em').eq('tipo','tester').order('ultimo_acesso_em',{ascending:false}).limit(100),
      client.from('auditoria_administrativa').select('id,administrador_email,acao,alvo_tipo,alvo_id,detalhes,criado_em').order('criado_em',{ascending:false}).limit(50),
      client.auth.admin.listUsers({page:1,perPage:1000})
    ]);
    const emails=new Map((users?.users||[]).map(user=>[user.id,user.email]));
    return json(200,{admin:admin.email,codes:codes||[],licenses:(licenses||[]).map(item=>({...item,email:emails.get(item.user_id)||null})),sessions:sessions||[],logs:logs||[]},origin);
  }

  if(action==='create_codes') {
    const quantity=Math.max(1,Math.min(50,Number(body.quantity)||1));
    const rows=Array.from({length:quantity},()=>({codigo:randomCode(),origem:'manual',status:'disponivel'}));
    const {data,error}=await client.from('codigos_acesso').insert(rows).select('id,codigo,status,origem,criado_em');
    if(error) return json(503,{error:'create_failed'},origin);
    await audit(admin.email,'criar_codigos','codigo',undefined,{quantidade:quantity});
    return json(200,{codes:data},origin);
  }

  if(action==='revoke_license') {
    const id=String(body.id||'');
    const {error}=await client.from('licencas').update({status:'revogada',revogada_em:new Date().toISOString()}).eq('id',id);
    if(error) return json(503,{error:'revoke_failed'},origin);
    await audit(admin.email,'revogar_licenca','licenca',id);
    return json(200,{success:true},origin);
  }

  if(action==='revoke_tester_session') {
    const id=String(body.id||'');
    const {error}=await client.from('sessoes_acesso').update({revogado_em:new Date().toISOString()}).eq('id',id).eq('tipo','tester');
    if(error) return json(503,{error:'revoke_failed'},origin);
    await audit(admin.email,'revogar_sessao','sessao_tester',id);
    return json(200,{success:true},origin);
  }

  if(action==='rotate_master') {
    const password=String(body.password||'').toUpperCase();
    if(!CODE_PATTERN.test(password)) return json(400,{error:'invalid_password_format'},origin);
    const hash=await sha256(password);
    const {error}=await client.from('configuracao_seguranca').upsert({
      chave:'tester_master_password_hash',valor_hash:hash,atualizado_em:new Date().toISOString(),atualizado_por:admin.email
    });
    if(error) return json(503,{error:'rotation_failed'},origin);
    if(body.revoke_existing===true) {
      await client.from('sessoes_acesso').update({revogado_em:new Date().toISOString()})
        .eq('tipo','tester').is('revogado_em',null);
    }
    await audit(admin.email,'rotacionar_master','configuracao',undefined,{sessoes_revogadas:body.revoke_existing===true});
    return json(200,{success:true},origin);
  }

  return json(400,{error:'unknown_action'},origin);
});
