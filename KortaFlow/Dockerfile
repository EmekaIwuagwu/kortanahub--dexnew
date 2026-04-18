# Use the officially verified node engine
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Environment variables will be handled by Render's dashboard
# but we provide a check script for start
CMD [ "npm", "start" ]
