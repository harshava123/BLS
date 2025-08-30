# 🚀 Quick Deploy Checklist

## ✅ Pre-Deployment (Do This First!)

1. **MongoDB Atlas Setup**
   - [ ] Create MongoDB Atlas account
   - [ ] Create free cluster
   - [ ] Create database user
   - [ ] Get connection string
   - [ ] Add IP to whitelist (0.0.0.0/0 for all IPs)

2. **Git Repository**
   - [ ] Push code to GitHub/GitLab
   - [ ] Ensure all files are committed

## 🎯 Deploy Backend (5 minutes)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name**: `trav-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: `your-secret-key-here`
   - `MONGODB_URI`: `your-mongodb-connection-string`
6. Click "Create Web Service"
7. Wait for deployment and note the URL

## 🎨 Deploy Frontend (5 minutes)

1. Click "New +" → "Web Service" again
2. Configure:
   - **Name**: `trav-frontend`
   - **Root Directory**: `.` (root)
   - **Environment**: `Static Site`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Set Environment Variables:
   - `VITE_API_BASE_URL`: `https://trav-backend.onrender.com`
4. Click "Create Web Service"
5. Wait for deployment

## 🔄 Final Step

1. Go back to backend service
2. Update `CORS_ORIGIN` to your frontend URL
3. Redeploy backend

## 🧪 Test

- Backend: `https://trav-backend.onrender.com/api/health`
- Frontend: Your frontend URL
- Try logging in/registering

## 🆘 Need Help?

- Check build logs in Render dashboard
- Verify environment variables are set correctly
- Ensure MongoDB connection string is valid
- Check CORS origin matches frontend URL

## 🎉 You're Done!

Your Trav app is now live on the internet! 🌍
