const mongoose = require('mongoose');
require('dotenv').config();

// Test admin functionality
async function testAdmin() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://harshav:Mongo@12@cluster0.29nlch8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Test admin user creation
    console.log('\n🔐 Testing Admin User Creation...');
    
    const response = await fetch('http://localhost:5000/api/auth/check-admin');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin check response:', data);
    } else {
      console.log('❌ Admin check failed:', response.status);
    }

    // Test agent creation
    console.log('\n👤 Testing Agent Creation...');
    
    const agentData = {
      name: 'Test Agent',
      email: 'testagent@example.com',
      password: 'testpass123',
      location: 'Hyderabad',
      role: 'agent'
    };

    const agentResponse = await fetch('http://localhost:5000/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentData),
    });

    if (agentResponse.ok) {
      const agentResult = await agentResponse.json();
      console.log('✅ Agent created:', agentResult);
    } else {
      const error = await agentResponse.json();
      console.log('❌ Agent creation failed:', error);
    }

    console.log('\n🎉 Admin functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAdmin();
