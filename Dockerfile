FROM registry.access.redhat.com/ubi9/nodejs-18:latest

# Set working directory under /opt/app-root/src (already writable)
WORKDIR /opt/app-root/src

# Copy source files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy rest of the app
COPY . .

# Expose port (optional)
EXPOSE 8080

# Start command
CMD ["npm", "start"]
