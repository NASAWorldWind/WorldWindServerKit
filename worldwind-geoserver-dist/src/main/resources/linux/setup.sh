#!/bin/bash
# -----------------------------------------------------------------------------
# Setup Java JRE and GDAL for the World Wind Server Kit (WWSK) - Linux
# -----------------------------------------------------------------------------

## Install the Java Server JRE
MIN_VER="121"
if [ ! -d jdk1.8.0_${MIN_VER}/jre ]; then
    echo "Installing the Java JRE"
    tar -xzf server-jre-8u${MIN_VER}-linux-x64.tar.gz jdk1.8.0_${MIN_VER}/jre
    ln -s jdk1.8.0_${MIN_VER}/jre java
fi

## Install the GDAL native binaries to the gdal/lib folder
if [ ! -d gdal/lib ]; then
    echo "Installing the GDAL natives"
    mkdir gdal/lib
    tar -xzf gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz -C gdal/lib
fi

## Install the GDAL data to the gdal/data folder
if [ ! -d gdal/data ]; then
    echo "Installing the GDAL data"
    mkdir gdal/data
    tar -xzf gdal/gdal-data.tar.gz -C gdal/data
fi