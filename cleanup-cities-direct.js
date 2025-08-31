const { MongoClient } = require('mongodb');

async function cleanupCities() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('balaji-lorry-service');
    const citiesCollection = database.collection('cities');

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
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

cleanupCities();

