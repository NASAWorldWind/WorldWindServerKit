#!/bin/sh 

##
## Copy distribution to /opt/maps/ssgf destination
## FN1
## login: root
## # mount /dev/sdb1 /media
## # cd /containers/tmis/opt/maps
## # tar -xzf /media/ssgf.tgz
## 
## run this script from the container
## # virsh -c lxc:// lxc-enter-namespace tmis /bin/sh
## cd /opt/maps/ssgf
## ./install.sh

cp ssgf.service /etc/systemd/system/
systemctl enable /etc/systemd/system/ssgf.service
systemctl start ssgf.service

## FN8
## launch browser
## http://10.0.1.7:8080/geoserver/web
## select data->Layer Preview
## find the agc:agc_jog_apg and select "OpenLayer" 
