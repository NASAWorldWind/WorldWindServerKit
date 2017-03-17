#!/bin/sh 
##
## Copy distribution to /opt/maps/ssgf destination and run setup.sh
## FN1
## login: root
## # mount /dev/sdb1 /media
## # cd /containers/tmis/rootfs/opt/maps
## # tar -xzf /media/worldwind-geoserver-<version>.tgz
## # cd worldwind-geoserver-<version>
## # ./setup.sh
##
## run this script from the container to install the ssgf service
## # virsh -c lxc:// lxc-enter-namespace tmis /bin/sh
## cd /opt/maps/worldwind-geoserver-<version>
## ./install.sh

## Install the Java Server JRE
MIN_VER="121"
if [ ! -d jdk1.8.0_${MIN_VER}/jre ]; then
    echo "Installing the Java JRE"
    tar -xzf server-jre-8u${MIN_VER}-linux-x64.tar.gz jdk1.8.0_${MIN_VER}/jre
    ln -s jdk1.8.0_${MIN_VER}/jre java
fi

## Install the GDAL native binaries to the gdal/lib folder
if [ ! -d gdal/lib ]; then
    echo "Installing the GDAL natives and bindings"
    mkdir gdal/lib
    tar -xzf gdal/gdal192-CentOS5.8-gcc4.1.2-x86_64.tar.gz -C gdal/lib
fi

## Install the GDAL data to the gdal/data folder
if [ ! -d gdal/lib ]; then
    echo "Installing the GDAL data"
    mkdir gdal/data
    tar -xzf gdal/gdal-data.tar.gz gdal-data/* -C gdal/data
fi


## FN8
## launch browser
## http://10.0.1.7:8080/geoserver/web
## select data->Layer Preview
## find the agc:agc_jog_apg and select "OpenLayer" 
