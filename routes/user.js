const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

router
.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

router
.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl, passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), 
    userController.login);

router.get("/logout", userController.logout);

// Forgot Password routes
router.get("/forgot-password", userController.renderForgotForm);
router.post("/forgot-password", wrapAsync(userController.sendResetEmail));

// Reset Password routes
router.get("/reset-password/:token", wrapAsync(userController.renderResetForm));
router.post("/reset-password/:token", wrapAsync(userController.updatePassword));

module.exports = router;