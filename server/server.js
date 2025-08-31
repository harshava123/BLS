require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize express
const app = express();

// Connect to database
connectDB();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN || 'https://trav-frontend.onrender.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/loading-sheets', require('./routes/loadingSheets'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/master-data', require('./routes/masterData'));

// Cleanup endpoint for database maintenance
app.post('/api/cleanup/cities', async (req, res) => {
  try {
    const mongoose = require('mongoose');
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
    const cleanedCities = cities.map(city => ({
      name: city.name,
      code: city.code,
      fields: Object.keys(city)
    }));
    
    res.json({
      success: true,
      message: `Successfully cleaned up ${result.modifiedCount} cities`,
      cities: cleanedCities
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up cities:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up cities',
      error: error.message
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Login: http://localhost:${PORT}/api/auth/login`);
  console.log(`   - Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`   - Check Admin: http://localhost:${PORT}/api/auth/check-admin`);
  console.log(`📚 API:`);
  console.log(`   - Bookings: http://localhost:${PORT}/api/bookings`);
  console.log(`   - Loading Sheets: http://localhost:${PORT}/api/loading-sheets`);
  console.log(`   - Deliveries: http://localhost:${PORT}/api/deliveries`);
  console.log(`   - Cities: http://localhost:${PORT}/api/cities`);
  console.log(`   - Locations: http://localhost:${PORT}/api/locations`);
  console.log(`   - Customers: http://localhost:${PORT}/api/customers`);
  console.log(`   - Master Data: http://localhost:${PORT}/api/master-data`);
});
