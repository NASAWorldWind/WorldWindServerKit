#!/bin/bash
## Must run with bash shell to used variable substitution: "${var//pattern/substituion}"

set -x

# Set the source image catalog CSV file: filename;projcs;geogcs;resolution;color
input=image_catalog.csv

# Process the input file.
#   Note: IFS is a special shell variable: the "Internal Field Separator" used by read
while IFS=\; read filename projection resolution color; do

    # Skip the header row
    if [ "$filename" = "filepath" ]; then
        continue
    fi
    
    # Get the file name components
    dirname=$(dirname $filename)
    basename=$(basename $filename)
    auxname=${basename}.aux.xml
    
    # Define the filepath where the categorized image (link) will be stored
    folder=${projection}"/"${color}"/"${resolution}
   
    # Create the folder hierarchy
    if [ ! -d $folder ]; then
        mkdir -p $folder
    fi
    
    # Create a symbolic link to the image in the folder
    ln -s $filename $folder/$basename
    ln -s $dirname/$auxname $folder/$auxname
    
done < "$input"
