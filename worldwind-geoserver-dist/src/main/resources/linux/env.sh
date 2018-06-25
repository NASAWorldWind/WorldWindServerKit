#!/bin/bash
# -----------------------------------------------------------------------------
# Environment variables for the World Wind Server Kit (WWSK) - GeoServer 
# -----------------------------------------------------------------------------
export GEOSERVER_HOME=$(pwd)
export GEOSERVER_DATA_DIR=${GEOSERVER_HOME}/data_dir

# -----------------------------------------------------------------------------
# Tune the Java runtime environment. 
# See http://www.oracle.com/technetwork/systems/index-156457.html
# -----------------------------------------------------------------------------
# Set how much heap memory to allocate to GeoServer (min and max)
# The max size of the "older generation" heap is controlled by the -Xms parameter.
# Example for a 2GB allocation: 
#   HEAP="-Xms2048m -Xmx2048m"
# Leave blank to auto-select 25% of system memory
HEAP=

# Set how much memory to set aside for new objects.
# The "young generation" is further divided into an Eden, and Semi-spaces.
NEW="-XX:NewSize=256m -XX:MaxNewSize=256m -XX:SurvivorRatio=2"

# Enable either the Low Pause or Throughput garbage collectors, e.g.,
# "-XX:+UseParNewGC -XX:+UseConcMarkSweepGC" or "-XX:+UseParallelGC" respectively.
GC="-XX:+UseParNewGC -XX:+UseConcMarkSweepGC"

# Add some debug tracing: report each GC event.
DEBUG="-verbose:gc -XX:+PrintTenuringDistribution"

# Allow Java JPDA debugger to be attached to this process via SocketAttach with transport dt_socket on port 8000
#DEBUG=${DEBUG}"-Xdebug -Xrunjdwp:transport=dt_socket,address=8000,server=y,suspend=n "

# Generate a heap dump on out of memory errors
DUMP="-XX:+HeapDumpOnOutOfMemoryError"

# Explicitly ask for the server JVM 
SERVER="-server"

export JAVA_OPTS="$HEAP $NEW $GC $PERM $DEBUG $DUMP $SERVER"
echo "JAVA_OPTS set to ${JAVA_OPTS}"

# -----------------------------------------------------------------------------
# Use the local Java JRE if it was installed
# -----------------------------------------------------------------------------
if [ -d "${GEOSERVER_HOME}"/java ]; then
    export JAVA_HOME=${GEOSERVER_HOME}/java
    export PATH=${JAVA_HOME}/bin:${PATH}
fi
echo "JAVA_HOME set to ${JAVA_HOME}"

# -----------------------------------------------------------------------------
# Use the local GDAL natives if they were installed
# -----------------------------------------------------------------------------
if [ -d "${GEOSERVER_HOME}"/gdal ]; then
    export GDAL_HOME=${GEOSERVER_HOME}/gdal

    export GDAL_DATA=${GDAL_HOME}/data/gdal-data
    echo "GDAL_DATA set to ${GDAL_DATA}"

    export GDAL_LIB=${GDAL_HOME}/lib
    echo "GDAL_LIB set to ${GDAL_LIB}"
    if [[ ! "$LD_LIBRARY_PATH" =~ "${GDAL_LIB}" ]]; then
        export LD_LIBRARY_PATH=${GDAL_LIB}:${LD_LIBRARY_PATH}
        echo "GDAL_LIB prepened to LD_LIBRARY_PATH"
    fi
fi

# -----------------------------------------------------------------------------
# HACK for JP2ECW crash.
#
# The GDAL ECW library has a "w_char" bug that can crash Geoserver with:
# > terminate called after throwing an instance of 'srd::length_error'
# >   what(): basic_string::S_create
# > Aborted (core dumped) 
# See http://gis.stackexchange.com/questions/158828/geoserver-ecw-plugin-problem
#
# Setting the NCS_USER_PREFS environment variable to any value will cause the 
# code to skip the offending branch. This hack sets the variable to the same
# value that the offending branch was attempting to do. See this patch:
# https://github.com/makinacorpus/libecw/blob/master/Source/C/NCSUtil/NCSPrefsXML.cpp.rej
# -----------------------------------------------------------------------------
if [ -z "${NCS_USER_PREFS}" ]; then
    if [ ! -z "${HOME}" ]; then
        export NCS_USER_PREFS=${HOME}/.erm/ncsuserprefs.xml
    else
        export NCS_USER_PREFS=/etc/erm/ncsuserprefs.xml
    fi
fi