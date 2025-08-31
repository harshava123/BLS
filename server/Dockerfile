FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci --only=production --no-audit --no-fund

# Copy app source code
COPY . .

# Expose port 8000
EXPOSE 8000

# Start the server
CMD ["node", "server.js"]