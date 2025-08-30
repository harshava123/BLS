const mongoose = require('mongoose');
require('dotenv').config();

// Test unified user system
async function testUnifiedSystem() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://harshav:Mongo@12@cluster0.29nlch8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Test admin user creation
    console.log('\n🔐 Testing Admin User Creation...');
    
    const adminResponse = await fetch('http://localhost:5000/api/auth/check-admin');
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('✅ Admin check response:', adminData);
    } else {
      console.log('❌ Admin check failed:', adminResponse.status);
    }

    // Test agent creation
    console.log('\n👤 Testing Agent Creation...');
    
    const agentData = {
      name: 'Test Agent',
      email: 'testagent@example.com',
      password: 'testpass123',
      location: 'Hyderabad'
    };

    const agentResponse = await fetch('http://localhost:5000/api/auth/create-agent', {
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

    // Test agent login
    console.log('\n🔑 Testing Agent Login...');
    
    const loginData = {
      email: 'testagent@example.com',
      password: 'testpass123'
    };

    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('✅ Agent login successful:', {
        name: loginResult.user.name,
        email: loginResult.user.email,
        role: loginResult.user.role,
        location: loginResult.user.location
      });
    } else {
      const error = await loginResponse.json();
      console.log('❌ Agent login failed:', error);
    }

    // Test getting all agents
    console.log('\n📋 Testing Get All Agents...');
    
    const agentsResponse = await fetch('http://localhost:5000/api/auth/agents');
    if (agentsResponse.ok) {
      const agentsData = await agentsResponse.json();
      console.log('✅ Agents fetched:', agentsData.length, 'agents found');
      agentsData.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.email}) - ${agent.location} - ${agent.role}`);
      });
    } else {
      console.log('❌ Failed to fetch agents:', agentsResponse.status);
    }

    console.log('\n🎉 Unified user system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testUnifiedSystem();
