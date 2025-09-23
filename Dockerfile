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

RUN mkdir -p /app/voices && \
    curl -L -o /app/voices/af_bella.bin https://github.com/theogwo/HeadTTS/blob/main/voices/af_bella.bin && \
    echo "✅ File downloaded:" && \
    ls -lh /app/voices

# Set port (optional, not always used)
ENV PORT=10000

# Run the server
CMD ["node", "modules/headtts-node.mjs"]
