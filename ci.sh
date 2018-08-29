#!/bin/bash

# This is a helper script to set up a very simple CI dev/testing server.  It can
# be used with `cron` in order to set up regular builds, e.g. for every 15 minutes:
#
# `crontab -e`
#
# */15 * * * * /home/baderlab/development.sh > /home/baderlab/development_cron.log 2>&1
#
# To use this script, create a script per server instance, e.g. `development.sh`:
#
#!/bin/bash
#
# PATH=$PATH:/home/baderlab/.nvm/versions/node/v8.11.2/bin
# export BRANCH=development
# export PORT=3000
#
# /home/baderlab/ci.sh

#!/bin/bash

JOB_NAME=$BRANCH
REPO=https://github.com/PathwayCommons/app-ui.git
WORKSPACE=/home/baderlab/workspace/$JOB_NAME
WORKSPACE_TMP=/tmp/$JOB_NAME

rm -rf $WORKSPACE_TMP
mkdir -p $WORKSPACE_TMP
cd $WORKSPACE_TMP

# get the repo
git clone $REPO $WORKSPACE_TMP
git checkout $BRANCH

# build
npm install
npm run clean

#export NODE_ENV=production

npm run build

# stop the old screen session
screen -X -S $JOB_NAME quit || echo "No screen session to stop"

# swap out old workspace with new one
mkdir -p /tmp/rm
mv $WORKSPACE /tmp/rm/$JOB_NAME || echo "No old workspace to move"
mv $WORKSPACE_TMP $WORKSPACE

# start the server in a screen session
screen -d -m -S $JOB_NAME npm start

# delete the old workspace files
rm -rf /tmp/rm/$JOB_NAME || echo "No old workspace to delete"

