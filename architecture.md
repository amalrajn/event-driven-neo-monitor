# Asteroid Tracker Architecture

## Project Goal

Asteroid Tracker is intended to be a near-Earth-object monitoring dashboard. It collects data from NASA's NeoWs and JPL Sentry APIs, stores a queryable history in PostgreSQL, and exposes the data to a React frontend through an HTTP API.

The system uses an event-driven ingestion path so polling, normalization, persistence, and presentation can evolve independently.

## Current State

### Implemented

- Docker Compose definitions for PostgreSQL, Redis, and single-node Kafka.
- A BullMQ worker that schedules three polling jobs:
  - NeoWs feed every six hours.
  - Sentry risk summary every six hours, offset from the NeoWs poll.
  - Sentry removals daily.
- NeoWs and Sentry HTTP clients with response validation and normalization.
- Kafka topic creation for:
  - `neows.asteroids`
  - `neows.close-approaches`
  - `sentry.risks`
  - `sentry.removals`
- Kafka messages carry an `observedAt` timestamp and a normalized payload. NeoWs records are keyed by `spkId`; Sentry records are keyed by `designation`.
- PostgreSQL schema for current asteroid data, close approaches, current Sentry risk, risk history, and Sentry removals.
- Express backend with `GET /api/asteroids`, `GET /api/asteroids/:designation`, and `GET /api/asteroids/:designation/history`.
- React frontend: a dashboard and a per-asteroid detail view, routed with react-router.

### Not Implemented Yet

- Kafka consumers and PostgreSQL upsert/write logic.
- The read endpoints the frontend already calls (see *Frontend API contract*).
- Automated tests, migrations, health checks, and production deployment configuration.

## Frontend API contract

The frontend is built against the full read surface, not just the routes that
exist today. Each panel calls its own endpoint; any endpoint that is not
registered yet answers Express's default 404, which the API client reports as
`missing-endpoint`, and the panel renders an "Awaiting API" placeholder naming
the route. Shipping a route is therefore all it takes to light up its panel —
no frontend change required.

| Endpoint | Status | Feeds |
|---|---|---|
| `GET /api/asteroids` | live | asteroid table, search |
| `GET /api/asteroids/:designation` | live | detail header, diameter tile |
| `GET /api/asteroids/:designation/history` | live | not yet surfaced |
| `GET /api/stats` | planned | the four dashboard tiles |
| `GET /api/activity?since=&until=` | planned | activity timeline + time slider |
| `GET /api/asteroid-views` | planned | risk / Torino / approach columns |
| `GET /api/asteroids/:designation/risk` | planned | Torino meter, impact probability |
| `GET /api/asteroids/:designation/risk-history` | planned | risk history chart |
| `GET /api/asteroids/:designation/approaches` | planned | close approaches table, next-approach tiles |

Response shapes are the interfaces in `frontend/src/api/types.ts`, which mirror
`backend/src/types/asteroid.ts` with dates as ISO strings.

`/api/asteroid-views` is deliberately not `/api/asteroids/views`: the existing
`/:designation` route would match it first and 404 it as a missing asteroid.
Until it exists the table still renders identity and size from `/api/asteroids`,
with the risk and approach columns blank.

## System Context

```text
NASA NeoWs API       JPL Sentry API
       |                    |
       +---------+----------+
                 |
       Worker: BullMQ + Redis
       fetch -> validate -> normalize
                 |
                 v
              Kafka
     four durable, keyed topics
                 |
                 v
       Consumer / read-model writer
                 |
                 v
             PostgreSQL
                 |
                 v
       Express backend API
                 |
                 v
            React frontend
```

## Components

### Infrastructure

- **PostgreSQL** is the durable application store and read model.
- **Redis** backs BullMQ job scheduling and retries.
- **Kafka** provides durable event retention and replayable ingestion. The local Compose setup uses one broker and two partitions per topic.