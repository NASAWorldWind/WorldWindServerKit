#!/bin/bash
export SSGF_HOME=`pwd`
#export DOWNLOADS=`pwd`/downloads
#export GEOSERVER_VERSION=2.10
export GEOSERVER_HOME=${SSGF_HOME}/geoserver
#export JAVA_MAJOR=8
#export JAVA_MINOR=111
#export JAVA_BUILD=14
#export JAVA_VERSION=1.${JAVA_MAJOR}.0_${JAVA_MINOR}
#export JAVA_JDK=jdk${JAVA_VERSION}
export JAVA_HOME=${SSGF_HOME}/java
export JAVA_OPTS="-Djava.awt.headless=true -Xmx512m -XX:+UseConcMarkSweepGC"
#export GDAL_VERSION=2.1.0
#export GDAL_HOME=${SSGF_HOME}/gdal
#export GDAL_DATA=${SSGF_HOME}/gdal_1.1.16/data
#export GDAL_LIB=${SSGF_HOME}/gdal_1.1.16/lib
export PATH=${SSGF_HOME}/build/bin:${JAVA_HOME}/bin:${PATH}
#export LD_LIBRARY_PATH=${GDAL_LIB}:${SSGF_HOME}/build/lib:${SSGF_HOME}/build/lib64:${LD_LIBRARY_PATH}
#export PYTHONPATH="$PYTHONPATH:${SSGF_HOME}/build/lib64/python2.7/site-packages"
