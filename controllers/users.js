const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password, role, adminSecret } = req.body;
        let assignedRole = "user";
        if (role === "admin") {
            if (adminSecret === "ADMIN123") {
                assignedRole = "admin";
            } else {
                req.flash("error", "Incorrect Admin Secret Key!");
                return res.redirect("/signup");
            }
        }
        const newUser = new User({ email, username, role: assignedRole });
        let registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome to Wanderlust");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
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

module.exports.dashboard = async (req, res) => {
    const totalListings = await Listing.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const totalReviews = await Review.countDocuments({});

    const listings = await Listing.find({}).populate("owner");
    const users = await User.find({});

    res.render("users/dashboard.ejs", {
        totalListings,
        totalUsers,
        totalReviews,
        listings,
        users
    });
};