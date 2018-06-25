#!/bin/bash
set +x # echo

## ============================================================================
## Runs the JMeter integration tests on a Ubuntu system
## ============================================================================

## --------------------------------------------------------
# Clean up the target folder and build with the default JDK
## --------------------------------------------------------
mvn clean install


## --------------------------------------------------------
# Copy resources into the target folder
## --------------------------------------------------------
GEOSERVER_VER=2.13.0
JDK_MIN_VER="121"
WWSK_RESOURCES="../resources"
# Copy Java resources to the target folder
cp $WWSK_RESOURCES/java/"server-jre-8u"${JDK_MIN_VER}"-linux-x64.tar.gz" target
cp $WWSK_RESOURCES/java/setup-java.sh target
# Copy GDAL resources to the target folder
mkdir -p target/gdal
cp $WWSK_RESOURCES/gdal/geoserver-${GEOSERVER_VER}-gdal-plugin.tgz target/gdal
cp $WWSK_RESOURCES/gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz target/gdal
cp $WWSK_RESOURCES/gdal/gdal-data.tgz target/gdal
cp $WWSK_RESOURCES/gdal/setup-gdal.sh target
# Copy JAI resources to the target folder
cp $WWSK_RESOURCES/jai/jai-1_1_3-lib-linux-amd64.tar.gz target
cp $WWSK_RESOURCES/jai/jai_imageio-1_1-lib-linux-amd64.tar.gz target
cp $WWSK_RESOURCES/jai/setup-jai.sh target


## -------------------------------------------------- 
## Install the Java Server JRE into the target folder
## --------------------------------------------------  
echo "Installing the Java JRE"
pushd target
./setup-java.sh
# Set the JAVA_HOME for the mvn integration tests
OLD_JAVA_HOME=${JAVA_HOME}
export JAVA_HOME=${PWD}/java
popd

# Verify java runtime
mvn --version 

## --------------------------------------------------
# Run the tests on with the configured JRE
## --------------------------------------------------
echo
echo "[INFO] ***********************************"
echo "[INFO] Running the basic integration tests"
echo "[INFO] ***********************************"
echo
mvn verify --show-version -P integration-test 2> basic_test_errors.log
basic_exit_status=$?


## --------------------------------------------------
# Run the tests again with GDAL, ECW and MRSID 
## --------------------------------------------------
# Setup
echo "Installing GDAL"
pushd target
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
mvn verify --show-version -P integration-test-gdal 2> gdal_test_errors.log
gdal_exit_status=$?


## --------------------------------------------------
# Run the tests again with GDAL and JAI
## --------------------------------------------------
echo "Installing Java Advanced Imaging (JAI)"
pushd target
./setup-jai.sh -jf ${PWD}/worldwind-geoserver/WEB-INF/lib
popd
echo
echo "[INFO] ***********************************************"
echo "[INFO] Running the integration tests with GDAL and JAI"
echo "[INFO] ***********************************************"
echo
mvn verify --show-version -P integration-test-jai 2> jai_test_errors.log
jai_exit_status=$?


## --------------------------------------------------
# Cleanup
## --------------------------------------------------
GDAL_LIB_PATH=${OLD_GDAL_LIB_PATH}
GDAL_DATA_PATH=${OLD_GDAL_DATA_PATH}
LD_LIBRARY_PATH=${OLD_LD_LIBRARY_PATH}
JAVA_HOME=${OLD_JAVA_HOME}


## --------------------------------------------------------
# FAil the build (in Travis) if the integration tests fail
## --------------------------------------------------------
exit_status=0
if [ $basic_exit_status -ne 0 ]; then
    echo "[ERROR] -----------------------------------"
    echo "[ERROR] The basic integration tests failed."
    echo "[ERROR] -----------------------------------"
    grep httpSample target/jmeter/logs/error.log     
    exit_status=1
fi
if [ $gdal_exit_status -ne 0 ]; then
    echo "[ERROR] ----------------------------------"
    echo "[ERROR] The GDAL integration tests failed."
    echo "[ERROR] ----------------------------------"
    grep httpSample target/jmeter/logs/error-gdal.log     
    exit_status=1
fi
if [ $jai_exit_status -ne 0 ]; then
    echo "[ERROR] ---------------------------------"
    echo "[ERROR] The JAI integration tests failed."
    echo "[ERROR] ---------------------------------"
    grep httpSample target/jmeter/logs/error-jai.log     
    exit_status=1
fi
exit $exit_status
