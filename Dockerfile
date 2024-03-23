# Node.js base image
FROM node:10.24.1

# Create an unprivileged user w/ home directory
RUN groupadd appuser && useradd --gid appuser --shell /bin/bash --create-home appuser

# Create app directory
RUN mkdir -p /home/appuser/app
WORKDIR /home/appuser/app

# Bundle app
COPY . /home/appuser/app

# Install app dependencies
# Note: here NODE_ENV env must be 'development' so that dev dependencies are installed
RUN NODE_ENV=development npm ci

# Bundle JS and CSS
RUN npm run build-prod

# Expose port
EXPOSE 3000

# Change ownership of the app to the unprivileged user
RUN chown appuser:appuser -R /home/appuser/app
USER appuser

# Apply start commands
CMD ["npm", "start"]
