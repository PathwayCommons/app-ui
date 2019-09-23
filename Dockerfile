# Refer to:
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
# https://github.com/nodejs/docker-node

# Node.js base image (based on Alpine Linux)
FROM node:8

# install some tools
RUN apt-get update && apt-get install curl unzip jq

# Create an unprivileged user w/ home directory
RUN groupadd appuser && useradd --gid appuser --shell /bin/bash --create-home appuser

# Create app directory
RUN mkdir -p /home/appuser/app
WORKDIR /home/appuser/app

# Bundle app
COPY . /home/appuser/app

# Install app dependencies
# Note: here NODE_ENV env must be 'development' so that dev dependencies are installed
RUN NODE_ENV=development npm install


# NODE_ENV arg with the default value for buildng and running the client-server node web app
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm run clean
RUN npm run build

# Expose port
EXPOSE 3000

# Change ownership of the app to the unprivileged user
RUN chown appuser:appuser -R /home/appuser/app
USER appuser

# required PC_VERSION (e.g. 'v12') arg for updating the generic entities map (json) - converting
# the physical_entities.json.gz from the corresponding subdirectory of www.pathwaycommons.org/archives/PC2/
ARG PC_VERSION
ENV PC_VERSION=${PC_VERSION}
# update the generic physical entities metadata (PC_VERSION is required by the script)
RUN cd /home/appuser/app/src/scripts/generic-entity-mapping && sh update.sh

# Start the application
CMD npm start
