const express = require("express");
const router = express.Router();

const noteRoute = require("./noteRoutes");
const userRoute = require("./userRoutes");
const authRoute = require("./authRoute");

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/notes", noteRoute);

module.exports = router;
