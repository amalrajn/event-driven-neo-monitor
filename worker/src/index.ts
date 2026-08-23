import { Queue, Worker } from "bullmq";
import { REDIS_HOST, REDIS_PORT } from "./config.js";
import {
  handler, QUEUE_NAME, JOB_FEED, JOB_SENTRY_SUMMARY, JOB_SENTRY_REMOVED,
} from "./jobs/pollNasa.js";

const connection = { host: REDIS_HOST, port: REDIS_PORT };

const retry = { attempts: 3, backoff: { type: "exponential", delay: 30_000 } } as const;

const queue = new Queue(QUEUE_NAME, { connection });

// Staggered so the three polls don't stampede on the same tick.
await queue.upsertJobScheduler(JOB_FEED, { pattern: "0 */6 * * *" }, { name: JOB_FEED, opts: retry });
await queue.upsertJobScheduler(JOB_SENTRY_SUMMARY, { pattern: "20 */6 * * *" }, { name: JOB_SENTRY_SUMMARY, opts: retry });
await queue.upsertJobScheduler(JOB_SENTRY_REMOVED, { pattern: "40 3 * * *" }, { name: JOB_SENTRY_REMOVED, opts: retry });

const worker = new Worker(QUEUE_NAME, handler, { connection, concurrency: 3 });

worker.on("completed", (job, result) => console.log(` ${job.name}`, result));
worker.on("failed", (job, err) => console.error(` ${job?.name}`, err.message));

async function shutdown(signal: string) {
  console.log(`${signal} received, draining…`);
  await worker.close();
  await queue.close();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

console.log(`worker up on ${REDIS_HOST}:${REDIS_PORT}, queue "${QUEUE_NAME}"`);
