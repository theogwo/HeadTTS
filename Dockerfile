# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Set port (optional, not always used)
ENV PORT=10000

# Run the server
CMD ["node", "modules/headtts-node.mjs"]
