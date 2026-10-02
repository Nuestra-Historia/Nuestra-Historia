create extension if not exists pgcrypto;

create table public.config (
  id smallint primary key default 1 check (id = 1),
  estado text not null default 'preguntando'
    check (estado in ('preguntando','aceptado','apagado')),
  fecha_hablar timestamptz,
  fecha_pareja timestamptz,
  fecha_aceptado timestamptz,
  nombre_a text,
  nombre_b text,
  session_version integer not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.config (id) values (1) on conflict do nothing;

create table public.frases (
  id uuid primary key default gen_random_uuid(),
  orden integer not null,
  texto text not null check (char_length(texto) between 1 and 500),
  created_at timestamptz not null default now()
);
create index frases_orden_idx on public.frases (orden);

create table public.albumes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  r2_key text not null unique,
  album_id uuid references public.albumes(id) on delete restrict,
  tipo text not null check (tipo in ('carrusel','recuerdo')),
  descripcion text check (char_length(descripcion) <= 1000),
  fecha date,
  orden integer not null default 0,
  bytes integer,
  ancho integer,
  alto integer,
  created_at timestamptz not null default now(),
  constraint fotos_tipo_album check (
    (tipo = 'carrusel' and album_id is not null) or
    (tipo = 'recuerdo' and album_id is null)
  )
);
create index fotos_tipo_orden_idx on public.fotos (tipo, album_id, orden);

create table public.apuestas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 200),
  apuesta_a text,
  apuesta_b text,
  premio text,
  estado text not null default 'pendiente' check (estado in ('pendiente','resuelta')),
  ganador text check (ganador in ('a','b','empate')),
  fecha date,
  created_at timestamptz not null default now(),
  constraint apuestas_ganador check (
    (estado = 'pendiente' and ganador is null) or
    (estado = 'resuelta' and ganador is not null)
  )
);

create table public.login_attempts (
  ip_hash text primary key,
  intentos integer not null default 0,
  primer_intento timestamptz not null default now(),
  bloqueado_hasta timestamptz
);

-- Registro atómico de fallos: 5 fallos en ventana de 15 min => bloqueo 15 min
create or replace function public.login_fail(p_ip text)
returns timestamptz language plpgsql as $$
declare r public.login_attempts;
begin
  insert into public.login_attempts as la (ip_hash, intentos, primer_intento)
  values (p_ip, 1, now())
  on conflict (ip_hash) do update set
    intentos = case when la.primer_intento < now() - interval '15 minutes'
                    then 1 else la.intentos + 1 end,
    primer_intento = case when la.primer_intento < now() - interval '15 minutes'
                          then now() else la.primer_intento end,
    bloqueado_hasta = case
      when (case when la.primer_intento < now() - interval '15 minutes'
                 then 1 else la.intentos + 1 end) >= 5
      then now() + interval '15 minutes' else la.bloqueado_hasta end
  returning * into r;
  return r.bloqueado_hasta;
end $$;

-- Seguridad: RLS sin políticas + sin permisos para roles de la Data API
alter table public.config         enable row level security;
alter table public.frases         enable row level security;
alter table public.albumes        enable row level security;
alter table public.fotos          enable row level security;
alter table public.apuestas       enable row level security;
alter table public.login_attempts enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.login_fail(text) to service_role;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

