require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const corsOptions = require("./src/config/corsOptions");
const { logger } = require("./src/middlewares/logger");
const errorHandler = require("./src/middlewares/errorHandler");
const connectDB = require("./src/database/connectDB");
const { logEvents } = require("./src/middlewares/logger");

const app = express();

connectDB();

const PORT = process.env.PORT || 5050;

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(logger);

app.use(express.json());
app.use("/", express.static(path.join(__dirname, "public")));

// app.use(express.static("public")); this still works because it is relative to where server

// Routes
app.use("/api", require("./src/routes/"));
app.use("/", require("./src/routes/root"));

app.all("*", (req, res) => {
	if (req.accepts("html")) {
		res.sendFile(path.join(__dirname, "views", "404.html"));
	} else if (req.accepts("json")) {
		res.json({ message: "404 Not Found" });
	} else {
		res.type("txt").send("404 Not Found");
	}
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
	console.log("Connected to MongoDB");
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
});

mongoose.connection.on("error", (err) => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		"mongoErrLog.log"
	);
});
