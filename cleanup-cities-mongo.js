// MongoDB Shell Script to Clean Up Cities Collection
// Run this in MongoDB shell or MongoDB Compass

// Switch to the database
use balaji-lorry-service

// Remove address and contact fields from all cities
db.cities.updateMany(
  {},
  {
    $unset: {
      address: "",
      contact: ""
    }
  }
)

// Verify the cleanup
db.cities.find({}, {name: 1, code: 1, _id: 1, createdAt: 1, updatedAt: 1})

// Show the structure of one city to confirm fields are removed
db.cities.findOne()

