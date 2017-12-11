#!/bin/bash

# --------------------------------------------------------------------------
# Setup Java JRE and GDAL for the World Wind Server Kit (WWSK) - Linux 
# --------------------------------------------------------------------------

# Run the just setup once, unless 'reinstall' was invoked
if [[ -f .setup && $1 != "reinstall"  ]]; then
    echo "Already setup. To reconfigure run: ./setup.sh reinstall"
else

    # Setup Java
    source ./setup-java.sh $1

    # Setup Java Advanced Imaging
    source ./setup-jai.sh $1

    # Setup JVM memory allocation
    source ./setup-memory.sh

    # Setup GDAL 
    source ./setup-gdal.sh $1
    
    # Create a 'wwsk' symbolic link to this distribution
    if [ -L ../wwsk ]; then
        rm ../wwsk
    fi
    ln -s $(pwd) ../wwsk

    # Create a flag (hidden file) that indicates the setup has already been run
    touch .setup

    echo  "Setup complete"
fi