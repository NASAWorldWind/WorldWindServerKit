#!/bin/sh

# ==============================================================================
# The GeoServer "JP2K (Direct)" coverage reader cannot read the georeferencing 
# information in a .jp2 file, so we need to generate a world file (.j2w) and a 
# projection file (.prj) using GDAL to extract the information.
# ==============================================================================

for file in *.jp2; do 

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
    info=$(gdalinfo $file)

    # Define the .j2w and .prj filenames
    # ${file%.*} returns filename after removing extension (.*)
    j2w=${file%.*}.j2w
    prj=${file%.*}.prj
    
    # Extract the origin values inside the parenthesis, e.g.:
    #   Origin = (-180.000000000000512,90.000000000000199)
    origin=$(echo $info | grep -Po '(?<=Origin = \()[-]?[0-9]+\.?[0-9]+,[-]?[0-9]+\.?[0-9]+(?=\))')

    # Extract the pixel size values inside the parenthesis, e.g.:
    #   Pixel Size = (0.004166666667000,-0.004166666667000)
    size=$(echo $info | grep -Po '(?<=Pixel Size = \()[-]?[0-9]+\.?[0-9]+,[-]?[0-9]+\.?[0-9]+(?=\))')

    # Extract the coordinate system from the gdalinfo, e.g.:
    #   Coordinate System is: GEOGCS["WGS 84", . . . ]]
    crs=$(echo $info | grep -Po '(?<=Coordinate System is\: ).*\[(.*)\]')
    
    
    # Create the .j2w world file
    # The generic meaning of the six parameters in a world file (as defined by Esri[1]) are:
    #   Line 1: A: pixel size in the x-direction in map units/pixel
    #   Line 2: D: rotation about y-axis
    #   Line 3: B: rotation about x-axis
    #   Line 4: E: pixel size in the y-direction in map units, almost always negative[3]
    #   Line 5: C: x-coordinate of the center of the upper left pixel
    #   Line 6: F: y-coordinate of the center of the upper left pixel
    echo "Writing $j2w"
    # Output pixel size in x-direction - get floating point number before ','
    echo $size | grep -Po '[-]?[0-9]+\.?[0-9]+(?=,)' > $j2w
    echo 0.0 >> $j2w    
    echo 0.0 >> $j2w    
    # Output pixel size in y-direction - get floating point number after ','
    echo $size | grep -Po '(?<=,)[-]?[0-9]+\.?[0-9]+' >> $j2w
    # Output x-coordinate - get floating point number before ','
    echo $origin | grep -Po '[-]?[0-9]+\.?[0-9]+(?=,)' >> $j2w
    # Output y coordinate - get floating point number after ','
    echo $origin | grep -Po '(?<=,)[-]?[0-9]+\.?[0-9]+' >> $j2w
    
    # Create the .prj projection file
    echo "Writing $prj"
    echo $crs > $prj

done

