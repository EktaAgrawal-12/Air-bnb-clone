const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing, isHostOrAdmin} = require("../middleware.js")

const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });

router
.route("/")
.get(wrapAsync(listingController.index))
.post(isHostOrAdmin, 
  upload.array('listing[images]', 6),
  validateListing, 
  wrapAsync(listingController.createListing));

//New Route
router.get("/new", isHostOrAdmin, listingController.renderNewForm);

//Gallery Route
router.get("/:id/gallery", wrapAsync(listingController.showGallery));

router
.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn, isOwner, upload.array('listing[images]', 6), validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, isOwner, wrapAsync(listingController.destroylisting));

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner,
  wrapAsync(listingController.renderEditForm));

module.exports = router;

