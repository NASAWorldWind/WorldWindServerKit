#!/bin/bash
## Must run with bash shell to used variable substitution: 
#   "${var//pattern/substituion}"
set +x

# ==============================================================================
# Generates an image catalog in the form of a CSV file.
# Syntax: create_image_catalog.sh [folder] [filespec]
# Example: ./create_image_catalog.sh ~/maps *.jp2
# ==============================================================================

# -----------------------------------------------------------------------------
# HACK for JP2ECW crash in gdalinfo.
#
# The GDAL ECW library has a "w_char" bug that can crash Geoserver with:
# > terminate called after throwing an instance of 'srd::length_error'
# >   what(): basic_string::S_create
# > Aborted (core dumped) 
# See http://gis.stackexchange.com/questions/158828/geoserver-ecw-plugin-problem
#
# Setting the NCS_USER_PREFS environment variable to any value will cause the 
# code to skip the offending branch. This hack sets the variable to the same
# value that the offending branch was attempting to do. See this patch:
# https://github.com/makinacorpus/libecw/blob/master/Source/C/NCSUtil/NCSPrefsXML.cpp.rej
# -----------------------------------------------------------------------------
if [ -z "${NCS_USER_PREFS}" ]; then
    if [ ! -z "${HOME}" ]; then
        export NCS_USER_PREFS=${HOME}/.erm/ncsuserprefs.xml
    else
        export NCS_USER_PREFS=/etc/erm/ncsuserprefs.xml
    fi
fi

# A round function used reduce the number of decimal places in the resolution
# Syntax: round <value> <decimals>
round()
{
echo $(printf %.$2f $1)
};

# Image catalog file filename
outfile=image_catalog.csv

# Output CSV header
DELIM=";"
echo "filepath${DELIM}projection${DELIM}resolution${DELIM}color" > $outfile

# Find and process all the JP2 files in $1. Follow symbolic links (-L).
for f in $(find -L $1 -name "*.jp2"); do 
    pcs= 
    gcs=
    band1=
    band2=
    band3=
        
    # Use GDAL to get the georeferencing info from the JP2 file.
    #
    # Example output:
    #   Driver: JP2OpenJPEG/JPEG-2000 driver based on OpenJPEG library
    #   Files: BMNG_500m_A1.jp2
    #   Size is 21600, 21600
    #   Coordinate System is:
    #   GEOGCS["WGS 84",
    #       DATUM["WGS_1984",
    #           SPHEROID["WGS 84",6378137,298.257223563,
    #               AUTHORITY["EPSG","7030"]],
    #           AUTHORITY["EPSG","6326"]],
    #       PRIMEM["Greenwich",0],
    #       UNIT["degree",0.0174532925199433],
    #       AUTHORITY["EPSG","4326"]]
    #   Origin = (-180.000000000000512,90.000000000000199)
    #   Pixel Size = (0.004166666667000,-0.004166666667000)
    #   Image Structure Metadata:
    #   . . .
    info=$(gdalinfo $f)

    ## Grep options used:
    # -P --perl-regexp
    # -o --only-matching
    # (?<=...) positive lookbehind; fixed length only
    # (.*?) non-greedy match up until the first following lookahead
    # (?=...) positive lookahead

    # Coordinate System
    #crs=$(echo $info | grep -Po '(?<=Coordinate System is\: ).*\[(.*)\]')

    # Extract projected coordinate system "<name>" 
    #   PROJCS["WGS 84 / UTM zone 32N",
    pcs=$(echo $info | grep -Po '(?<=PROJCS\[)(.*?)(?=\,)') 
    
    # Extract geographic coordinate system "<name>"
    #   GEOGCS["WGS 84",
    gcs=$(echo $info | grep -Po '(?<=GEOGCS\[)(.*?)(?=\,)')
    
    # Define the projection name 
    if [ -n "$pcs" ]; then
        projection=$pcs
    elif [ -n "$gcs" ]; then
        projection=$gcs
    else
        projection="Undefined"
    fi
    # Replace space-slash-space with a dash
    projection="${projection// \/ /-}"
    # Replace spaces with underscores
    projection="${projection// /_}"
    # Remove quotes
    projection="${projection//\"/}"    
    
    # Determine the resolution
    # Extract the pixel size values inside the parenthesis, e.g.:
    #   Pixel Size = (0.004166666667000,-0.004166666667000)
    size=$(echo $info | grep -Po '(?<=Pixel Size = \()[-]?[0-9]+\.?[0-9]+,[-]?[0-9]+\.?[0-9]+(?=\))')
    # Get pixel size in x-direction - get floating point number before ','
    x=$(echo $size | grep -Po '[-]?[0-9]+\.?[0-9]+(?=,)')
    # Get pixel size in y-direction - get floating point number after ','
    y=$(echo $size | grep -Po '(?<=,)[-]?[0-9]+\.?[0-9]+')
    # Round to five decimal places (15 is too much!)
    ##resolution=$(round $x 5)"_"$(round $y 5)
    resolution=$(round $y 6)
    # Ignore (remove) negative sign
    resolution="${resolution//-/}"

    
    # Determine the color model
    # Extract Band 1 ColorInterp
    #   Band 1 Block=256x256 Type=Byte, ColorInterp=Gray
    band1=$(echo $info | grep -Po '(?<=Band 1)(.*?)(?=Description|Min|Overviews|NoData)')
    color1=$(echo $band1 | grep -Po '(?<=ColorInterp=).*')
    band2=$(echo $info | grep -Po '(?<=Band 2)(.*?)(?=Description|Min|Overviews|NoData)')
    color2=$(echo $band2 | grep -Po '(?<=ColorInterp=).*')
    band3=$(echo $info | grep -Po '(?<=Band 3)(.*?)(?=Description|Min|Overviews|NoData)')
    color3=$(echo $band3 | grep -Po '(?<=ColorInterp=).*')
    colormodel=${color1}${color2}${color3}
    if [ "$colormodel" = "RedGreenBlue" ]; then
        colormodel="RGB"
    elif [ -z "$colormodel" ]; then
        colormodel="Unknown"
    fi
    
    # Define the CSV values
    values=${f}${DELIM}${projection}${DELIM}${resolution}${DELIM}${colormodel}

    # Write the values out to the file
    echo $values
    echo $values >> $outfile
    
done

