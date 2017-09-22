#!/bin/bash

# -----------------------------------------------------------------------------
# Setup memory allocation for the World Wind Server Kit (WWSK) - Linux 
# -----------------------------------------------------------------------------

# Display a simple menu to configure the JVM heap memory allocation for Jetty/GeoServer
echo
echo "Configuring the JVM heap memory allocation for Jetty/GeoServer."
echo "The current allocation is: " `grep ^HEAP env.sh` " (Xms=min, Xmx=max, Blank=auto)"
echo
echo "Memory allocation options:"
PS3="Select a memory allocation option: "
select MEM_CHOICE in Auto 1GB 1.5GB 2GB 4GB 8GB Other Skip Help
do 
    case "$MEM_CHOICE" in
    (Auto) 
        echo "Configuring the JVM to use 25% of the system memory for the heap allocation"
        break 
        ;;
    (1GB) 
        MEM_ALLOC=1024m
        break 
        ;;
    (1.5GB) 
        MEM_ALLOC=1536m
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
    (Other) 
        echo 
        echo "Enter the amount of memory to allocate to GeoServer."
        echo "Enter an integer followed 'm' for megabytes or 'g' for gigabytes, e.g., for 1GB enter 1024m or 1g:"
        read AMOUNT
        # Assert something was entered
        if ! [ -z $AMOUNT ]; then
            # Assert megabytes/gigabytes is specified
            if ! [[ $AMOUNT == *[g,m,G,M] ]]; then
                echo "Memory unit-of-measure must be specified. Use 'm' for megabytes or 'g' for gigabytes."
                echo
                continue
            else
                # Assert the value in front of the UOM is an integer and it is > 0 
                VALUE=${AMOUNT%[g,m,G,M]}
                if ! [ $VALUE -eq $VALUE ] 2> /dev/null; then  # -eq generates an error if not an integer
                    echo "Value must be an integer followed by 'm' or 'g'."
                    echo
                    continue
                elif ! [ $VALUE -gt 0 ]; then
                    echo "Value must be greater than zero."
                    echo
                    continue
                fi
            fi
        else 
            echo "No value entered."
            echo
            continue
        fi
        MEM_ALLOC=$AMOUNT     
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
        echo "1GB..8GB:   Configures the JVM to use the selected allocation."
        echo "Other:      Enter a specific value in megabytes or gigabytes."
        echo "Skip:       Skips the allocation. Makes no changes."
        echo
        ;;
    (*) 
        echo "Invalid selection. Try again (1..9)!" 
        echo
        ;;
    esac
done  

if [ ! -z "${MEM_ALLOC}" ]; then
    ## Update the HEAP environment variable in the env.sh script.
    ## Example:
    ## HEAP="-Xms2048m -Xmx2048m"
    ## We're using the s/PATTERN/REPLACEMENT/ regexp syntax with sed to update the script.
    ## The ^ and $ are beginning/end-of-line markers; .* matches anything.
    echo "Configuring the JVM to use $MEM_CHOICE (${MEM_ALLOC}) for the HEAP allocation"
    sed -i 's/^HEAP=.*$/HEAP="-Xms'${MEM_ALLOC}' -Xmx'${MEM_ALLOC}'"/' env.sh
elif [ "${MEM_CHOICE}" = "Auto" ]; then
    sed -i 's/^HEAP=.*$/HEAP=/' env.sh
fi


echo  "Memory allocation setup complete. You can reconfigure the memory by running ./setup-memory.sh"
