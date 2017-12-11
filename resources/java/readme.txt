Java Server JRE 
===============

Download Links:
---------------

Downloads: http://www.oracle.com/technetwork/java/javase/downloads/server-jre8-downloads-2133154.html

Latest:  http://download.oracle.com/otn-pub/java/jdk/8u151-b12/e758a0de34e24606bca991d704f6dcbf/server-jre-8u151-linux-x64.tar.gz

Archive (requires signon): http://download.oracle.com/otn/java/jdk/8u121-b13/e9e7ea248e2c4826b92b3f075a80e441/server-jre-8u121-linux-x64.tar.gz

$ wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/8u151-b12/e758a0de34e24606bca991d704f6dcbf/server-jre-8u151-linux-x64.tar.gz


Notes:
------

This doesn't work anymore; returns 404, not found. Looks like a GUID folder is now part of the path:
$ export JAVA_MAJOR=8
$ export JAVA_MINOR=151
$ export JAVA_BUILD=12
$ wget --no-check-certificate --no-cookies --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/${JAVA_MAJOR}u${JAVA_MINOR}-b${JAVA_BUILD}/server-jre-${JAVA_MAJOR}u${JAVA_MINOR}-linux-x64.tar.gz

