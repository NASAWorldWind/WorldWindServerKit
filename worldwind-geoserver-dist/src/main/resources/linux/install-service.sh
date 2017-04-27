#!/bin/sh 
## ================================================
## Install the "wwsk" (WorldWindServerKit) service
## ================================================

## Establish init daemon is systemd
echo "Determining if the init daemon is systemd"
which systemctl
if [ $? -ne 0 ]; then
    echo "Sorry, this script only works with the systemd daemon."
    echo "You'll have to manually configure the service for your OS.
    exit 1
fi

## Ensure we have privileges to start/stop services and to copy files
if [ "$(whoami)" != "root" ]; then
    echo "Sorry, you need root privileges."
    echo "Try: sudo ./install-service.sh"
    exit 1
fi

## The interactive setup should be run (once) before the service is started.
./setup.sh

if [ ! -f wwsk.service ]; then
    echo "Error: \'wwsk.service\' file was not found in current folder.
    echo "The \'wwsk\' service was not installed.
    exit 1
fi
if [ ! -f run.sh ]; then
    echo "Error: \'run.sh\' script was not found in current folder.
    echo "The \'wwsk\' service was not installed.
    exit 1
fi
if [ ! -f stop.sh ]; then
    echo "Error: \'stop.sh\' script not found in current folder.
    echo "The \'wwsk\' service was not installed.
    exit 1
fi

## Using the s/PATTERN/REPLACEMENT/ regexp syntax with sed to update the service file.
## The ^ and $ are beginning/end-of-line markers; .* matches anything.
## We're using the s;;; pattern instead of s/// to avoid conflicts with file paths.
echo "Updating the wwsk.service description file"
CURRENT_DIR=$(pwd)
sed -i 's;^ExecStart=.*$;ExecStart='${CURRENT_DIR}'/run.sh;' wwsk.service
sed -i 's;^ExecStop=.*$;ExecStop='${CURRENT_DIR}'/stop.sh;' wwsk.service
sed -i 's;^WorkingDirectory=.*$;WorkingDirectory='${CURRENT_DIR}';' wwsk.service

## Deactivate exiting service
echo "Deactivating the previous wwsk.service"
systemctl stop wwsk.service
systemctl disable wwsk.service

## Copy the service file
cp wwsk.service /etc/systemd/system/

## Activate the service
echo "Activating the updated wwsk.service"
systemctl enable /etc/systemd/system/wwsk.service
systemctl start wwsk.service

echo "GeoServer should be running (shortly)"