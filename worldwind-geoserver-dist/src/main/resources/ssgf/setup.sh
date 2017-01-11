#!/bin/sh 
##
## Copy distribution to /opt/maps/ssgf destination and run setup.sh
## FN1
## login: root
## # mount /dev/sdb1 /media
## # cd /containers/tmis/rootfs/opt/maps
## # tar -xzf /media/ssgf.tgz
## # cd ssgf
## # ./setup.sh
##
## run this script from the container to install the ssgf service
## # virsh -c lxc:// lxc-enter-namespace tmis /bin/sh
## cd /opt/maps/ssgf
## ./install.sh

tar -xzf server-jre-8u111-linux-x64.tar.gz jdk1.8.0_111/jre
ln -s jdk1.8.0_111/jre java

## FN8
## launch browser
## http://10.0.1.7:8080/geoserver/web
## select data->Layer Preview
## find the agc:agc_jog_apg and select "OpenLayer" 
