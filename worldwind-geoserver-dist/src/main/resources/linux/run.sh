#!/bin/bash

# Environment variables for GeoServer
source ./env.sh

# Start the Jetty servlet container and the GeoServer webapp
cd ${GEOSERVER_HOME}/bin
./startup.sh
