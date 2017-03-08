#!/bin/sh 
##

## Install the Java Server JRE
tar -xzf server-jre-8u111-linux-x64.tar.gz jdk1.8.0_111/jre
ln -s jdk1.8.0_111/jre java

## Install the GDAL native binaries to the gdal/lib folder
tar -xzf gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz -C gdal/lib

## Install the GDAL data to the gdal/data folder
tar -xzf gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz -C gdal/data
