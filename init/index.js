if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({ path: '../.env' });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to DB");
    return initDB();
  })
  .then(() => {
    mongoose.connection.close();
    console.log("DB connection closed");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  // Clear collections
  await Listing.deleteMany({});
  await User.deleteMany({});

  // Seed Admin & Standard User
  const adminUser = new User({ email: "admin@wanderlust.com", username: "admin", role: "admin" });
  const registeredAdmin = await User.register(adminUser, "admin123");

  const standardUser = new User({ email: "user@wanderlust.com", username: "user", role: "user" });
  await User.register(standardUser, "user123");

  // Categories
  const categories = ["trending", "rooms", "cities", "mountains", "castles", "pools", "camping", "farms", "arctic", "domes", "boats"];

  // Map listings and geocode dynamically
  const mappedListings = [];
  console.log(`Geocoding ${initData.data.length} listings for seeding...`);
  for (let i = 0; i < initData.data.length; i++) {
    const obj = initData.data[i];
    let coords = [75.7873, 26.9124]; // Fallback to Jaipur, India

    try {
      const query = `${obj.location}, ${obj.country}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'WanderLust-App/1.0' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        coords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      }
    } catch (err) {
      console.log(`  -> Failed to geocode ${obj.location} during seed, using fallback.`);
    }

    mappedListings.push({
      ...obj,
      owner: registeredAdmin._id,
      category: categories[i % categories.length],
      geometry: {
        type: "Point",
        coordinates: coords
      }
    });

    // Delay to respect Nominatim rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await Listing.insertMany(mappedListings);
  console.log("data was initialized");
};
