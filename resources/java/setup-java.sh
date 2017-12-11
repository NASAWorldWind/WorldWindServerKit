#!/bin/bash
set +x

# -----------------------------------------------------------------------------
# Setup the Java Server JRE 
# -----------------------------------------------------------------------------

## Build the root JDK folder name found in the JDK distribution
JDK_VER="1.8.0"
JDK_MIN_VER="121"
JDK_FOLDER="jdk"${JDK_VER}_${JDK_MIN_VER}
JDK_ZIP="server-jre-8u"${JDK_MIN_VER}"-linux-x64.tar.gz"

## Remove the Java installation if this is a reinstall
if [[ -d $JDK_FOLDER && $1 == "reinstall" ]]; then    
    rm -rf ${JDK_FOLDER}
    # Remove the symbolic link too
    rm java
fi

## Install the Java Server JRE found in the JDK
if [ ! -d ${JDK_FOLDER}/jre ]; then
    echo "Installing the Java Server JRE"
    tar -xzf ${JDK_ZIP} ${JDK_FOLDER}/jre

    # Create a simple symbolic link sans version numbers
    ln -s ${JDK_FOLDER}/jre java
fi

echo  "Java setup complete"
