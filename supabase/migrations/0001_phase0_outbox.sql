-- Fase 0: estructura mínima para la futura RPC de sincronización idempotente.
-- Se aplica en un proyecto Supabase cuando se configure; no contiene secretos.
create extension if not exists pgcrypto;

create table if not exists public.processed_actions (
  action_id uuid primary key,
  user_id uuid not null references auth.users(id),
  action_type text not null,
  entity_id uuid,
  processed_at timestamptz not null default now()
);

alter table public.processed_actions enable row level security;
-- La política/RPC completa se añade al conectar Auth y roles en la Fase 1.
