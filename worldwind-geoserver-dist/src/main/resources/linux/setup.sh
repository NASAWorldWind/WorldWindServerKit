#!/bin/bash

# -----------------------------------------------------------------------------
# Run the just setup once, unless 'reinstall' is invoked
# -----------------------------------------------------------------------------
if [[ -f .setup && $1 != "reinstall"  ]]; then
    echo "Already setup. To reinstall run: ./setup.sh reinstall"
else
    # -----------------------------------------------------------------------------
    # Setup Java JRE and GDAL for the World Wind Server Kit (WWSK) - Linux 
    # -----------------------------------------------------------------------------
    JAVA_MIN_VER="121"
    GEOSERVER_VER="2.10.0"
    IMAGEIO_EXT_VER="1.1.16"
    IMAGEIO_EXT_ZIP="gdal/imageio-ext-${IMAGEIO_EXT_VER}-jars.zip"
    GDAL_PLUGIN_ZIP="gdal/geoserver-${GEOSERVER_VER}-gdal-plugin.zip"
    GDAL_UBUNTU_NATIVES_ZIP="gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz"
    GDAL_CENTOS_NATIVES_ZIP="gdal/gdal192-CentOS5.8-gcc4.1.2-x86_64.tar.gz"
    GDAL_DATA_ZIP="gdal/gdal-data.tar.gz"
    GDAL_LIB_PATH="gdal/lib"
    GDAL_DATA_PATH="gdal/data"
    GEOSERVER_LIB_PATH="webapps/geoserver/WEB-INF/lib"
    ECW_ARTIFACTS="imageio-ext-gdalecw-${IMAGEIO_EXT_VER}.jar imageio-ext-gdalecwjp2-${IMAGEIO_EXT_VER}.jar"
    MRSID_ARTIFACTS="imageio-ext-gdalmrsid-${IMAGEIO_EXT_VER}.jar imageio-ext-gdalmrsidjp2-${IMAGEIO_EXT_VER}.jar"

    ## Install the Java Server JRE
    if [ ! -d jdk1.8.0_${JAVA_MIN_VER}/jre ]; then
        echo "Installing the Java JRE"
        tar -xzf server-jre-8u${JAVA_MIN_VER}-linux-x64.tar.gz jdk1.8.0_${JAVA_MIN_VER}/jre
        ln -s jdk1.8.0_${JAVA_MIN_VER}/jre java
    fi

    ## Install the ImageIO-Ext extention and the GDAL native binaries.
    ## E.g., install geoserver-2.10.0-gdal-plugin.zip and imageio-ext-1.1.16-jars.zip
    if [[ -f $GDAL_UBUNTU_NATIVES_ZIP ]]; then
        GDAL_NATIVES_ZIP=$GDAL_UBUNTU_NATIVES_ZIP
    elif [[ -f $GDAL_CENTOS_NATIVES_ZIP ]]; then
        GDAL_NATIVES_ZIP=$GDAL_CENTOS_NATIVES_ZIP
    fi   
    if [[ ! -d gdal/lib || $1 == "reinstall" ]]; then    
        # Display a simple menu to install or skip GDAL
        echo
        echo "GDAL Image Formats:"
        PS3="Install GDAL Image Formats extension? "
        select GDAL_CHOICE in Install Skip Help
        do 
            case "$GDAL_CHOICE" in
            (Install) 
                if [[ $1 == "reinstall" && -d $GDAL_LIB_PATH ]]; then
                    echo "Removing previous GDAL installation"
                    rm -r $GDAL_LIB_PATH
                fi
                # Proceed with installation, as documented here: 
                #   http://docs.geoserver.org/latest/en/user/data/raster/gdal.html,
                # but exclude the ECW or MrSID support at this stage.
                echo "Installing the GeoServer GDAL coverage format extension"
                unzip -o $GDAL_PLUGIN_ZIP -x $ECW_ARTIFACTS $MRSID_ARTIFACTS -d $GEOSERVER_LIB_PATH

                echo "Installing the ImageIO-Ext extension (excluding ECW and MrSID)"
                unzip -o $IMAGEIO_EXT_ZIP -x $ECW_ARTIFACTS $MRSID_ARTIFACTS  -d $GEOSERVER_LIB_PATH

                echo "Installing the GDAL natives"
                mkdir -p $GDAL_LIB_PATH
                tar -xzf $GDAL_NATIVES_ZIP -C $GDAL_LIB_PATH

                break 
                ;;
            (Skip) 
                echo "Skipping GDAL installation"
                # Create an empty gdal/lib folder to indicate the skipped installation
                if [[ ! -d $GDAL_DATA_PATH ]]; then
                    mkdir -p $GDAL_LIB_PATH
                fi
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

        ## Install the GDAL data to the gdal/data folder
        if [[ $GDAL_CHOICE == Install ]]; then
            if [[ ! -d $GDAL_DATA_PATH  || $1 == "reinstall" ]]; then
                if [[ $1 == "reinstall" && -d $GDAL_DATA_PATH ]]; then
                    echo "Removing previous GDAL data"
                    rm -r $GDAL_DATA_PATH
                fi
                echo "Installing the GDAL data"
                mkdir -p $GDAL_DATA_PATH
                tar -xzf $GDAL_DATA_ZIP -C $GDAL_DATA_PATH
            fi    
        fi

        # Add MrSID support from LizardTech
        if [[ $GDAL_CHOICE == Install ]]; then
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
                        # Proceed with installation. MrSID support is already in the natives.
                        # Here we simply add the jars to enable the MrSID support.
                        echo "Installing the MRSID support from LizardTech"
                        unzip -o $IMAGEIO_EXT_ZIP $MRSID_ARTIFACTS -d $GEOSERVER_LIB_PATH
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
        fi

        # Add ERDAS Compressed Wavelets (ECW) support 
        if [[ $GDAL_CHOICE == Install ]]; then
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
                        # Proceed with installation. ECW/JP2 support is already in the natives.
                        # Here we simply add the jars that enable the ECW support.
                        echo "Accepted. Installing the ECW/JP2 support from Erdas"
                        unzip -o $IMAGEIO_EXT_ZIP $ECW_ARTIFACTS -d $GEOSERVER_LIB_PATH
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

    # Create a 'wwsk' symbolic link to this distribution
    if [ -L ../wwsk ]; then
        rm ../wwsk
    fi
    ln -s $(pwd) ../wwsk

    # Create a flag (hidden file) that indicates the setup has already been run
    touch .setup

    echo  "Setup complete"
fi