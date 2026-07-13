if (process.env.NODE_ENV !== "production") {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
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
  const adminUser = new User({ email: "ektaa449@gmail.com", username: "ektaa_admin", role: "admin" });
  const registeredAdmin = await User.register(adminUser, "admin123");

  const standardUser = new User({ email: "user@wanderlust.com", username: "user", role: "customer" });
  await User.register(standardUser, "user123");

  // Seed 3 Dummy Hosts
  const host1 = new User({ email: "host1@wanderlust.com", username: "host1", role: "host" });
  const registeredHost1 = await User.register(host1, "host123");

  const host2 = new User({ email: "host2@wanderlust.com", username: "host2", role: "host" });
  const registeredHost2 = await User.register(host2, "host123");

  const host3 = new User({ email: "host3@wanderlust.com", username: "host3", role: "host" });
  const registeredHost3 = await User.register(host3, "host123");

  // Categories
  const categories = ["trending", "rooms", "cities", "mountains", "castles", "pools", "camping", "farms", "arctic", "domes", "boats"];

  // Map listings and geocode dynamically
  const mappedListings = [];
  const listingsToSeed = initData.data.slice(0, 15);
  console.log(`Geocoding ${listingsToSeed.length} listings for seeding...`);
  for (let i = 0; i < listingsToSeed.length; i++) {
    const obj = listingsToSeed[i];
    let coords = [75.7873, 26.9124]; // Fallback to Jaipur, India

    try {
      const query = `${obj.location}, ${obj.country}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Nestora-App/1.0' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        coords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      }
    } catch (err) {
      console.log(`  -> Failed to geocode ${obj.location} during seed, using fallback.`);
    }

    // Allocate owner: distribute evenly among the 3 dummy hosts (5 listings each)
    let ownerId;
    const hostIndex = i % 3;
    if (hostIndex === 0) ownerId = registeredHost1._id;
    else if (hostIndex === 1) ownerId = registeredHost2._id;
    else ownerId = registeredHost3._id;

    mappedListings.push({
      ...obj,
      owner: ownerId,
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
