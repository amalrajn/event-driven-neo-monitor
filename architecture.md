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

### Not Implemented Yet

- Kafka consumers and PostgreSQL upsert/write logic.
- Backend Express application, database connection, controllers, and routes.
- Frontend screens and API integration.
- Automated tests, migrations, health checks, and production deployment configuration.

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