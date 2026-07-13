const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isHost } = require("../middleware.js");

const hostController = require("../controllers/host.js");

router.get("/dashboard", isHost, wrapAsync(hostController.dashboard));

module.exports = router;
