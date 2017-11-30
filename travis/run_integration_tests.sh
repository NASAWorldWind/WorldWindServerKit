#!/bin/bash
set +x # echo

## ============================================================================
## Runs the JMeter integration tests on a Ubuntu system
## This script should be run from the root of the WWSK project
## ============================================================================
ROOT_FOLDER=$(pwd)
PROJECT_FOLDER=${ROOT_FOLDER}/worldwind-geoserver
BUILD_FOLDER=${PROJECT_FOLDER}/target

## -------------------------------------------------- 
## Install the Java Server JRE into the target folder
## --------------------------------------------------  
echo "Installing the Java JRE"
# Unzip the JRE from the parent project resources
pushd $BUILD_FOLDER
JAVA_MINOR_VER="121"
tar -xzf ${ROOT_FOLDER}/resources/java/server-jre-8u${JAVA_MINOR_VER}-linux-x64.tar.gz jdk1.8.0_${JAVA_MINOR_VER}/jre
JAVA_HOME=${PWD}/jdk1.8.0_${JAVA_MINOR_VER}/jre
popd

## --------------------------------------------------
# Run the basic tests with the configured JRE
## --------------------------------------------------
echo "Running the integration tests"
pushd $PROJECT_FOLDER
mvn verify -P integration-test
basic_exit_status=$?
popd

## --------------------------------------------------
# Run the tests again with GDAL 
## --------------------------------------------------

# Setup
GEOSERVER_VER=2.11.1
IMAGEIO_EXT_VER=1.1.17
OLD_GDAL_LIB_PATH=${GDAL_LIB_PATH}
OLD_GDAL_DATA_PATH=${GDAL_DATA_PATH}
OLD_LD_LIBRARY_PATH=${LD_LIBRARY_PATH}

# Paths
GEOSERVER_LIB_PATH=${BUILD_FOLDER}"/worldwind-geoserver/WEB-INF/lib"
GDAL_HOME_PATH=${BUILD_FOLDER}"/gdal"
export GDAL_LIB_PATH=${GDAL_HOME_PATH}"/lib"
export GDAL_DATA_PATH=${GDAL_HOME_PATH}"/data"
export LD_LIBRARY_PATH=${GDAL_LIB_PATH}:${LD_LIBRARY_PATH}

# Zip files relative to project folder
GDAL_PLUGIN_ZIP=${ROOT_FOLDER}"/resources/gdal/geoserver-${GEOSERVER_VER}-gdal-plugin.tgz"
GDAL_DATA_ZIP=${ROOT_FOLDER}"/resources/gdal/gdal-data.tgz"
GDAL_NATIVES_ZIP=${ROOT_FOLDER}"/resources/gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz"
GDAL_BINDINGS_ARTIFACT="imageio-ext-gdal-bindings-1.9.2.jar"

## Install the gdal-plugin jars
echo "Installing the GeoServer GDAL coverage format extension"
TEMP_DIR=$(mktemp -d)
pushd $TEMP_DIR
tar -xzf $GDAL_PLUGIN_ZIP 
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
## HACK for JP2ECW and ECW crash (defines an environment var used by the ECW driver)
if [ -z "${NCS_USER_PREFS}" ]; then
    if [ ! -z "${HOME}" ]; then
        export NCS_USER_PREFS=${HOME}/.erm/ncsuserprefs.xml
    else
        export NCS_USER_PREFS=/etc/erm/ncsuserprefs.xml
    fi
fi

echo "Running the integration tests with GDAL"
pushd $PROJECT_FOLDER
mvn verify -P integration-test-gdal
gdal_exit_status=$?
popd

## --------------------------------------------------
# Run the tests again with GDAL and JAI
## --------------------------------------------------

echo "Installing Java Advanced Imaging (JAI)"
pushd $BUILD_FOLDER
gunzip -c ../../resources/jai/jai-1_1_3-lib-linux-amd64.tar.gz | tar xf - && \
mv jai-1_1_3/lib/*.jar $JAVA_HOME/lib/ext/ && \
mv jai-1_1_3/lib/*.so $JAVA_HOME/lib/amd64/ 
gunzip -c ../../resources/jai/jai_imageio-1_1-lib-linux-amd64.tar.gz | tar xf - && \
mv jai_imageio-1_1/lib/*.jar $JAVA_HOME/lib/ext/ && \
mv jai_imageio-1_1/lib/*.so $JAVA_HOME/lib/amd64/ 
popd

echo "Running the integration tests with GDAL and JAI"
pushd $PROJECT_FOLDER
mvn verify -P integration-test-jai
jai_exit_status=$?
popd

## --------------------------------------------------
# Cleanup
## --------------------------------------------------
GDAL_LIB_PATH=${OLD_GDAL_LIB_PATH}
GDAL_DATA_PATH=${OLD_GDAL_DATA_PATH}
LD_LIBRARY_PATH=${OLD_LD_LIBRARY_PATH}


## --------------------------------------------------------
# Fail the build (in Travis) if the integration tests fail
## --------------------------------------------------------
exit_status=0
if [ $basic_exit_status -ne 0 ]; then
    echo "The basic integration tests failed."
    exit_status=1
fi
if [ $gdal_exit_status -ne 0 ]; then
    echo "The GDAL integration tests failed."
    exit_status=1
fi
if [ $jai_exit_status -ne 0 ]; then
    echo "The JAI integration tests failed."
    exit_status=1
fi
exit $exit_status