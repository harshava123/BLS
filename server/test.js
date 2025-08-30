// Simple test script to verify backend setup
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in .env file');
      console.log('📝 Please create .env file with your MongoDB Atlas connection string');
      return;
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    console.log('🏠 Connected to:', mongoose.connection.host);
    
    // Test creating a collection
    const testCollection = mongoose.connection.collection('test');
    await testCollection.insertOne({ test: 'data', timestamp: new Date() });
    console.log('✅ Test collection created successfully');
    
    // Clean up test data
    await testCollection.deleteOne({ test: 'data' });
    console.log('🧹 Test data cleaned up');
    
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure to:');
    console.log('   1. Update .env file with your MongoDB Atlas connection string');
    console.log('   2. Check your internet connection');
    console.log('   3. Verify MongoDB Atlas credentials and network access');
  }
}

testConnection();
