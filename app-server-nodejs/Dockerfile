FROM node:20-bullseye-slim

# Set working directory to match docker-compose working_dir and actual project structure
# This should align with the service name and directory structure
WORKDIR /usr/src/app/app-server-nodejs

# Copy package files and install dependencies
# This is kept separate to leverage Docker layer caching
# Dependencies change less frequently than source code
COPY package*.json ./
RUN npm install

EXPOSE 3000

# Development command - keeps container running for debugging
# In production, replace with actual application startup command like:
# CMD ["npm", "start"] or CMD ["node", "src/index.js"]
CMD ["tail", "-f", "/dev/null"]