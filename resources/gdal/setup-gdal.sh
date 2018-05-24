#!/bin/bash
set +x

# -----------------------------------------------------------------------------
# Setup GDAL for the World Wind Server Kit (WWSK) - Linux 
# -----------------------------------------------------------------------------

# GEOSERVER_VER and IMAGEIO_EXT_VER will be updated by an ant-task during the build
GEOSERVER_VER=2.13.0 #Set by ant-task. was: 2.13.0
IMAGEIO_EXT_VER=1.1.20 #Set by ant-task. was: 1.1.20

# Paths
PWD=$(pwd)
GDAL_HOME_PATH=${PWD}"/gdal"
GDAL_LIB_PATH=${GDAL_HOME_PATH}"/lib"
GDAL_DATA_PATH=${GDAL_HOME_PATH}"/data"
GEOSERVER_LIB_PATH=${PWD}"/webapps/geoserver/WEB-INF/lib"
# Zip files
GDAL_PLUGIN_ZIP=${PWD}"/gdal/geoserver-${GEOSERVER_VER}-gdal-plugin.tgz"
GDAL_DATA_ZIP=${PWD}"/gdal/gdal-data.tgz"
GDAL_UBUNTU_NATIVES_ZIP=${PWD}"/gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz"
GDAL_CENTOS_NATIVES_ZIP=${PWD}"/gdal/gdal192-CentOS5.8-gcc4.1.2-x86_64.tar.gz"
if [[ -f $GDAL_UBUNTU_NATIVES_ZIP ]]; then
    GDAL_NATIVES_ZIP=$GDAL_UBUNTU_NATIVES_ZIP
elif [[ -f $GDAL_CENTOS_NATIVES_ZIP ]]; then
    GDAL_NATIVES_ZIP=$GDAL_CENTOS_NATIVES_ZIP
fi  
# Artifacts requiring special treatment:
#
#   The ECW and MrSID artifacts are excluded from general GDAL install and
#   explicitly added later in the script.
#
GDAL_BINDINGS_ARTIFACT="imageio-ext-gdal-bindings-1.9.2.jar"
ECW_ARTIFACTS="imageio-ext-gdalecw-${IMAGEIO_EXT_VER}.jar imageio-ext-gdalecwjp2-${IMAGEIO_EXT_VER}.jar"
MRSID_ARTIFACTS="imageio-ext-gdalmrsid-${IMAGEIO_EXT_VER}.jar imageio-ext-gdalmrsidjp2-${IMAGEIO_EXT_VER}.jar"
IGNORED_ARTIFACTS=${ECW_ARTIFACTS}' '${MRSID_ARTIFACTS}

## Usage instructions
usage() { 
    echo "Usage:"
    echo "  $0            Interactive install"
    echo "  $0 reinstall  Interactive install; removes previous GDAL installation"
    echo "  $0 <options>  Headless install"
    echo "Options:"
    echo "  -g  install GDAL support"
    echo "  -e  install ECW/ECWJP2 support, implies -g"
    echo "  -m  install MRSID support, implies -g"
    echo "  -r  removes previous GDAL installation"
    echo "  -f  GeoServer library folder (defaults to './webapps/geoserver/WEB-INF/lib')"
    echo "  -h  display this help text and exit"
}

# Validate command line options.
# Each time getopts is invoked, it will place the next option in the shell variable $opt.
# If the first character of OPTSTRING is a colon, getopts uses silent error reporting.
# If an invalid option is seen, getopts places the option character found into $OPTARG.
while getopts :gemrhf: opt; do
    case $opt in
    g)  # Install GDAL support
        INSTALL_GDAL=yes
        ;;
    e)  # Install ECW, implies GDAL
        INSTALL_GDAL=yes
        INSTALL_ECW=yes
        ;;
    m)  # Install MrSID, implies GDAL
        INSTALL_GDAL=yes
        INSTALL_MRSID=yes
        ;;
    r)  # Reinstall; removes previous install
        REINSTALL=yes
        ;;
    h)  # Help!
        echo "Installs the Geospatial Data Abstraction Library (GDAL)"
        usage 
        exit 0
        ;;
    f) # GeoServer library folder
        GEOSERVER_LIB_PATH=$OPTARG
        ;;
    \?) # Invalid syntax
        echo "Invalid option: -${OPTARG}" >&2
        usage
        exit 1
        ;;
    :)  # If no command line args
        echo "Option: -${OPTARG} requires an argument." >$2
        ;;
    esac
done

# Place in interactive mode if no command line arguments
if [[ ! "$*" ]]; then
    INTERACTIVE=yes
fi

# Check if "reinstall" is contained in the command line arguments
if [[ "$*" =~ "reinstall"  ]]; then
    REINSTALL=yes
    INTERACTIVE=yes
fi
    
