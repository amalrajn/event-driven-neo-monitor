import { Kafka, type KafkaConfig, type Producer} from "kafkajs";
import { KAFKA_BROKER } from "../config.js";

//neows topics: neows.asteroids, neows.close-approaches (key: spkId)
//sentry topics: sentry.risks, sentry.removals (key: des)
//2 partitions per topic should be chill i think

//kafka client
const config: KafkaConfig = {
    clientId: 'asteroid-tracker',
    brokers : [KAFKA_BROKER]
}

export const kafka = new Kafka(config);

let cachedProducer: Producer | null = null;

// Connect once per process and reuse. idempotent stops broker-side retries from
// duplicating records, which matters because our poll windows overlap on purpose.
export async function getProducer(): Promise<Producer>{
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
