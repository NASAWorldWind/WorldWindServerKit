<img src="https://worldwind.arc.nasa.gov/css/images/nasa-logo.svg" height="100"/> 

# WorldWind Server Kit (WWSK)
## WorldWind GeoServer Application (worldwind-geoserver)

This module builds the basic WWSK GeoServer web application. 

The maven POM.xml defines all the dependencies for the WWSK GeoServer.


### Profiles
#### integration-test

#### integration-test-gdal

#### integration-test-jai

### Debugging

- Add some debug tracing: report each GC event.
`DEBUG="-verbose:gc -XX:+PrintTenuringDistribution "`

- Allow debugger 
`DEBUG=${DEBUG}"-Xdebug -Xrunjdwp:transport=dt_socket,address=8000,server=y,suspend=n "` 

- Enable profiling with NetBeans
`DEBUG=${DEBUG}"-XX:+UseLinuxPosixThreadCPUClocks -agentpath:/usr/local/netbeans-8.2/profiler/lib/deployed/jdk16/linux-amd64/libprofilerinterface.so=/usr/local/netbeans-8.2/profiler/lib,5140"`
