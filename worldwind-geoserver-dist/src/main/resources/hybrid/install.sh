#!/bin/sh 

##
## Copy distribution to /opt/maps/wwsk destination
## FN1
## login: root
## # mount /dev/sdb1 /media
## # cd /containers/tmis/opt/maps
## # tar -xzf /media/worldwind-geoserver-<version>.tgz
## 
## run this script from the container
## # virsh -c lxc:// lxc-enter-namespace tmis /bin/sh
## cd /opt/maps/wwsk
## ./install.sh

cp wwsk.service /etc/systemd/system/
systemctl enable /etc/systemd/system/wwsk.service
systemctl start wwsk.service

## FN8
## launch browser
## http://10.0.1.7:8080/geoserver/web
## select data->Layer Preview
## find the agc:agc_jog_apg and select "OpenLayer" 
