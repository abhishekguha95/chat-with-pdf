import { Worker, QueueEvents } from 'bullmq';
import pdf from 'pdf-parse';
import { PrismaClient } from '@prisma/client';
import { getFile } from './storage.js';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
};

const prisma = new PrismaClient();

// --- Helper: Stream to Buffer ---
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
    const { projectId } = job.data;

    try {
        console.log(`[Worker] Processing job for projectId: ${projectId}`);
        const keyName = `${projectId}.pdf`;

        const stream = await getFile(keyName);
        const pdfBuffer = await streamToBuffer(stream);

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