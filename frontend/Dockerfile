# Use the official Node.js runtime
FROM node:22

# Set the working directory
WORKDIR /app

# Copy dependency definition files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application source code
COPY . .

# Document the application's listening port
EXPOSE 3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]