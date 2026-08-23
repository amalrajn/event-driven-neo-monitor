-- Current state + history for asteroid_tracker.
-- Applied by hand for now: psql -U postgres -d asteroid_tracker -f db/schema.sql

create table if not exists asteroid (
  spk_id                   text primary key,
  -- unique because it is the join key to Sentry, which has no SPK-ID
  designation              text not null unique,
  full_name                text not null,
  absolute_magnitude       double precision not null,
  diameter_min_m           double precision not null,
  diameter_max_m           double precision not null,
  is_potentially_hazardous boolean not null,
  is_sentry_object         boolean not null,
  jpl_url                  text not null,
  -- when our poll saw this, from the Kafka envelope
  observed_at              timestamptz not null,
  updated_at               timestamptz not null default now()
);

-- No FK to asteroid: the two neows topics are consumed independently, so an
-- approach can land before its asteroid row. Add one once that is serialised.
create table if not exists close_approach (
  spk_id              text not null,
  approach_at         timestamptz not null,
  miss_distance_km    double precision not null,
  miss_distance_lunar double precision not null,
  velocity_km_s       double precision not null,
  orbiting_body       text not null,
  observed_at         timestamptz not null,
  primary key (spk_id, approach_at)
);

create index if not exists close_approach_upcoming
  on close_approach (approach_at) where orbiting_body = 'Earth';

-- Keyed on designation, not spk_id: Sentry mode S never returns an SPK-ID.
create table if not exists sentry_risk (
  designation          text primary key,
  impact_probability   double precision not null,
  potential_impacts    integer not null,
  palermo_scale_cum    double precision not null,
  palermo_scale_max    double precision not null,
  torino_scale_max     smallint check (torino_scale_max between 0 and 10),
  diameter_m           double precision,
  impact_velocity_km_s double precision,
  impact_energy_mt     double precision,
  impact_year_first    integer,
  impact_year_last     integer,
  last_observed_at     timestamptz,
  observed_at          timestamptz not null,
  updated_at           timestamptz not null default now()
);

create index if not exists sentry_risk_by_torino
  on sentry_risk (torino_scale_max desc nulls last, impact_probability desc);

-- Append-only. One row per observed CHANGE, not per poll, or this grows by
-- ~8700 near-identical rows a day.
create table if not exists sentry_risk_history (
  designation        text not null,
  observed_at        timestamptz not null,
  impact_probability double precision not null,
  potential_impacts  integer not null,
  palermo_scale_cum  double precision not null,
  torino_scale_max   smallint,
  impact_energy_mt   double precision,
  primary key (designation, observed_at)
);

create index if not exists sentry_risk_history_timeline
  on sentry_risk_history (designation, observed_at desc);

-- Sentry mode R. Separate from sentry_risk because an object can be removed
-- without us ever having seen it in mode S.
create table if not exists sentry_removal (
  designation text primary key,
  removed_at  timestamptz,
  observed_at timestamptz not null
);
