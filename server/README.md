# Trav Backend API

Backend API for the Trav Logistics Management System built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Booking Management**: Create, read, update, and delete consignment bookings
- **Loading Sheet Management**: Handle loading sheets with multiple LR entries
- **Delivery Tracking**: Track delivery status and updates
- **RESTful API**: Clean and organized API endpoints
- **MongoDB Integration**: Persistent data storage with MongoDB Atlas
- **CORS Enabled**: Cross-origin resource sharing for frontend integration

## 📋 Prerequisites

- Node.js (version 14 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd Trav/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Create a `.env` file in the server root directory
   - Add your MongoDB Atlas connection string:
     ```env
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trav?retryWrites=true&w=majority
     PORT=5000
     NODE_ENV=development
     ```

## 🔧 Configuration

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Set up database access (username/password)
4. Configure network access (allow from anywhere for development)
5. Get your connection string and update `.env` file

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | Required |
| `PORT` | Server port number | 5000 |
| `NODE_ENV` | Environment mode | development |

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```
This will start the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

## 📚 API Endpoints

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Loading Sheets
- `GET /api/loading-sheets` - Get all loading sheets
- `GET /api/loading-sheets/:id` - Get single loading sheet
- `POST /api/loading-sheets` - Create new loading sheet
- `PUT /api/loading-sheets/:id` - Update loading sheet
- `DELETE /api/loading-sheets/:id` - Delete loading sheet

### Deliveries
- `GET /api/deliveries` - Get all deliveries
- `GET /api/deliveries/:id` - Get single delivery
- `POST /api/deliveries` - Create new delivery
- `PUT /api/deliveries/:id` - Update delivery
- `DELETE /api/deliveries/:id` - Delete delivery
- `PATCH /api/deliveries/:id/status` - Update delivery status

### Health Check
- `GET /api/health` - Server health status

## 🗄️ Database Models

### Booking Schema
```javascript
{
  senderCompany: String (required),
  senderMobile: String (required),
  senderGST: String (required),
  receiverCompany: String (required),
  receiverMobile: String (required),
  receiverGST: String (required),
  material: String (required),
  qty: Number (required),
  weight: Number (required),
  freight: Number (required),
  invoice: String,
  invoiceValue: String,
  goodsCondition: String,
  lrCharge: Number,
  handling: Number,
  pickup: Number,
  doorDelivery: Number,
  others: Number,
  total: Number (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Loading Sheet Schema
```javascript
{
  bookingBranch: String (required),
  deliveryBranch: String (required),
  vehicleNumber: String (required),
  driverName: String (required),
  driverMobile: String (required),
  lrRows: [LRRowSchema],
  totalFreight: Number (required),
  doorDelivery: Number,
  pickup: Number,
  handling: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Delivery Schema
```javascript
{
  lrNo: String (required, unique),
  status: String (enum: pending, inTransit, delivered),
  vehicleNumber: String (required),
  deliveryPerson: String,
  deliveryDate: Date,
  remarks: String,
  origin: String,
  destination: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Notes

- Currently set to public access for development
- Add authentication middleware for production
- Implement rate limiting for production use
- Use HTTPS in production environment

## 🧪 Testing

Test the API endpoints using tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- cURL commands

## 📝 Example API Calls

### Create a Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "senderCompany": "ABC Company",
    "senderMobile": "1234567890",
    "senderGST": "GST123456",
    "receiverCompany": "XYZ Company",
    "receiverMobile": "0987654321",
    "receiverGST": "GST654321",
    "material": "Electronics",
    "qty": 10,
    "weight": 100,
    "freight": 1000,
    "total": 1000
  }'
```

### Get All Bookings
```bash
curl http://localhost:5000/api/bookings
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your connection string in `.env`
   - Verify network access in MongoDB Atlas
   - Ensure username/password are correct

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process on port 5000

3. **CORS Issues**
   - Frontend and backend should run on different ports
   - CORS is enabled for all origins in development

## 📞 Support

For issues and questions:
1. Check the console logs for error messages
2. Verify your MongoDB Atlas configuration
3. Ensure all dependencies are installed

## 🔄 Updates

Keep your dependencies updated:
```bash
npm update
npm audit fix
```
