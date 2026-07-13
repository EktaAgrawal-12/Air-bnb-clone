const User = require("../models/user.js");
const Listing = require("../models/listing.js");

module.exports.dashboard = async (req, res) => {
    // Aggregate stats (Total Users = customers + hosts only)
    const totalUsers = await User.countDocuments({ role: { $in: ["customer", "host"] } });
    const totalHosts = await User.countDocuments({ role: "host" });
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalListings = await Listing.countDocuments({});

    // Fetch all hosts with their listing counts
    const hosts = await User.find({ role: "host" }).lean();
    for (let host of hosts) {
        host.listingCount = await Listing.countDocuments({ owner: host._id });
    }

    // Fetch all customers
    const customers = await User.find({ role: "customer" }).lean();

    // Fetch all listings populated with their owners
    const listings = await Listing.find({}).populate("owner").lean();

    res.render("admin/dashboard.ejs", {
        totalUsers,
        totalHosts,
        totalCustomers,
        totalListings,
        hosts,
        customers,
        listings,
        hideNavFooter: true
    });
};

module.exports.viewUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/admin/dashboard");
    }

    let listings = [];
    if (user.role === "host" || user.role === "admin") {
        listings = await Listing.find({ owner: user._id });
    }

    res.render("admin/userDetail.ejs", {
        targetUser: user,
        listings,
        hideNavFooter: true
    });
};
