-- O dataset deixa de ser distribuído no HTML público.
-- Somente a Edge Function, usando service_role, acessa este bucket.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'private-datasets',
  'private-datasets',
  false,
  10485760,
  array['text/plain']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Nenhuma policy para anon/authenticated é criada. O acesso ocorre
-- exclusivamente dentro da Edge Function com service_role.