# -----------------------------
# Handle previous installation
# -----------------------------
if [[ -d $GDAL_LIB_PATH ]]; then 
    if [[ $REINSTALL ]]; then
        # Remove previous installation
        echo "Removing previous GDAL installation"
        rm -r $GDAL_LIB_PATH
    else     
        # Otherwise exit here if GDAL is already installed 
        echo "GDAL already setup!"
        exit 0
    fi
fi

# ----------------------------
# Display interactive menus
# ---------------------------- 
if [[ $INTERACTIVE ]]; then  
    # Display a simple menu to install or skip GDAL
    echo
    echo "GDAL Image Formats:"
    PS3="Install GDAL Image Formats extension? "
    select GDAL_CHOICE in Install Skip Help
    do 
        case "$GDAL_CHOICE" in
        (Install) 
            INSTALL_GDAL=yes
            break 
            ;;
        (Skip) 
            break 
            ;;
        (Help) 
            echo "GDAL Image Formats Help"
            echo "======================="
            echo "GeoServer can leverage the ImageI/O-Ext GDAL libraries to read "
            echo "selected coverage formats. GDAL is able to read many formats, "
            echo "but for the moment GeoServer supports only a few general interest "
            echo "formats and those that can be legally redistributed and operated "
            echo "in an open source server."
            echo "The following image formats can be read by GeoServer using GDAL:"
            echo "  DTED, Military Elevation Data (.dt0, .dt1, .dt2)"
            echo "  EHdr, ESRI .hdr Labelled"
            echo "  ENVI, ENVI .hdr Labelled Raster"
            echo "  HFA, Erdas Imagine (.img)"
            echo "  JPEG2000 (.jp2, .j2k)"
            echo "  NITF"
            echo "  AIG, Arc/Info Binary Grid"
            echo "  MrSID, Multi-resolution Seamless Image Database [requires MrSID license]"
            echo "  ECW, ERDAS Compressed Wavelets (.ecw) [requires ECW license]"
            echo "  JP2MrSID (.jp2, .j2k) [requires MrSID license]"
            echo "  JP2ECW, JPEG2000 (.jp2, .j2k) [requires ECW license]"
            echo "  JP2KAK, JPEG2000 (.jp2, .j2k) [requires an additional Kakadu license]"
            ;;
        (*) 
            echo "Invalid selection. Try again (1..3)!" 
            ;;
        esac
    done         
    if [[ $INSTALL_GDAL ]]; then

        ## Optionally add MrSID support from LizardTech
        echo
        echo "MrSID Support from LizardTech:"
        PS3="Install MrSID drivers? "
        select MRSID_CHOICE in Install Skip Help
        do 
            case "$MRSID_CHOICE" in
            (Install) 
                # Proceed to license acceptance
                break ;;
            (Skip) 
                echo "Skipping MrSID installation"
                break ;;
            (Help) 
                echo "MrSID Support Help"
                echo "=================="
                echo "The MrSID driver adds the capability to read *.sid files."
                echo "and JPEG2000 imagery with MrSID compression."
                echo "It uses a proprietary license from LizardTech."
                ;;
            (*) 
                echo "Invalid selection. Try again (1..3)!" 
                ;;
            esac
        done  
        if [[ $MRSID_CHOICE == Install ]]; then
            echo
            echo "To proceed, you must agree to the LizardTech MrSID license:"
            PS3="License? "
            select LICENSE_CHOICE in Accept Decline View
            do 
                case "$LICENSE_CHOICE" in
                (Accept) 
                    # Will proceed with MrSID installation
                    INSTALL_MRSID=yes
                    break ;;
                (Decline) 
                    echo "Skipping MRSID installation"
                    break ;;
                (View) 
                    # Display license
                    echo "MrSID License Text"
                    echo "=================="
                    cat gdal/MrSID_decoderSDK_license.txt
                    echo
                    echo "The full license is available at ${PWD}/gdal/MRSIDLicense.rtf"
                    ;;
                (*) 
                    echo "Invalid selection. Try again (1..3)!" 
                    ;;
                esac
            done  
        fi

        ## Optionally add ERDAS Compressed Wavelets (ECW) support 
        echo
        echo "ERDAS Compressed Wavelets (ECW) Support:"
        PS3="Install ECW drivers? "
        select ECW_CHOICE in Install Skip Help
        do 
            case "$ECW_CHOICE" in
            (Install) 
                # Proceed to license acceptance
                break ;;
            (Skip) 
                echo "Skipping ECW installation"
                break ;;
            (Help) 
                echo "ECW Support Help"
                echo "================"
                echo "The ECW driver adds the capability to decode JPEG2000 *.jp2 files"
                echo "compressed with ECW (Erdas Compressed Wavelet) compression."
                echo "It uses a proprietary license from Erdas, Inc.  A license"
                echo "must be purchased from Erdas to use ECW in a Server application."
                ;;
            (*) 
                echo "Invalid selection. Try again (1..3)!" ;;
            esac
        done  
        if [[ $ECW_CHOICE == Install ]]; then
            echo
            echo "To proceed, you must agree to the ECW/JP2 CODEC SDK End-User License Agreement."
            echo "To support ECW Decode in a Server application you need to BUY a license from ERDAS."
            PS3="License? "
            select LICENSE_CHOICE in Accept Decline View
            do 
                case "$LICENSE_CHOICE" in
                (Accept) 
                    # Will proceed with ECW installation
                    INSTALL_ECW=yes
                    break ;;
                (Decline) 
                    echo "Declined. Skipping ECW installation"
                    break ;;
                (View) 
                    # Display license
                    cat gdal/ECWEULA.txt | less
                    echo
                    echo "The full license is available at ${PWD}/gdal/ECWEULA.txt"
                    ;;
                (*) 
                    echo "Invalid selection. Try again (1..3)!" 
                    ;;
                esac
            done  
        fi
    fi
