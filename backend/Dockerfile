# Use the official Node.js runtime as the base image
FROM node:22

# Set the working directory inside the container
WORKDIR /app

# Copy dependency definition files first
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the remaining application source code
COPY . .

# Inform Docker that the application listens on port 5000
EXPOSE 5000

# Start the backend server
CMD ["npm", "run", "dev"]