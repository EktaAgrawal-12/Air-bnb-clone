const { response } = require("express");
const Listing = require("../models/listing.js");

async function geocodeLocation(location) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WanderLust-App/1.0' }
  });
  const data = await res.json();
  if (data.length > 0) {
    return {
      type: "Point",
      coordinates: [parseFloat(data[0].lon), parseFloat(data[0].lat)]
    };
  }
  return { type: "Point", coordinates: [0, 0] };
}

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
  .populate({
    path: "reviews", 
    populate:{
     path: "author"
  },
  })
  .populate("owner");
  if(!listing){
  req.flash("error", "Listing you requested for does not exist!");
  return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path || req.file.url || req.file.secure_url;
    let filename = req.file.filename || req.file.public_id;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename}

    newListing.geometry = await geocodeLocation(req.body.listing.location);

    await newListing.save();
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
  req.flash("error", "Listing you requested for does not exist!");
  return res.redirect("/listings");
  }

  let originalImageUrl = listing.image && listing.image.url ? listing.image.url : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60';
  if (listing.image && listing.image.url) {
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  }

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if(typeof req.file !== "undefined"){
    let url = req.file.path || req.file.url || req.file.secure_url;
    let filename = req.file.filename || req.file.public_id;
    listing.image = {url, filename}
    await listing.save();
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroylisting = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};