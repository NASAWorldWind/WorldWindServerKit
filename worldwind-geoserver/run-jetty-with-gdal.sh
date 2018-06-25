#!/bin/bash
set +x # echo

## ============================================================================
## Runs Jetty with the integration test configuration
## ============================================================================

## --------------------------------------------------------
# Clean up the target folder and build with the default JDK
## --------------------------------------------------------
mvn clean install

## -------------------------------------------------- 
## Install the Java Server JRE into the target folder
## --------------------------------------------------  
echo "Installing the Java JRE"
# Unzip the JRE from the parent project resources
pushd target
JAVA_MINOR_VER="121"
tar -xzf ../../resources/java/server-jre-8u${JAVA_MINOR_VER}-linux-x64.tar.gz jdk1.8.0_${JAVA_MINOR_VER}/jre
JAVA_HOME=${PWD}/jdk1.8.0_${JAVA_MINOR_VER}/jre
popd

## --------------------------------------------------
# Run the tests again with GDAL 
## --------------------------------------------------
# Setup
GEOSERVER_VER=2.13.0
IMAGEIO_EXT_VER=1.1.20
PROJECT_FOLDER=$(pwd)
OLD_GDAL_LIB_PATH=${GDAL_LIB_PATH}
OLD_GDAL_DATA_PATH=${GDAL_DATA_PATH}
OLD_LD_LIBRARY_PATH=${LD_LIBRARY_PATH}
# Paths
GEOSERVER_LIB_PATH=${PROJECT_FOLDER}"/target/worldwind-geoserver/WEB-INF/lib"
GDAL_HOME_PATH=${PROJECT_FOLDER}"/target/gdal"
export GDAL_LIB_PATH=${GDAL_HOME_PATH}"/lib"
export GDAL_DATA_PATH=${GDAL_HOME_PATH}"/data"
export LD_LIBRARY_PATH=${GDAL_LIB_PATH}:${LD_LIBRARY_PATH}
# Zip files relative to project folder
IMAGEIO_EXT_ZIP=${PROJECT_FOLDER}"/../resources/gdal/imageio-ext-${IMAGEIO_EXT_VER}-jars.tgz"
GDAL_PLUGIN_ZIP=${PROJECT_FOLDER}"/../resources/gdal/geoserver-${GEOSERVER_VER}-gdal-plugin.tgz"
GDAL_DATA_ZIP=${PROJECT_FOLDER}"/../resources/gdal/gdal-data.tgz"
GDAL_NATIVES_ZIP=${PROJECT_FOLDER}"/../resources/gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz"
GDAL_BINDINGS_ARTIFACT="imageio-ext-gdal-bindings-1.9.2.jar"
## Install the gdal-plugin jars
echo "Installing the GeoServer GDAL coverage format extension"
TEMP_DIR=$(mktemp -d)
pushd $TEMP_DIR
tar -xzf $GDAL_PLUGIN_ZIP 
cp *.jar $GEOSERVER_LIB_PATH
popd; rm -rf $TEMP_DIR
## Install the imageio-ext jars
echo "Installing the ImageIO-Ext extension"
TEMP_DIR=$(mktemp -d)
pushd $TEMP_DIR
tar -xzf $IMAGEIO_EXT_ZIP
cp *.jar $GEOSERVER_LIB_PATH
popd; rm -rf $TEMP_DIR
## Install GDAL natives (platform specific)
echo "Installing the GDAL natives"
mkdir -p $GDAL_LIB_PATH
tar -xzf $GDAL_NATIVES_ZIP -C $GDAL_LIB_PATH
# Copy the bindings jar from the javainfo folder to the geoserver/lib folder
cp ${GDAL_LIB_PATH}/javainfo/${GDAL_BINDINGS_ARTIFACT} $GEOSERVER_LIB_PATH
## Install GDAL data
echo "Installing the GDAL data"
mkdir -p $GDAL_DATA_PATH
tar -xzf $GDAL_DATA_ZIP -C $GDAL_DATA_PATH
chmod a+rw -R ${GDAL_DATA_PATH}/*

# -----------------------------------------------------------------------------
# HACK for JP2ECW and ECW crash.
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
## --------------------------------------------------
# Uncomment to run WWSK in order setup tests
## --------------------------------------------------
mvn jetty:run 


## --------------------------------------------------
# Cleanup
## --------------------------------------------------
GDAL_LIB_PATH=${OLD_GDAL_LIB_PATH}
GDAL_DATA_PATH=${OLD_GDAL_DATA_PATH}
LD_LIBRARY_PATH=${OLD_LD_LIBRARY_PATH}
