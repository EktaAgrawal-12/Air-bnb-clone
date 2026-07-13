const Listing = require("../models/listing.js");

module.exports.dashboard = async (req, res) => {
    // Fetch listings owned by this host
    const listings = await Listing.find({ owner: req.user._id }).populate("owner");
    const totalListings = listings.length;

    // Calculate total reviews on this host's listings
    let totalReviews = 0;
    listings.forEach(list => {
        totalReviews += list.reviews ? list.reviews.length : 0;
    });

    res.render("host/dashboard.ejs", {
        totalListings,
        totalReviews,
        listings
    });
};
