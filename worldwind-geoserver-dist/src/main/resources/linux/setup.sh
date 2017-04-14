#!/bin/bash
# -----------------------------------------------------------------------------
# Setup Java JRE and GDAL for the World Wind Server Kit (WWSK) - Linux
# -----------------------------------------------------------------------------

## Install the Java Server JRE
MIN_VER="121"
if [ ! -d jdk1.8.0_${MIN_VER}/jre ]; then
    echo "Installing the Java JRE"
    tar -xzf server-jre-8u${MIN_VER}-linux-x64.tar.gz jdk1.8.0_${MIN_VER}/jre
    ln -s jdk1.8.0_${MIN_VER}/jre java
fi

## Install the GDAL native binaries to the gdal/lib folder
if [[ ! -d gdal/lib || $1 == "reinstall" ]]; then    
    # Display a simple menu to install or skip GDAL
    echo
    echo "GDAL Installation:"
    PS3="Install GDAL native drivers? "
    select GDAL_CHOICE in Install Skip
    do 
        case "$GDAL_CHOICE" in
        (Install) 
            if [[ $1 == "reinstall" && -d gdal/lib ]]; then
                echo "Removed previous GDAL installation"
                rm -r gdal/lib
            fi
            # Proceed with installation
            echo "Installing the GDAL natives"
            mkdir -p gdal/lib
            tar -xzf gdal/gdal192-Ubuntu12-gcc4.6.3-x86_64.tar.gz -C gdal/lib
            break ;;
        (Skip) 
            echo "Skipping GDAL installation"
            break ;;
        (*) 
            echo "Invalid selection. Try again (1..2)!" ;;
        esac
    done  
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
                echo "The MrSID driver adds the capability to read *.sid files."
                echo "It uses a proprietary license from LizardTech."
            (*) 
                echo "Invalid selection. Try again (1..3)!" ;;
            esac
        done  
        if [[ $MRSID_CHOICE == Install ]]; then
            echo
            echo "LizardTech MrSID License:"
            PS3="License? "
            select LICENSE_CHOICE in View Accept Decline 
            do 
                case "$LICENSE_CHOICE" in
                (View) 
                    # Display license
                    cat gdal/MrSID_decoderSDK_license.txt
                    echo
                    echo "The full license is available at ${PWD}/gdal/MRSIDLicense.rtf"
                    ;;
                (Accept) 
                    # Proceed with installation
                    echo "Installing the MRSID support from LizardTech"
                    echo "TODO: COPY JAR FILES ..."
                    break ;;
                (Decline) 
                    echo "Skipping MRSID installation"
                    break ;;
                (*) 
                    echo "Invalid selection. Try again (1..3)!" ;;
                esac
            done  
        fi
    fi
fi

## Install the GDAL data to the gdal/data folder
if [ ! -d gdal/data ]; then
    echo "Installing the GDAL data"
    mkdir gdal/data
    tar -xzf gdal/gdal-data.tar.gz -C gdal/data
fi