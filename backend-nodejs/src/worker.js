
import { Worker, QueueEvents } from 'bullmq';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import pdf from 'pdf-parse';
import { PrismaClient } from '@prisma/client';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
};

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const prisma = new PrismaClient();

// --- Helper: S3 Stream to Buffer ---
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// --- Define the worker ---
/* eslint-disable no-unused-vars */
const worker = new Worker('pdf-processing-queue', async job => {
    const { projectId, s3Key } = job.data;

    try {
        console.log(`[Worker] Processing job for projectId: ${projectId}`);

        // Step 1: Download the PDF from S3
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
        });

        const s3Response = await s3.send(command);
        const pdfBuffer = await streamToBuffer(s3Response.Body);

        // Step 2: Extract text using pdf-parse
        const data = await pdf(pdfBuffer);
        const textContent = data.text;

        // Step 3: Simulate storing "embeddings" – here just storing text for now
        await prisma.embedding.create({
            data: {
                projectId,
                content: textContent,
                // future: store real vector embeddings here
            },
        });

        // Step 4: Mark project status = 'created'
        await prisma.project.update({
            where: { id: projectId },
            data: { status: 'CREATED' },
        });

        console.log(`[Worker] Completed job for projectId: ${projectId}`);
    } catch (err) {
        console.error(`[Worker] Failed job for projectId ${projectId}`, err);

        await prisma.project.update({
            where: { id: job.data.projectId },
            data: { status: 'FAILED' },
        });

        throw err; // let BullMQ mark the job as failed
    }
}, { connection });

// --- Optional: Listen to queue events (for logging/debugging) ---
const events = new QueueEvents('pdf-processing-queue', { connection });

events.on('completed', ({ jobId }) => {
    console.log(`[Queue] Job ${jobId} completed`);
});

events.on('failed', ({ jobId, failedReason }) => {
    console.log(`[Queue] Job ${jobId} failed: ${failedReason}`);
});

console.log('PDF processing worker started');