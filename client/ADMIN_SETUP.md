# Admin Setup Guide

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd server
npm start
```

### 2. Create Admin User
The system automatically creates an admin user when you register with `admin@gmail.com`.

**Default Admin Credentials:**
- **Email:** admin@gmail.com
- **Password:** admin123

### 3. Access Admin Dashboard
1. Go to `/admin` route
2. Login with admin credentials
3. Manage agents and locations

## 🔐 Admin Features

### Add New Agents
- **Name:** Agent's full name
- **Email:** Unique email address
- **Password:** Secure password
- **Location:** Choose from 5 locations:
  - Hyderabad
  - Chennai
  - Bangalore
  - Kerala
  - Mumbai
- **Role:** Agent or Admin

### Manage Existing Agents
- View all agents in a table
- Activate/Deactivate agents
- Delete agents (soft delete)
- See agent statistics

### Location Management
- Agents can only work in their assigned location
- Location-based data filtering
- **Fixed Location Assignment:** Agents cannot change their location - it's set by admin only

## 📱 Agent Experience

### Location Display
- Agents see their fixed location assigned by admin
- Location affects available data and features
- Location badge displayed throughout interface
- **No Location Selection:** Agents cannot change their assigned location

### Location-Based Features
- **Delivery Dashboard:** Shows LRs for selected location
- **Loading Sheets:** Location-specific management
- **Reports:** Filtered by location
- **Abstract Daily Booking:** Location-based data

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/check-admin` - Check/create admin user
- `GET /api/auth/profile` - Get user profile

### Agent Management
- `GET /api/auth/agents` - Get all agents
- `POST /api/auth/create-agent` - Create new agent
- `PUT /api/auth/agents/:id` - Update agent
- `DELETE /api/auth/agents/:id` - Deactivate agent
- `GET /api/auth/profile` - Get current user profile (includes location)

## 🔧 Database Schema

### User Collection (Single Collection for All Users)
```javascript
{
  name: String (required),
  email: String (unique, required),
  passwordHash: String (required),
  role: String (enum: ['admin', 'agent'], default: 'agent'),
  location: String (enum: ['Hyderabad', 'Chennai', 'Bangalore', 'Kerala', 'Mumbai']),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

**Note:** All users (admin and agents) are stored in the same `users` collection with different roles and locations.

## 🚨 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Email uniqueness validation
- Soft delete for agents

## 📋 Testing

### Test Admin Creation
```bash
cd server
node test-admin.js
```

### Manual Testing
1. Register with `admin@gmail.com` → Should get admin role
2. Login with admin credentials → Should redirect to `/admin`
3. Create agents with different locations
4. Test location-based filtering in Agent interface

## 🎯 Use Cases

### For Admins
- Manage transportation company operations
- Assign agents to specific locations
- Monitor agent activities
- Generate location-based reports

### For Agents
- Work within assigned location
- Manage deliveries and loading sheets
- Track consignments by location
- Generate location-specific reports

## 🔄 Workflow

1. **Admin** creates agent accounts with location assignments
2. **Agent** logs in and selects their working location
3. **Agent** works with location-specific data
4. **Admin** monitors and manages all operations

## 🆘 Troubleshooting

### Common Issues
1. **Admin not redirecting:** Check user role in database
2. **Location not showing:** Ensure agent has location assigned
3. **API errors:** Check if backend server is running
4. **Database connection:** Verify MongoDB connection string

### Reset Admin User
```bash
# Access MongoDB and update user role
db.users.updateOne(
  { email: "admin@gmail.com" },
  { $set: { role: "admin" } }
)
```

## 📞 Support

If you encounter issues:
1. Check server logs for errors
2. Verify database connection
3. Test API endpoints individually
4. Check browser console for frontend errors
