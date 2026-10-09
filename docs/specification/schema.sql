-- DEMP v1.1 - esquema inicial orientativo para Supabase/PostgreSQL.
-- Codex debe convertirlo en migraciones versionadas y ajustar constraints/RLS durante implementación.

create extension if not exists pgcrypto;

create type public.user_role as enum ('CONSULATE', 'PRINT_CENTER', 'SUPERADMIN');
create type public.case_status as enum ('REGISTRADO', 'EMITIDO', 'PREPARADO_ENVIO', 'ENVIADO', 'DISPONIBLE_RETIRO', 'ENTREGADO');
create type public.case_source as enum ('MANUAL', 'DOCUMENT_SCAN', 'FILE_IMPORT', 'MADRID_MRZ');
create type public.priority_status as enum ('REQUESTED', 'ACCEPTED', 'REJECTED');
create type public.scan_result as enum ('MATCHED', 'AUTO_CREATED', 'DUPLICATE_SCAN', 'ROUTED_OTHER_CONSULATE', 'REVIEW_REQUIRED', 'FAILED');
create type public.shipment_status as enum ('OPEN', 'PREPARED', 'SHIPPED', 'RECEIVED');
create type public.receipt_status as enum ('PENDING', 'RECEIVED', 'MISSING');
create type public.review_status as enum ('PENDING', 'MERGED', 'NOT_SAME', 'DEFERRED');
create type public.notification_status as enum ('PENDING', 'SENT', 'FAILED', 'SKIPPED_QUOTA');

create table public.consulates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  city text not null,
  is_print_center boolean not null default false,
  is_honorary boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role public.user_role not null,
  consulate_id uuid references public.consulates(id),
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  cedula text not null,
  first_names text not null,
  last_names text not null,
  birth_date date not null,
  email text,
  consulate_id uuid not null references public.consulates(id),
  passport_number text,
  status public.case_status not null default 'REGISTRADO',
  source public.case_source not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  application_at timestamptz not null default now(),
  processed_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  closed_at timestamptz,
  anonymized_at timestamptz,
  normalized_name text,
  destination_is_provisional boolean not null default false,
  merged_into_case_id uuid references public.cases(id),
  row_version bigint not null default 1,
  constraint birth_date_not_future check (birth_date <= current_date),
  constraint cannot_merge_into_self check (merged_into_case_id is null or merged_into_case_id <> id)
);

-- No unique active-cedula constraint at DB level:
-- ordinary consular creation must reject duplicates transactionally,
-- while Madrid may temporarily create a MADRID_MRZ duplicate for reconciliation.
create index cases_cedula_idx on public.cases(cedula);
create index cases_public_lookup_idx on public.cases(cedula, birth_date, status);
create index cases_consulate_status_idx on public.cases(consulate_id, status);
create index cases_created_idx on public.cases(created_at);
create index cases_processed_idx on public.cases(processed_at);
create unique index cases_passport_unique_idx
  on public.cases(passport_number)
  where passport_number is not null and merged_into_case_id is null;
create index cases_normalized_name_idx on public.cases(normalized_name) where normalized_name is not null;

create table public.priority_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  request_reason text not null check (length(trim(request_reason)) > 0),
  status public.priority_status not null default 'REQUESTED',
  decided_by uuid references auth.users(id),
  decision_reason text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint rejection_requires_reason check (status <> 'REJECTED' or length(trim(coalesce(decision_reason,''))) > 0)
);

create unique index one_pending_priority_per_case
  on public.priority_requests(case_id)
  where status = 'REQUESTED';

create table public.scan_sessions (
  id uuid primary key default gen_random_uuid(),
  focus_consulate_id uuid references public.consulates(id),
  started_by uuid not null references auth.users(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  device_label text
);

create table public.passport_scans (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.scan_sessions(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  result public.scan_result not null,
  created_by uuid not null references auth.users(id),
  captured_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_code text not null unique,
  consulate_id uuid not null references public.consulates(id),
  status public.shipment_status not null default 'OPEN',
  carrier text,
  tracking_number text,
  created_by uuid not null references auth.users(id),
  prepared_by uuid references auth.users(id),
  shipped_by uuid references auth.users(id),
  received_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  prepared_at timestamptz,
  shipped_at timestamptz,
  received_at timestamptz,
  row_version bigint not null default 1
);
create index shipments_consulate_status_idx on public.shipments(consulate_id, status);

create table public.shipment_items (
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  case_id uuid not null references public.cases(id),
  receipt_status public.receipt_status not null default 'PENDING',
  receipt_note text,
  added_at timestamptz not null default now(),
  received_at timestamptz,
  primary key (shipment_id, case_id)
);

create table public.review_cases (
  id uuid primary key default gen_random_uuid(),
  primary_case_id uuid not null references public.cases(id),
  candidate_case_id uuid not null references public.cases(id),
  reason text not null,
  score numeric,
  status public.review_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  constraint different_cases check (primary_case_id <> candidate_case_id)
);
create index review_pending_idx on public.review_cases(status, created_at);

create table public.events (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.cases(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_case_created_idx on public.events(case_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  type text not null,
  status public.notification_status not null default 'PENDING',
  attempts integer not null default 0,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now()
);

create table public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  scope text not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.metrics_monthly (
  period_month date not null,
  consulate_id uuid not null references public.consulates(id),
  registered_count integer not null default 0,
  emitted_count integer not null default 0,
  delivered_count integer not null default 0,
  madrid_direct_count integer not null default 0,
  avg_capture_to_print_minutes numeric,
  median_capture_to_print_minutes numeric,
  updated_at timestamptz not null default now(),
  primary key (period_month, consulate_id)
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.processed_actions (
  action_id uuid primary key,
  user_id uuid not null references auth.users(id),
  action_type text not null,
  entity_id uuid,
  processed_at timestamptz not null default now()
);

-- Defaults
insert into public.app_settings(key, value)
values
  ('retention_days', '180'::jsonb),
  ('email_daily_cap', '250'::jsonb),
  ('notification_triggers', '["DISPONIBLE_RETIRO"]'::jsonb)
on conflict (key) do nothing;

-- Codex TODO in migrations:
-- 1. triggers updated_at / row_version;
-- 2. transition functions/RPCs transactionales;
-- 3. RLS completo por rol/oficina;
-- 4. helper functions current_profile/current_role/current_consulate;
-- 5. RPC de creación ordinaria que rechaza segundo trámite activo por cédula;
-- 6. RPCs de matching/merge que permiten duplicado temporal MADRID_MRZ y limpian el registro absorbido;
-- 7. regla transaccional para impedir el mismo caso en dos lotes activos simultáneos;
-- 8. pg_cron: agregar métricas y PURGAR detalle tras retention_days (no acumular casos anonimizados);
-- 9. constraints adicionales tras tests de flujo;
-- 10. seed de consulados de España.
