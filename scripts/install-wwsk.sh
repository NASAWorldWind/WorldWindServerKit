#!/bin/sh
#set -x 

## ----------------------------------------------------------------------------
## This script installs WWSK into a specified folder and runs the setup script. 
## ----------------------------------------------------------------------------

## Parse arguments
if [ $# -lt 2 ]; then
    echo "$0: missing argument(s)"
    echo "Usage: $0 SOURCE DEST [TARGET]"
    echo "      SOURCE:   source WWSK distribution file (.tgz) to extract"
    echo "      DEST:     destination folder"
    echo "      TARGET:   new name of unzipped folder; if not defined, the root folder in the .tgz is used"
    echo "The DEST folder will be created if it doesn't exist"
    echo "The previous contents of the TARGET folder will be deleted"
    echo "Examples:"
    echo "  install-wwsk worldwind-geoserver-1.0.0-Linux64.tgz /opt/maps/wwsk"
    echo "      Copies the root folder of .tgz to /opts/maps/wwsk"
    echo "  install-wwsk worldwind-geoserver-1.0.0-Linux64.tgz /opt/maps wwsk"
    echo "      Copies the root folder of .tgz to /opts/maps and renames it to wwsk"
    exit
else
    SOURCE=$1
    DEST=$2
    TARGET=$3
fi


## Make the destination folder
if [ ! -d "$DEST" ]; then
    mkdir -p $DEST
    if [ $? != 0 ]; then
        echo "Error: Failed to create $DEST folder"
        exit
    fi
fi

## Create a temporary folder to extract the SOURCE
TEMPDIR=$(mktemp -d)
if [ $? != 0 ]; then
    echo "mktemp: Error creating a temporary folder"
    exit
fi

## Unzip to the TEMPDIR folder
echo "Extracting $SOURCE to $TEMPDIR"
tar -xzf $SOURCE -C $TEMPDIR
if [ $? != 0 ]; then
    echo "tar: Error extrating the $SOURCE file"
    exit
fi

## Get the name of the root folder in the extracted files 
## and assert there is only one folder
CONTENTS=$(ls -1 $TEMPDIR)
COUNT=$(echo "$CONTENTS" | wc -l )
if [ $COUNT -gt 1 ]; then
    echo "$TEMPDIR contains more than one root folder, cannot move to $DEST folder"
    exit
elif [ $COUNT -lt 1 ]; then
    echo "$TEMPDIR is empty, nothing move to $DEST folder"
    exit    
elif [ ! -d ${TEMPDIR}/${CONTENTS} ]; then
    echo "$CONTENTS is not a folder. Is this a WWSK distribution? Aborting the installation."
    exit    
fi

## If target wasn't specified, then use the extracted folder name
if [ -z $TARGET ]; then
    TARGET=$CONTENTS
fi

## Rename the extracted folder if a TARGET name was specified
if [ $CONTENTS != $TARGET ]; then
    echo "Renaming $CONTENTS folder to $TARGET in $TEMPDIR"
    mv ${TEMPDIR}/${CONTENTS} ${TEMPDIR}/${TARGET}
    if [ $? != 0 ]; then
        echo "mv: Failed to rename $CONTENTS to $TARGET"
        exit
    fi
fi

## Remove the previous contents of TARGET folder
if [ -d ${DEST}/${TARGET} ]; then
    echo "Removing ${TARGET} folder in $DEST"
    rm -rf ${DEST}/$TARGET
    if [ $? != 0 ]; then
        echo "rm: Failed to remove ${DEST}/${TARGET} folder"
        exit
    fi
fi

## Move the extracted folder to DEST
echo "Moving $TARGET folder from $TEMPDIR to $DEST"
mv ${TEMPDIR}/${TARGET} ${DEST}
if [ $? != 0 ]; then
    echo "mv: Error moving $TARGET to $DEST"
    exit
fi



## Remove the TEMPDIR folder
rm -rf $TEMPDIR
if [ $? != 0 ]; then
    echo "rm: Failed to remove $TEMPDIR folder"
    exit
fi

## Install the Java Runtime Environment (JRE) and GDAL
echo "Running setup..."
cd ${DEST}/${TARGET}
./setup.sh
