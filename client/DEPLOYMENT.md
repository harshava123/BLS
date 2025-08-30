# 🚀 Deploy to Render - Complete Guide

This guide will help you deploy your Trav application to Render with MongoDB backend.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas**: Set up a MongoDB Atlas cluster
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## 🗄️ Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Get your connection string
5. Add your IP address to the IP Access List (or use 0.0.0.0/0 for all IPs)

## 🔧 Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your Git repository
   - Select the repository containing your Trav project

3. **Configure Backend Service**
   - **Name**: `trav-backend`
   - **Root Directory**: `server` (since your backend is in the server folder)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Set Environment Variables**
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: Generate a random string (or let Render generate it)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `CORS_ORIGIN`: `https://trav-frontend.onrender.com` (we'll set this after frontend deployment)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment to complete
   - Note your backend URL (e.g., `https://trav-backend.onrender.com`)

## 🎨 Step 3: Deploy Frontend to Render

1. **Create Another Web Service**
   - Click "New +" → "Web Service" again

2. **Configure Frontend Service**
   - **Name**: `trav-frontend`
   - **Root Directory**: `.` (root of your project)
   - **Environment**: `Static Site`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

3. **Set Environment Variables**
   - `VITE_API_BASE_URL`: Your backend URL from Step 2

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment

## 🔄 Step 4: Update CORS Origin

1. Go back to your backend service
2. Update the `CORS_ORIGIN` environment variable with your frontend URL
3. Redeploy the backend service

## ✅ Step 5: Test Your Deployment

1. **Test Backend Health**: Visit `https://trav-backend.onrender.com/api/health`
2. **Test Frontend**: Visit your frontend URL
3. **Test API Calls**: Try logging in/registering from the frontend

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **MongoDB Connection Issues**
   - Verify MONGODB_URI is correct
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

3. **CORS Errors**
   - Verify CORS_ORIGIN is set correctly
   - Check frontend is calling the right backend URL

4. **Environment Variables**
   - Double-check all environment variables are set
   - Ensure no typos in variable names

### Useful Commands:

```bash
# Test backend locally
cd server
npm install
npm start

# Test frontend locally
npm install
npm run dev

# Check environment variables
echo $MONGODB_URI
```

## 🔒 Security Notes

1. **JWT_SECRET**: Use a strong, random string in production
2. **MONGODB_URI**: Never commit this to version control
3. **CORS**: Restrict origins to only your frontend domain
4. **Environment Variables**: Use Render's secure environment variable system

## 📱 Final URLs

After deployment, you'll have:
- **Backend**: `https://trav-backend.onrender.com`
- **Frontend**: `https://trav-frontend.onrender.com`
- **Health Check**: `https://trav-backend.onrender.com/api/health`

## 🎉 Success!

Your Trav application is now deployed and accessible worldwide! 🚀
