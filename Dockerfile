# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package info and lock
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the NestJS app
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy package info
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built app
COPY --from=builder /app/dist ./dist

# Start the app
CMD ["node", "dist/main"]
