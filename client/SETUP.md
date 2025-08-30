# 🚀 Trav Logistics Management System - Complete Setup Guide

This guide will help you set up both the frontend and backend of the Trav Logistics Management System.

## 📋 Prerequisites

- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB Atlas account** - [Sign up here](https://www.mongodb.com/atlas)
- **Git** (optional, for version control)
- **Code editor** (VS Code recommended)

## 🏗️ Project Structure

```
Trav/
├── src/                    # Frontend React code
├── server/                 # Backend Node.js/Express code
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── config/            # Configuration files
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── package.json            # Frontend dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

## 🚀 Quick Start

### 1. **Install Frontend Dependencies**
```bash
npm install
```

### 2. **Install Backend Dependencies**
```bash
npm run server:install
```

### 3. **Set Up MongoDB Atlas**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose FREE tier)
4. Set up database access:
   - Username: `your_username`
   - Password: `your_secure_password`
   - Role: `Read and write to any database`
5. Set up network access:
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
6. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string

### 4. **Configure Environment Variables**
Update the `.env` file with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/trav?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

**⚠️ Important:** Replace `your_username` and `your_password` with your actual MongoDB Atlas credentials.

### 5. **Test Backend Connection**
```bash
cd server
node test.js
```

You should see:
```
🔍 Testing MongoDB connection...
📡 Connection string: Found
✅ MongoDB connection successful!
🏠 Connected to: cluster.mongodb.net
✅ Test collection created successfully
🧹 Test data cleaned up
🔌 Connection closed
```

### 6. **Start the Backend Server**
```bash
npm run server
```

You should see:
```
🚀 Server running on port 5000
📊 Health check: http://localhost:5000/api/health
📚 API Documentation:
   - Bookings: http://localhost:5000/api/bookings
   - Loading Sheets: http://localhost:5000/api/loading-sheets
   - Deliveries: http://localhost:5000/api/deliveries
```

### 7. **Start the Frontend**
In a new terminal:
```bash
npm run dev
```

Your app will be available at: `http://localhost:5173`

## 🔧 Available Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend Scripts
- `npm run server` - Start backend in development mode
- `npm run server:start` - Start backend in production mode
- `npm run server:install` - Install backend dependencies

## 📱 Features

### ✅ **Booking Management**
- Create new consignment bookings
- Sender and receiver information
- Material description and quantities
- Freight and additional charges
- Total calculation

### ✅ **Loading Sheet Management**
- Multiple LR entries per sheet
- Vehicle and driver information
- Branch selection
- Freight calculations

### ✅ **Delivery Tracking**
- LR status updates
- Delivery person details
- Real-time tracking
- Status history

### ✅ **Reports & Analytics**
- Daily booking reports
- Delivery summaries
- Export to PDF/Excel
- Abstract daily booking

### ✅ **Invoice Management**
- On account invoices
- Paid booking invoices
- Customer management

### ✅ **Search & Tracking**
- LR number search
- L sheet number search
- Waybill tracking
- Current position updates

## 🗄️ Database Collections

The system will automatically create these collections in MongoDB:

- **bookings** - Consignment booking information
- **loadingsheets** - Loading sheet data
- **deliveries** - Delivery tracking information

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Create a Test Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "senderCompany": "Test Company",
    "senderMobile": "1234567890",
    "senderGST": "GST123456",
    "receiverCompany": "Receiver Co",
    "receiverMobile": "0987654321",
    "receiverGST": "GST654321",
    "material": "Test Material",
    "qty": 5,
    "weight": 50,
    "freight": 500,
    "total": 500
  }'
```

### Get All Bookings
```bash
curl http://localhost:5000/api/bookings
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **MongoDB Connection Failed**
- Check your `.env` file has the correct connection string
- Verify username/password in MongoDB Atlas
- Ensure network access allows connections from anywhere
- Check internet connection

#### 2. **Port Already in Use**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000
kill -9 <PID>
```

#### 3. **Frontend Can't Connect to Backend**
- Ensure backend is running on port 5000
- Check CORS is enabled (it is by default)
- Verify API endpoints are correct

#### 4. **Dependencies Installation Failed**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error Messages

#### "MongoDB connection error"
- Check `.env` file exists and has correct MONGODB_URI
- Verify MongoDB Atlas credentials

#### "Cannot find module"
- Run `npm install` in both root and server directories
- Check Node.js version (should be 14+)

#### "EADDRINUSE"
- Port 5000 is already in use
- Kill existing process or change PORT in `.env`

## 🔒 Security Notes

### Development Environment
- CORS is enabled for all origins
- No authentication required
- MongoDB Atlas network access is open

### Production Considerations
- Implement user authentication
- Add rate limiting
- Restrict CORS to specific domains
- Use HTTPS
- Implement input validation
- Add API key authentication

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Bookings
- `GET /bookings` - List all bookings
- `POST /bookings` - Create new booking
- `GET /bookings/:id` - Get specific booking
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Delete booking

#### Loading Sheets
- `GET /loading-sheets` - List all loading sheets
- `POST /loading-sheets` - Create new loading sheet
- `GET /loading-sheets/:id` - Get specific loading sheet
- `PUT /loading-sheets/:id` - Update loading sheet
- `DELETE /loading-sheets/:id` - Delete loading sheet

#### Deliveries
- `GET /deliveries` - List all deliveries
- `POST /deliveries` - Create new delivery
- `GET /deliveries/:id` - Get specific delivery
- `PUT /deliveries/:id` - Update delivery
- `DELETE /deliveries/:id` - Delete delivery
- `PATCH /deliveries/:id/status` - Update delivery status

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in `.env`
2. Use `npm run server:start` instead of `npm run server`
3. Consider using PM2 for process management
4. Set up environment variables on your hosting platform

### Frontend Deployment
1. Run `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Update API base URL to your production backend URL

## 📞 Support

If you encounter issues:

1. **Check the console logs** for error messages
2. **Verify your MongoDB Atlas setup** is correct
3. **Ensure all dependencies** are installed
4. **Check the troubleshooting section** above
5. **Verify environment variables** are set correctly

## 🎉 Success!

Once everything is working:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API Health: `http://localhost:5000/api/health`
- MongoDB: Connected to Atlas

You can now:
- Create bookings through the frontend
- View data in MongoDB Atlas
- Test all API endpoints
- Start building additional features

Happy coding! 🚀
