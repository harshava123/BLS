#!/bin/bash

echo "🚀 Trav Application Deployment Script"
echo "====================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    echo "Please initialize git and push your code to GitHub/GitLab first."
    exit 1
fi

# Check if files exist
if [ ! -f "server/package.json" ]; then
    echo "❌ Backend package.json not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi

echo "✅ Project structure looks good!"
echo ""

echo "📋 Next Steps:"
echo "1. Push your code to GitHub/GitLab if you haven't already"
echo "2. Go to https://dashboard.render.com"
echo "3. Follow the deployment guide in DEPLOYMENT.md"
echo ""

echo "🔧 Quick Commands:"
echo "git add ."
echo "git commit -m 'Prepare for deployment'"
echo "git push origin main"
echo ""

echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo ""

echo "🎯 Deployment Checklist:"
echo "□ MongoDB Atlas cluster created"
echo "□ MongoDB connection string ready"
echo "□ Code pushed to Git repository"
echo "□ Render account created"
echo "□ Backend service deployed"
echo "□ Frontend service deployed"
echo "□ CORS origin updated"
echo "□ Application tested"
echo ""

echo "�� Happy Deploying!"
