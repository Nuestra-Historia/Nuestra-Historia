create or replace function public.reordenar_frases(p_ids uuid[])
returns void language sql as $$
  update public.frases f
  set orden = t.ord::integer
  from unnest(p_ids) with ordinality as t(id, ord)
  where f.id = t.id;
$$;
revoke all on function public.reordenar_frases(uuid[]) from public, anon, authenticated;
grant execute on function public.reordenar_frases(uuid[]) to service_role;
