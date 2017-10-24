#!/bin/bash
set -x # echo

## ============================================================================
## Runs the JMeter integration tests on a Ubuntu system
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
# Run the tests on with the configured JRE
## --------------------------------------------------
echo "Running the integration tests"
mvn verify -P integration-test

## --------------------------------------------------
# Run the tests again with GDAL 
## --------------------------------------------------
GEOSERVER_VER=2.11.1
IMAGEIO_EXT_VER=1.1.17
PROJECT_FOLDER=$(pwd)
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

echo "Running the integration tests with GDAL"
mvn verify -P integration-test-gdal


## --------------------------------------------------
# Run the tests again with GDAL and JAI
## --------------------------------------------------
echo "Installing Java Advanced Imaging (JAI)"
pushd target
gunzip -c ../../resources/jai/jai-1_1_3-lib-linux-amd64.tar.gz | tar xf - && \
mv jai-1_1_3/lib/*.jar $JAVA_HOME/lib/ext/ && \
mv jai-1_1_3/lib/*.so $JAVA_HOME/lib/amd64/ 
gunzip -c ../../resources/jai/jai_imageio-1_1-lib-linux-amd64.tar.gz | tar xf - && \
mv jai_imageio-1_1/lib/*.jar $JAVA_HOME/lib/ext/ && \
mv jai_imageio-1_1/lib/*.so $JAVA_HOME/lib/amd64/ 
popd

echo "Running the integration tests with GDAL and JAI"
mvn verify -P integration-test-jai

# Uncomment to run WWSK in order validate JAI in the Web Admin interface
#mvn jetty:run -P integration-test-jai

