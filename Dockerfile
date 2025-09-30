# Use official Node.js LTS image
FROM node:22.14.0-alpine

# Set working directory
WORKDIR /src

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port your app runs on
EXPOSE 4000

# Start the app
CMD ["npm", "run", "start"]