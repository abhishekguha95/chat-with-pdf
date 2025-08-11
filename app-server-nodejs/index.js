import express from "express";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => res.send("API is running"));

app.listen(3000, () => {
	console.log("Server started on http://localhost:3000");
});
