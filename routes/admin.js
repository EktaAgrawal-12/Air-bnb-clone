const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isAdmin } = require("../middleware.js");

const adminController = require("../controllers/admin.js");

router.get("/dashboard", isAdmin, wrapAsync(adminController.dashboard));
router.get("/users/:id", isAdmin, wrapAsync(adminController.viewUser));

module.exports = router;
