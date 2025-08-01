import { Worker, QueueEvents } from 'bullmq';
import pdf from 'pdf-parse';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { getFile } from './storage.js';

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379),
};

const prisma = new PrismaClient();

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

const worker = new Worker(
    'pdf-processing-queue',
    async job => {
        const { projectId } = job.data;

        try {
            console.log(`[Worker] Processing job for projectId: ${projectId}`);
            const keyName = `${projectId}.pdf`;

            const stream = await getFile(keyName);
            const pdfBuffer = await streamToBuffer(stream);

            // Extract text from PDF
            const data = await pdf(pdfBuffer);
            const textContent = data.text;

            // Call the embedding-service API
            const response = await axios.post('http://embeddings:8000/embed', {
                texts: [textContent],
            });

            const { embeddings } = response.data;

            // Store embedding in DB
            await prisma.embedding.create({
                data: {
                    projectId,
                    content: textContent,
                    vector: embeddings, // assumes vector is a float[] column (PostgreSQL + pgvector)
                },
            });

            // Update project status
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

            throw err;
        }
    },
    { connection }
);

const events = new QueueEvents('pdf-processing-queue', { connection });

events.on('completed', ({ jobId }) => {
    console.log(`[Queue] Job ${jobId} completed`);
});

events.on('failed', ({ jobId, failedReason }) => {
    console.log(`[Queue] Job ${jobId} failed: ${failedReason}`);
});

console.log('PDF processing worker started');
