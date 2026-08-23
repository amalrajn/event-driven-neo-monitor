import { UnrecoverableError, type Job } from "bullmq";
import { ApiError } from "../services/http.js";
import { fetchNeoApi, toAsteroids, toCloseApproaches } from "../services/neows.js";
import { fetchSentryApiS, fetchSentryApiR, toSentryRisks, toRemovals } from "../services/sentry.js";
import { publish } from "../services/kafka.js";


export const QUEUE_NAME = "api-poller";
export const JOB_FEED = "neows-feed";
export const JOB_SENTRY_SUMMARY = "sentry-summary";
export const JOB_SENTRY_REMOVED = "sentry-removed";

const FEED_WINDOW_DAYS = 7;

/** YYYY-MM-DD in UTC, the format the Feed endpoint expects. */
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Stamps each record with when we observed it — the payload never carries that,
// and it is what the history table needs. Cannot be backfilled later.
function toMessages<T>(records: T[], key: (record: T) => string, observedAt: string) {
  return records.map(record => ({
    key: key(record),
    value: JSON.stringify({observedAt, payload: record}),
  }));
}

async function pollFeed() {
    // Computed per run, not at module load, or a long-lived worker polls a frozen window.
    const start = new Date();
    const end = new Date(start.getTime() + FEED_WINDOW_DAYS * 86_400_000);
    // One stamp for the whole run so every record in the batch agrees.
    const observedAt = start.toISOString();

    const feed = await fetchNeoApi(isoDate(start), isoDate(end));
    const asteroids = toAsteroids(feed);
    const approaches = toCloseApproaches(feed);

    await publish('neows.asteroids', toMessages(asteroids, a => a.spkId, observedAt));
    await publish('neows.close-approaches', toMessages(approaches, a => a.spkId, observedAt));
    return { window: `${isoDate(start)}..${isoDate(end)}`, asteroids: asteroids.length, approaches: approaches.length };
}

async function pollSentrySummary() {
  const observedAt = new Date().toISOString();
  const risks = toSentryRisks(await fetchSentryApiS());
  await publish('sentry.risks', toMessages(risks, r => r.designation, observedAt));
  return { risks: risks.length };
}

async function pollSentryRemoved() {
  const observedAt = new Date().toISOString();
  const removals = toRemovals(await fetchSentryApiR());
  await publish('sentry.removals', toMessages(removals, r => r.designation, observedAt));
  return { removals: removals.length };
}

export async function handler(job: Job) {
    try {
        switch (job.name) {
        case JOB_FEED: return await pollFeed();
        case JOB_SENTRY_SUMMARY: return await pollSentrySummary();
        case JOB_SENTRY_REMOVED: return await pollSentryRemoved();
        default: throw new Error(`Unknown job name: ${job.name}`);
        }
    } catch (err) {
        // A non-retryable error means our request was wrong; retrying only delays it.
        if (err instanceof ApiError && !err.retryable) throw new UnrecoverableError(err.message);
        throw err;
    }
}
