#!/bin/bash
# -----------------------------------------------------------------------------
# Environment variables for the World Wind Server Kit (WWSK) - GeoServer
# -----------------------------------------------------------------------------
export GEOSERVER_HOME=`pwd`
export GEOSERVER_DATA_DIR=${GEOSERVER_HOME}/data_dir

# -----------------------------------------------------------------------------
# Tune the Java runtime environment. 
# See http://www.oracle.com/technetwork/systems/index-156457.html
# -----------------------------------------------------------------------------
# Set how much heap memory to allocate to GeoServer (min and max)
# The max size of the "older generation" heap is controlled by the -Xms parameter.
HEAP="-Xms2048m -Xmx2048m"

# Set how much memory to set aside for new objects.
# The "young generation" is further divided into an Eden, and Semi-spaces.
NEW="-XX:NewSize=256m -XX:MaxNewSize=256m -XX:SurvivorRatio=2"

# Enable either the Low Pause or Throughput garbage collectors, e.g.,
# "-XX:+UseParNewGC +UseConcMarkSweepGC" or "-XX:+UseParallelGC" respectively.
GC="-XX:+UseParallelGC"

# Add some debug tracing: report each GC event.
DEBUG="-verbose:gc -XX:+PrintTenuringDistribution"

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

# -----------------------------------------------------------------------------
# Use the local GDAL natives if they were installed
# -----------------------------------------------------------------------------
if [ -d "${GEOSERVER_HOME}"/gdal ]; then
    export GDAL_HOME=${GEOSERVER_HOME}/gdal

    export GDAL_DATA=${GDAL_HOME}/data
    echo "GDAL_DATA set to ${GDAL_DATA}"

    export GDAL_LIB=${GDAL_HOME}/lib
    echo "GDAL_LIB set to ${GDAL_LIB}"
    if [[ ! "$LD_LIBRARY_PATH" =~ "${GDAL_LIB}" ]]; then
        export LD_LIBRARY_PATH=${GDAL_LIB}:${LD_LIBRARY_PATH}
        echo "GDAL_LIB prepened to LD_LIBRARY_PATH"
    fi
fi
