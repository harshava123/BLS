const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/balaji-lorry-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Get the cities collection
    const citiesCollection = db.collection('cities');
    
    console.log('Cleaning up cities collection...');
    
    // Update all cities to remove address and contact fields
    const result = await citiesCollection.updateMany(
      {}, // Update all documents
      {
        $unset: {
          address: "",
          contact: ""
        }
      }
    );
    
    console.log(`✅ Successfully cleaned up ${result.modifiedCount} cities`);
    
    // Verify the cleanup by showing updated cities
    const cities = await citiesCollection.find({}).toArray();
    console.log('\n📋 Updated cities:');
    cities.forEach(city => {
      console.log(`- ${city.name} (${city.code})`);
      console.log(`  Fields: ${Object.keys(city).join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up cities:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
});

