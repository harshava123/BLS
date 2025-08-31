const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/balaji-lorry-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanupCities() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connection.asPromise();
    console.log('Connected to MongoDB');
    
    const citiesCollection = mongoose.connection.collection('cities');
    
    console.log('Cleaning up cities collection...');
    
    // Remove address and contact fields from all cities
    const result = await citiesCollection.updateMany(
      {},
      {
        $unset: {
          address: "",
          contact: ""
        }
      }
    );
    
    console.log(`✅ Successfully cleaned up ${result.modifiedCount} cities`);
    
    // Show updated cities
    const cities = await citiesCollection.find({}).toArray();
    console.log('\n📋 Updated cities:');
    cities.forEach(city => {
      console.log(`- ${city.name} (${city.code})`);
      console.log(`  Fields: ${Object.keys(city).join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

cleanupCities();

