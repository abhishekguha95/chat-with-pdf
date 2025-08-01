// import express from "express";
// import multer from "multer";
// import { PrismaClient } from "@prisma/client";
// import path from "path";
// import { pdfQueue } from "../queue.js";
// import { uploadFile, storageType } from "../storage.js";

// const router = express.Router();
// const prisma = new PrismaClient();
// const upload = multer();

// router.post("/:projectId", async (req, res) => {
//     const { projectId } = req.params;
//     const { message } = req.body;

//     if (!message) {
//         return res.status(400).json({ error: "Message is required" });
//     }

//     try {
//         console.log(`Received chat message for project ${projectId}: ${message}`);

//         return res.status(200).json({ message: "Chat message received" });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Something went wrong!" });
//     }
// });