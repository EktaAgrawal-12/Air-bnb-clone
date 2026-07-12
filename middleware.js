const Listing = require("./models/listing");
const Review = require("./models/review");
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");


module.exports.isLoggedIn = (req, res, next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to create listing!");
        return res.redirect("/login");
   }
   next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id).populate("owner");

  if (res.locals.currUser) {
    if (res.locals.currUser.role === "admin") {
      return next();
    }
    if (listing.owner && listing.owner._id.equals(res.locals.currUser._id)) {
      return next();
    }
    if (listing.owner && listing.owner.username === "admin") {
      return next();
    }
  }

  req.flash("error", "You are not the owner of this listing");
  return res.redirect(`/listings/${id}`);
};

module.exports.validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if(error){
      let errMsg = error.details.map((el)=> el.message).join(",");
       throw new ExpressError(400, errMsg);
    } else {
      next();
    }
}

module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
      let errMsg = error.details.map((el)=> el.message).join(",");
       throw new ExpressError(400, errMsg);
    } else {
      next();
    }
}

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  let listing = await Listing.findById(id);

  if (res.locals.currUser && res.locals.currUser.role === "admin") {
    return next();
  }

  if (!review.author.equals(res.locals.currUser._id) && !listing.owner.equals(res.locals.currUser._id)) {
    req.flash("error", "You are not authorized to delete this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  req.flash("error", "Access Denied: Admin privileges required!");
  res.redirect("/listings");
};