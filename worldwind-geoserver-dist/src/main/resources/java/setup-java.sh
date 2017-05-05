#!/bin/bash

    # -----------------------------------------------------------------------------
    # Setup Java JRE 
    # -----------------------------------------------------------------------------
    JAVA_MIN_VER="121"

    ## Install the Java Server JRE
    if [ ! -d jdk1.8.0_${JAVA_MIN_VER}/jre ]; then
        echo "Installing the Java JRE"
        tar -xzf server-jre-8u${JAVA_MIN_VER}-linux-x64.tar.gz jdk1.8.0_${JAVA_MIN_VER}/jre
        
        ln -s jdk1.8.0_${JAVA_MIN_VER}/jre java
    fi

    echo  "Java setup complete"