fi
    

# -----------------------------
# Perform the GDAL installation
# -----------------------------
if [[ $INSTALL_GDAL ]]; then
    ## Install the GDAL extention and the GDAL native binaries.

    # -----------------------------------------------------------------
    # Proceed with installation, as documented here: 
    #   http://docs.geoserver.org/latest/en/user/data/raster/gdal.html,
    # but exclude the ECW or MrSID support at this stage.
    # -----------------------------------------------------------------

    ## Install the gdal-plugin jars
    echo "Installing the GeoServer GDAL coverage format extension (excluding ECW and MrSID)"
    # Unzip the files into a temp folder
    TEMP_DIR=$(mktemp -d)
    pushd $TEMP_DIR > /dev/null
    tar -xzf $GDAL_PLUGIN_ZIP 
    # Delete the proprietary and problem jars
    for file in $IGNORED_ARTIFACTS; do rm $file; done
    # Copy remaining jars to GeoServer 
    cp *.jar $GEOSERVER_LIB_PATH
    # Clean up
    popd > /dev/null; rm -rf $TEMP_DIR

    ## Install GDAL natives (platform specific)
    echo "Installing the GDAL natives"
    mkdir -p $GDAL_LIB_PATH
    # Unzip to the gdal/lib folder
    tar -xzf $GDAL_NATIVES_ZIP -C $GDAL_LIB_PATH
    # Copy the bindings jar from the javainfo folder to the geoserver/lib folder
    cp ${GDAL_LIB_PATH}/javainfo/${GDAL_BINDINGS_ARTIFACT} $GEOSERVER_LIB_PATH


    ## Install the GDAL data to the gdal/data folder
    if [[ ! -d $GDAL_DATA_PATH  || $REINSTALL ]]; then
        if [[ $1 == "reinstall" && -d $GDAL_DATA_PATH ]]; then
            echo "Removing previous GDAL data"
            rm -rf $GDAL_DATA_PATH
        fi
        echo "Installing the GDAL data"
        mkdir -p $GDAL_DATA_PATH
        tar -xzf $GDAL_DATA_ZIP -C $GDAL_DATA_PATH
        chmod a+rw -R ${GDAL_DATA_PATH}/*
    fi    

    ## Optionally add MrSID support from LizardTech
    if [[ $INSTALL_MRSID ]]; then
        # MrSID support is already in the GDAL natives.
        # Here we simply add the jars to enable the MrSID support.
        echo "You have accepted the MrSID license. Installing the MRSID support from LizardTech"
        TEMP_DIR=$(mktemp -d)
        pushd $TEMP_DIR > /dev/null
        tar -xzf $GDAL_PLUGIN_ZIP
        for file in $MRSID_ARTIFACTS; do cp $file $GEOSERVER_LIB_PATH; done
        popd > /dev/null; rm -rf $TEMP_DIR
    fi

    ## Optionally add ERDAS Compressed Wavelets (ECW) support 
    if [[ $INSTALL_ECW ]]; then
        # ECW/JP2 support is already in the GDAL natives.
        # Here we simply add the jars that enable the ECW support.
        echo "You have accepted the ECW license. Installing the ECW/JP2 support from Erdas"
        TEMP_DIR=$(mktemp -d)
        pushd $TEMP_DIR > /dev/null
        tar -xzf $GDAL_PLUGIN_ZIP
        for file in $ECW_ARTIFACTS; do cp $file $GEOSERVER_LIB_PATH; done
        popd > /dev/null; rm -rf $TEMP_DIR
    fi
    echo  "GDAL setup complete"
else
    echo  "GDAL setup skipped"
    # Create an empty gdal/lib folder to indicate the skipped installation
    if [[ ! -d $GDAL_LIB_PATH ]]; then
        mkdir -p $GDAL_LIB_PATH
    fi
fi


