#!/bin/bash

echo "🏗️  Building Trav Application for Production"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
else
    echo "❌ Backend dependency installation failed!"
    exit 1
fi

cd ..

echo ""
echo "🎯 Production Build Complete!"
echo ""
echo "📁 Generated files:"
echo "   - Frontend: ./dist/"
echo "   - Backend: ./server/node_modules/"
echo ""
echo "🚀 Ready for deployment to Render!"
echo ""
echo "Next steps:"
echo "1. Push your code to Git repository"
echo "2. Follow DEPLOYMENT.md for Render setup"
echo "3. Set up MongoDB Atlas cluster"
echo "4. Deploy backend service"
echo "5. Deploy frontend service"
