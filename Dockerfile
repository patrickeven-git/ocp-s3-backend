# Use Red Hat UBI 9 Node.js 18 base image
FROM registry.access.redhat.com/ubi9/nodejs-18:latest

# Use the OpenShift recommended working directory (writable by default non-root user)
WORKDIR /opt/app-root/src

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy all source code
COPY . .

# Expose port 8080 (default for OpenShift Node.js)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
