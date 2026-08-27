import { Kafka, type KafkaConfig, type Consumer, type EachMessagePayload, type Producer} from "kafkajs";
import { KAFKA_BROKER } from "../config/config.js";
import type { Asteroid, CloseApproach, SentryRisk } from "../types/asteroid.js";
import {
    insertSentryRiskHistory,
    upsertAsteroid,
    upsertCloseApproach,
    upsertSentryRemoval,
    upsertSentryRisk,
} from "../repository/repo.js";

//neows topics: neows.asteroids, neows.close-approaches (key: spkId)
//sentry topics: sentry.risks, sentry.removals (key: des)
//2 partitions per topic should be chill i think

//kafka client
const config: KafkaConfig = {
    clientId: 'asteroid-tracker',
    brokers : [KAFKA_BROKER]
}

export const kafka = new Kafka(config);
/* -------------------------------------------------------------------------- */
/*  Producer Code                                                             */
/* -------------------------------------------------------------------------- */

let cachedProducer: Producer | null = null;

// Connect once per process and reuse. idempotent stops broker-side retries from
// duplicating records, which matters because our poll windows overlap on purpose.
async function getProducer(): Promise<Producer>{
    if (!cachedProducer){
        cachedProducer = kafka.producer({idempotent: true});
        await cachedProducer.connect();
    }
    return cachedProducer;
}

export async function disconnect(): Promise<void>{
    await cachedProducer?.disconnect();
    cachedProducer = null;
}

export async function publish(topic: string, messages: {key: string; value: string}[]): Promise<void>{
    if (messages.length === 0) return;
    const producer = await getProducer();
    // One send for the whole array — kafkajs batches per partition internally.
    await producer.send({topic, messages});
}

export async function ensureTopics(kafka: Kafka, topics: string[], partitions: number){
    const admin = kafka.admin();
    await admin.connect();
    try{
        const current_topics = await admin.listTopics();
        for(const topic of topics){
            if (!current_topics.includes(topic)){
                console.log(`creating topic: ${topic}`);
                await admin.createTopics({
                    topics: [{
                        topic: topic,
                        numPartitions: partitions,
                        replicationFactor: 1, // Adjust based on cluster size
                        // Keep everything: replay is the reason we have a log.
                        configEntries: [{name: "retention.ms", value: "-1"}],
                    }],
                });
            }
        }
    }
    catch (err){
        console.log(`Failed to ensure topics`);
        throw err;
    }
    finally{
        await admin.disconnect();
    }
}

/* -------------------------------------------------------------------------- */
/*  Consumer Code                                                             */
/* -------------------------------------------------------------------------- */
async function getConsumer(kafka: Kafka): Promise<Consumer>{
    const consumer = kafka.consumer({groupId: 'postgres-write-group'});
    await consumer.connect();
    await consumer.subscribe({
        topics: ['neows.asteroids', 'neows.close-approaches', 'sentry.risks', 'sentry.removals'],
        fromBeginning: false,
    });
    return consumer;
}

type MessageEnvelope<T> = { observedAt: string; payload: T };

function parseMessage<T>(message: EachMessagePayload["message"]): MessageEnvelope<T> {
    if (!message.value) throw new Error("Kafka message has no value");
    const envelope = JSON.parse(message.value.toString()) as MessageEnvelope<T>;
    if (typeof envelope.observedAt !== "string" || envelope.payload == null) {
        throw new Error("Kafka message has an invalid envelope");
    }
    return envelope;
}

export async function runConsumer(kafka: Kafka): Promise<Consumer> {
    const consumer = await getConsumer(kafka);
    await consumer.run({
        eachMessage: async ({topic, message}) => {
            try {
                const { observedAt, payload } = parseMessage(message);

                if (topic === 'neows.asteroids'){
                    await upsertAsteroid(payload as Asteroid, observedAt);
                }
                else if (topic === 'neows.close-approaches'){
                    await upsertCloseApproach(payload as CloseApproach, observedAt);
                }
                else if (topic === 'sentry.risks'){
                    const risk = payload as Omit<SentryRisk, "spkId">;
                    await upsertSentryRisk(risk, observedAt);
                    await insertSentryRiskHistory(risk, observedAt);
                }
                else if (topic === 'sentry.removals'){
                    await upsertSentryRemoval(payload as { designation: string; removedAt: Date | null }, observedAt);
                }
                else{
                    throw new Error(`Unknown Kafka topic: ${topic}`);
                }
            }
            catch (err) {
                console.error('Failed to persist Kafka message', err);
                throw err;
            }
        }
    });
    return consumer;
}

