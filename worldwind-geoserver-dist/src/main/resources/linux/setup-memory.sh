#!/bin/bash

# -----------------------------------------------------------------------------
# Setup memory allocation for the World Wind Server Kit (WWSK) - Linux 
# -----------------------------------------------------------------------------

# Paths
PWD=$(pwd)
# Display a simple menu to configure the JVM heap memory allocation for Jetty/GeoServer
echo
echo "Memory allocation options:"
PS3="Select a memory allocation option: "
select MEM_CHOICE in Auto 512MB 1GB 2GB 4GB 8GB Skip Help
do 
    case "$MEM_CHOICE" in
    (Auto) 
        echo "Configuring the JVM to use 25% of the system memory for the heap allocation"
        break 
        ;;
    (512MB) 
        MEM_ALLOC=512m
        break 
        ;;
    (1GB) 
        MEM_ALLOC=1024m
        break 
        ;;
    (2GB) 
        MEM_ALLOC=2048m
        break 
        ;;
    (4GB) 
        MEM_ALLOC=4096m
        break 
        ;;
    (8GB) 
        MEM_ALLOC=8192m
        break 
        ;;
    (Skip) 
        echo "Skipping memory allocation setup"
        break 
        ;;
    (Help) 
        echo 
        echo "Memory Allocation Help"
        echo "======================"
        echo "Auto:       Configures the Java Virtual Machine (JVM) to use "
        echo "            25% of the system memory."
        echo "512MB..8GB: Configures the JVM to use the selected allocation."
        echo "Skip:       Skips the allocation. Makes no changes."
        echo
        ;;
    (*) 
        echo "Invalid selection. Try again (1..8)!" 
        ;;
    esac
done  

if [ ! -z "${MEM_ALLOC}" ]; then
    ## Update the HEAP environment variable in the env.sh script.
    ## Example:
    ## HEAP="-Xms2048m -Xmx2048m"
    ## We're using the s/PATTERN/REPLACEMENT/ regexp syntax with sed to update the script.
    ## The ^ and $ are beginning/end-of-line markers; .* matches anything.
    ## We're using the s;;; pattern instead of s/// to avoid conflicts with file paths.
    echo "Configuring the JVM to use $MEM_CHOICE (${MEM_ALLOC}) for the heap allocation"
    sed -i 's;^HEAP=.*$;HEAP="-Xms'${MEM_ALLOC}' -Xmx'${MEM_ALLOC}'";' env.sh
elif [ "${MEM_CHOICE}" = "Auto" ]; then
    sed -i 's;^HEAP=.*$;HEAP=;' env.sh
fi


echo  "Memory allocation setup complete"
