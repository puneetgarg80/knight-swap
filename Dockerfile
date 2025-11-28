# Stage 1: Build the React client
FROM node:18-alpine AS client-build
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci

# Copy client source code
COPY client/ ./

# Build the React application
RUN npm run build

# Stage 2: Setup the Node.js server
FROM node:18-alpine
WORKDIR /app/server

# Set production environment
ENV NODE_ENV=production
ENV PORT=3200

# Install Chromium and dependencies for Puppeteer
# We do this BEFORE copying package files so it's cached even if dependencies change
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy server package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built client assets from the build stage
# The server expects client assets in ../client/dist relative to server/server.js
# So we copy them to /app/client/dist
COPY --from=client-build /app/client/dist /app/client/dist

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R node:node logs

# Expose the port the server listens on
EXPOSE 3200

# Switch to non-root user for security
USER node

# Start the server
CMD ["npm", "start"]
