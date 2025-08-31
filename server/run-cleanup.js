console.log('Starting cities cleanup...');

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/balaji-lorry-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanup() {
  try {
    console.log('Connected to MongoDB');
    
    const citiesCollection = mongoose.connection.collection('cities');
    
    console.log('Removing address and contact fields...');
    
    const result = await citiesCollection.updateMany(
      {},
      {
        $unset: {
          address: "",
          contact: ""
        }
      }
    );
    
    console.log(`Cleaned up ${result.modifiedCount} cities`);
    
    const cities = await citiesCollection.find({}).toArray();
    console.log('Cities after cleanup:');
    cities.forEach(city => {
      console.log(`- ${city.name} (${city.code})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Done');
  }
}

cleanup();

