#!/bin/bash
set +x # echo

## ============================================================================
## Runs the JMeter integration tests on a Ubuntu system
## This script should be run from the root of the WWSK project
## ============================================================================
ROOT_FOLDER=$(pwd)
PROJECT_FOLDER=${ROOT_FOLDER}/worldwind-geoserver
BUILD_FOLDER=${PROJECT_FOLDER}/target
RESOURCES_FOLDER=${ROOT_FOLDER}/resources

## Usage instructions
usage() { 
    echo "Usage:"
    echo "  $0"
    echo "  $0 <options>"
    echo "Options:"
    echo "  -c  perform 'mvn clean install' before testing"
    echo "  -h  display this help text and exit"
}
# Validate command line options.
while getopts :ch opt; do
    case $opt in
    c)  # Install JAI support
        CLEAN=yes
        ;;
    h)  # Help!
        echo "Runs the JMeter Integration Tests"
        usage 
        exit 0
        ;;
    \?) # Invalid syntax
        echo "Invalid option: -${OPTARG}" >&2
        usage
        exit 1
        ;;
    :)  # If no command line args
        echo "Option: -${OPTARG} requires an argument." >$2
        ;;
    esac
done

## --------------------------------------------------------
# Clean up the target folder and build with the default JDK
## --------------------------------------------------------
if [[ $CLEAN ]]; then 
    echo "[INFO] Building  the Java JRE"
    pushd $PROJECT_FOLDER 
    mvn clean install
    popd 
fi

## --------------------------------------------------------
# Copy resources into the target folder
## --------------------------------------------------------
GEOSERVER_VER=2.13.0
JDK_MIN_VER="121"
# Copy Java resources to the target folder
cp $RESOURCES_FOLDER/java/"server-jre-8u"${JDK_MIN_VER}"-linux-x64.tar.gz" $BUILD_FOLDER
cp $RESOURCES_FOLDER/java/setup-java.sh $BUILD_FOLDER
# Copy GDAL resources to the target folder
mkdir -p $BUILD_FOLDER/gdal
cp $RESOURCES_FOLDER/gdal/geoserver-${GEOSERVER_VER}-gdal-plugin.tgz $BUILD_FOLDER/gdal
cp $RESOURCES_FOLDER/gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz $BUILD_FOLDER/gdal
cp $RESOURCES_FOLDER/gdal/gdal-data.tgz $BUILD_FOLDER/gdal
cp $RESOURCES_FOLDER/gdal/setup-gdal.sh $BUILD_FOLDER
# Copy JAI resources to the target folder
cp $RESOURCES_FOLDER/jai/jai-1_1_3-lib-linux-amd64.tar.gz $BUILD_FOLDER
cp $RESOURCES_FOLDER/jai/jai_imageio-1_1-lib-linux-amd64.tar.gz $BUILD_FOLDER
cp $RESOURCES_FOLDER/jai/setup-jai.sh $BUILD_FOLDER

## -------------------------------------------------- 
## Install the Java Server JRE into the target folder
## --------------------------------------------------  
echo "[INFO] Installing the Java JRE"
# Unzip the JRE from the parent project resources
pushd $BUILD_FOLDER
./setup-java.sh
export JAVA_HOME=${PWD}/java
popd

## --------------------------------------------------
# Run the basic tests with the configured JRE
## --------------------------------------------------
echo
echo "[INFO] ***********************************"
echo "[INFO] Running the basic integration tests"
echo "[INFO] ***********************************"
echo
pushd $PROJECT_FOLDER
mvn verify --show-version -P integration-test  2> basic_test_errors.log
basic_exit_status=$?
popd

## --------------------------------------------------
# Run the tests again with GDAL 
## --------------------------------------------------
echo "[INFO] Installing GDAL"
pushd $BUILD_FOLDER
./setup-gdal.sh -gemf ${PWD}/worldwind-geoserver/WEB-INF/lib
GDAL_HOME_PATH=${PWD}"/gdal"
export GDAL_LIB_PATH=${GDAL_HOME_PATH}"/lib"
export GDAL_DATA_PATH=${GDAL_HOME_PATH}"/data"
export LD_LIBRARY_PATH=${GDAL_LIB_PATH}:${LD_LIBRARY_PATH}
popd

## HACK for JP2ECW and ECW crash (defines an environment var used by the ECW driver)
if [ -z "${NCS_USER_PREFS}" ]; then
    if [ ! -z "${HOME}" ]; then
        export NCS_USER_PREFS=${HOME}/.erm/ncsuserprefs.xml
    else
        export NCS_USER_PREFS=/etc/erm/ncsuserprefs.xml
    fi
fi

echo
echo "[INFO] ***************************************"
echo "[INFO] Running the integration tests with GDAL"
echo "[INFO] ***************************************"
echo
pushd $PROJECT_FOLDER
mvn verify --show-version -P integration-test-gdal 2> gdal_test_errors.log
gdal_exit_status=$?
popd

## --------------------------------------------------
# Run the tests again with GDAL and JAI
## --------------------------------------------------
echo "[INFO] Installing Java Advanced Imaging (JAI)"
pushd $BUILD_FOLDER
./setup-jai.sh -jf ${PWD}/worldwind-geoserver/WEB-INF/lib
popd

echo
echo "[INFO] ***********************************************"
echo "[INFO] Running the integration tests with GDAL and JAI"
echo "[INFO] ***********************************************"
echo
pushd $PROJECT_FOLDER
mvn verify --show-version -P integration-test-jai  2> jai_test_errors.log
jai_exit_status=$?
popd

## --------------------------------------------------
# Cleanup
## --------------------------------------------------
GDAL_LIB_PATH=${OLD_GDAL_LIB_PATH}
GDAL_DATA_PATH=${OLD_GDAL_DATA_PATH}
LD_LIBRARY_PATH=${OLD_LD_LIBRARY_PATH}


## --------------------------------------------------
# Fail the build if any of the integration tests fail
## --------------------------------------------------
exit_status=0
if [ $basic_exit_status -ne 0 ]; then
    echo "[ERROR] The basic integration tests failed."
    grep httpSample worldwind-geoserver/target/jmeter/logs/error.log     
    exit_status=1
fi
if [ $gdal_exit_status -ne 0 ]; then
    echo "[ERROR] The GDAL integration tests failed."
    grep httpSample worldwind-geoserver/target/jmeter/logs/error-gdal.log     
    exit_status=1
fi
if [ $jai_exit_status -ne 0 ]; then
    echo "[ERROR] The JAI integration tests failed."
    grep httpSample worldwind-geoserver/target/jmeter/logs/error-jai.log     
    exit_status=1
fi
exit $exit_status
