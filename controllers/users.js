const User = require("../models/user.js");
const crypto = require("crypto");
const mailService = require("../utils/mailService.js");

module.exports.renderSignupForm = (req, res) => {
    const role = req.query.role;
    if (role === "customer" || role === "host") {
        res.render("users/signup.ejs", { role, hideNavFooter: true });
    } else {
        res.render("users/roleSelect.ejs", { hideNavFooter: true });
    }
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password, role } = req.body;

        // SECURITY: Hard-validate role — only customer or host allowed
        if (role !== "customer" && role !== "host") {
            role = "customer";
        }

        const newUser = new User({ email, username, role });
        let registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Nestora!");
            if (role === "host") {
                return res.redirect("/host/dashboard");
            }
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs", { hideNavFooter: true });
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Nestora!");

    // Check for a saved redirect URL first
    if (res.locals.redirectUrl) {
        return res.redirect(res.locals.redirectUrl);
    }

    // Role-based redirect
    const role = req.user.role;
    if (role === "admin") {
        return res.redirect("/admin/dashboard");
    } else if (role === "host") {
        return res.redirect("/host/dashboard");
    }
    res.redirect("/listings");
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

module.exports.renderForgotForm = (req, res) => {
    res.render("users/forgot.ejs");
};

module.exports.sendResetEmail = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        req.flash("error", "No account registered with that email address.");
        return res.redirect("/forgot-password");
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
    const subject = "Nestora - Password Reset Request";
    const text = `Hello,\n\nYou are receiving this email because you (or someone else) requested a password reset for your account.\n\nPlease click on the following link or paste it into your browser to complete the process within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nBest regards,\nThe Nestora Team`;
    const html = `<p>Hello,</p><p>You are receiving this email because you (or someone else) requested a password reset for your account.</p><p>Please click on the link below to complete the process within 1 hour:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p><p>Best regards,<br>The Nestora Team</p>`;

    await mailService.sendEmail({ to: email, subject, text, html });
    req.flash("success", "A password reset link has been sent to your email.");
    res.redirect("/login");
};

module.exports.renderResetForm = async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot-password");
    }
    res.render("users/reset.ejs", { token });
};

module.exports.updatePassword = async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot-password");
    }

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.login(user, (err) => {
        if (err) return next(err);
        req.flash("success", "Success! Your password has been reset and you are logged in.");
        res.redirect("/listings");
    });
};