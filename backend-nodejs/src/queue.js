import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: 'redis', // match the docker-compose service name
  port: 6379
});

const pdfQueue = new Queue('pdf-processing-queue', { connection });

export { pdfQueue };