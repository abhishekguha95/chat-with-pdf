const express = require("express");
const dotenv = require("dotenv");
const projectRoutes = require("./routes/project");

dotenv.config();
const app = express();

app.use(express.json());
app.use("/projects", projectRoutes);

app.get("/", (req, res) => res.send("API is running"));

app.listen(3000, () => {
	console.log("Server started on http://localhost:3000");
});
