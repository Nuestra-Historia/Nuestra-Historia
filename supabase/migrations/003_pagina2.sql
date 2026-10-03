-- 003_pagina2.sql
-- PRECONDICIÓN (la verifica el dueño antes de ejecutar):
--   select count(*) from public.fotos;   -- debe dar 0

alter table public.fotos drop constraint if exists fotos_tipo_album;
alter table public.fotos drop constraint if exists fotos_tipo_check;
alter table public.fotos drop column if exists album_id;
drop table if exists public.albumes;

alter table public.fotos
  add constraint fotos_tipo_check check (tipo in ('tira_a','tira_b','momento'));
alter table public.fotos add column if not exists r2_key_thumb text not null;
alter table public.fotos add constraint fotos_r2_key_thumb_key unique (r2_key_thumb);

alter table public.apuestas add column if not exists pagada boolean not null default false;
alter table public.apuestas
  add constraint apuestas_pagada_check check (pagada = false or estado = 'resuelta');

update public.config
  set nombre_a = coalesce(nombre_a, 'Agos'),
      nombre_b = coalesce(nombre_b, 'Nico')
  where id = 1;

create or replace function public.reordenar_fotos(p_ids uuid[])
returns void language sql as $$
  update public.fotos f
  set orden = t.ord::integer
  from unnest(p_ids) with ordinality as t(id, ord)
  where f.id = t.id;
$$;
revoke all on function public.reordenar_fotos(uuid[]) from public, anon, authenticated;
grant execute on function public.reordenar_fotos(uuid[]) to service_role;