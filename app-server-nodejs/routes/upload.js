import express from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import path from "path";
// import { pdfQueue } from "../queue.js";
import { uploadFile } from "../services/file-storage.js";

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer(); // in-memory buffer storage

// POST /projects
router.post("/", upload.single("file"), async (req, res) => {
    try {
        const { title, description } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "PDF file is required" });

        // 1. Create project in DB
        const project = await prisma.project.create({
            data: { title, description, status: "CREATING" },
        });

        const fileExt = path.extname(file.originalname);
        const filename = `${project.id}${fileExt}`;

        // 2. Upload to S3 or Minio
        await uploadFile(filename, file.buffer, file.size);

        // 3. Save file record in DB
        await prisma.file.create({
            data: {
                projectId: project.id,
                filename: file.originalname,
                url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`,
            },
        });

        // await pdfQueue.add('process-pdf', {
        //     projectId: project.id, 
        //     storageType: storageType
        // });

        return res.status(201).json({
            message: 'Project created and queued for processing',
            projectId: project.id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong!" });
    }
});



export default router;
console.log("Project routes loaded");