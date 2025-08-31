FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci --no-audit --no-fund

# Copy all source files
COPY . .

# Build the app (outputs to /app/dist)
RUN npm run build

# Install 'serve' globally to serve static files
RUN npm install -g serve

# Expose port 5000
EXPOSE 5000

# Serve the built app with SPA fallback on port 5000
CMD ["serve", "-s", "dist", "-l", "5000"]