FROM registry.access.redhat.com/ubi9/nodejs-18:latest
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
