Asteroid monitoring dashboard that uses NASA APIs and event-driven architecture to display current data and the threat level of near-Earth objects.

Made with TypeScript, React.JS, Express.JS, BullMQ, Redis, Apache Kafka, PostgreSQL, and Docker

## Instructions:

```bash
git clone https://github.com/amalrajn/event-driven-neo-monitor
cd asteroid-tracker
docker compose up -d
# then per-service installs
cd backend && npm install
cd ../worker && npm install
cd ../frontend && npm install
# run frontend in dev
cd frontend && npm run dev
# backend and worker have tsx dev scripts: `npm run dev` in each
```
