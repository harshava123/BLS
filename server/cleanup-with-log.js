const mongoose = require('mongoose');
const fs = require('fs');

// Create a write stream to log file
const logStream = fs.createWriteStream('cleanup-log.txt', { flags: 'w' });

function log(message) {
  console.log(message);
  logStream.write(message + '\n');
}

log('Starting cities cleanup...');

mongoose.connect('mongodb://localhost:27017/balaji-lorry-service', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanup() {
  try {
    log('Connected to MongoDB');
    
    const citiesCollection = mongoose.connection.collection('cities');
    
    log('Removing address and contact fields...');
    
    const result = await citiesCollection.updateMany(
      {},
      {
        $unset: {
          address: "",
          contact: ""
        }
      }
    );
    
    log(`Cleaned up ${result.modifiedCount} cities`);
    
    const cities = await citiesCollection.find({}).toArray();
    log('Cities after cleanup:');
    cities.forEach(city => {
      log(`- ${city.name} (${city.code})`);
      log(`  Fields: ${Object.keys(city).join(', ')}`);
    });
    
    log('Cleanup completed successfully!');
    
  } catch (error) {
    log(`Error: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    log('MongoDB connection closed');
    log('Check cleanup-log.txt for full results');
    logStream.end();
  }
}

cleanup();

