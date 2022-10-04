const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const corsOptions = require("./src/config/corsOptions");
const { logger } = require("./src/middlewares/logger");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();

const PORT = process.env.PORT || 5050;

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(logger);

app.use(express.json());
app.use("/", express.static(path.join(__dirname, "public")));

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

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
