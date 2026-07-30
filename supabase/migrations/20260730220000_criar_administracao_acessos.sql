create table if not exists public.administradores (
  email text primary key check (email = lower(email)),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.configuracao_seguranca (
  chave text primary key,
  valor_hash text not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);

create table if not exists public.auditoria_administrativa (
  id bigint generated always as identity primary key,
  administrador_email text not null,
  acao text not null,
  alvo_tipo text not null,
  alvo_id text,
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists idx_auditoria_administrativa_data
  on public.auditoria_administrativa (criado_em desc);

alter table public.administradores enable row level security;
alter table public.configuracao_seguranca enable row level security;
alter table public.auditoria_administrativa enable row level security;

revoke all on table public.administradores from public, anon, authenticated;
revoke all on table public.configuracao_seguranca from public, anon, authenticated;
revoke all on table public.auditoria_administrativa from public, anon, authenticated;

insert into public.administradores(email)
values ('girassolinteligencia@gmail.com')
on conflict (email) do update set ativo=true;
