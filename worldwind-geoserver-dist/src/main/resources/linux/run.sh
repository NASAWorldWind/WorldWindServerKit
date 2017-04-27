#!/bin/bash
##========================================
## Run GeoServer
##========================================

## Setup the prerequisites for GeoSeriver
if [ -f .setup ]; then
    echo "Already setup."
else
    # Run the setup 
    source ./setup.sh
    touch .setup

    # Create a 'wwsk' symbolic link to this distribution
    if [ -L ../wwsk ]; then
        rm ../wwsk
    fi
    ln -s $(pwd) ../wwsk
fi

## Environment variables for GeoServer
source ./env.sh

## Start the Jetty servlet container and the GeoServer webapp
cd ${GEOSERVER_HOME}/bin
./startup.sh
