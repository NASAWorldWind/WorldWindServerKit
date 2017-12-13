@echo off
rem -----------------------------------------------------------------------------
rem Environment variables for the World Wind Server Kit (WWSK) - GeoServer
rem -----------------------------------------------------------------------------
set GEOSERVER_HOME=%CD%
set GEOSERVER_DATA_DIR=%GEOSERVER_HOME%\data_dir

rem -----------------------------------------------------------------------------
rem Tune the Java runtime environment. 
rem See http://www.oracle.com/technetwork/systems/index-156457.html
rem -----------------------------------------------------------------------------
rem Set how much heap memory to allocate to GeoServer (min and max)
rem The max size of the "older generation" heap is controlled by the -Xms parameter.
rem Example for 2GB memory allocation:
rem     set HEAP=-Xms2048m -Xmx2048m
rem Leave the HEAP blank to allocate 25% of the system memory to the JVM.
set HEAP=


rem Set how much memory to set aside for new objects.
rem The "young generation" is further divided into an Eden, and Semi-spaces.
set NEW=-XX:NewSize=256m -XX:MaxNewSize=256m -XX:SurvivorRatio=2

rem Enable either the Low Pause or Throughput garbage collectors, e.g.,
rem "-XX:+UseParNewGC +UseConcMarkSweepGC" or "-XX:+UseParallelGC" respectively.
set GC=-XX:+UseParallelGC 

rem Add some debug tracing: report each GC event.
set DEBUG=-verbose:gc -XX:+PrintTenuringDistribution

rem Generate a heap dump on out of memory errors
set DUMP=-XX:+HeapDumpOnOutOfMemoryError

rem Explicitly ask for the server JVM (implicit in 64bit JVM)
set SERVER=-server

set JAVA_OPTS=%HEAP% %NEW% %GC% %PERM% %DEBUG% %DUMP% %SERVER%
echo JAVA_OPTS set to %JAVA_OPTS%

rem -----------------------------------------------------------------------------
rem Use the local Java JRE if it was installed
rem -----------------------------------------------------------------------------
if not exist "%GEOSERVER_HOME%\java\" goto skipLocalJava
    set JAVA_HOME=%GEOSERVER_HOME%\java
    echo JAVA_HOME set to %JAVA_HOME%
:skipLocalJava

rem -----------------------------------------------------------------------------
rem Use the local GDAL natives if there were installed
rem -----------------------------------------------------------------------------
if not exist "%GEOSERVER_HOME%\gdal\" goto noLocalGdal
    set GDAL_HOME=%GEOSERVER_HOME%\gdal

    rem Path to directory containing various GDAL data files (EPSG CSV files, etc ...). 
    set GDAL_DATA=%GDAL_HOME%\data\gdal-data
    echo GDAL_DATA set to %GDAL_DATA%

    rem Path to directory containing GDAL native binaries. It will be prepended to system PATH.
    if not "%GDAL_LIB%" == "" goto skipGdalPath
        set GDAL_LIB=%GDAL_HOME%\lib
        set PATH=%GDAL_LIB%;%PATH%
        echo GDAL_LIB set to %GDAL_LIB% and prepended to PATH 
    :skipGdalPath
:noLocalGdal


rem -----------------------------------------------------------------------------
rem Add the default directory containing the GDAL ECW and MrSID plugins. 
rem -----------------------------------------------------------------------------
rem GDAL searches the "driver path" for .dll files that start with the prefix "gdal_X.dll".
if not exist "C:\Program Files\GDAL\gdalplugins\" goto noGdalDrivers
    if not "%GDAL_DRIVER_PATH%" == "" goto skipGdalDrivers
        set GDAL_DRIVER_PATH=C:\Program Files\GDAL\gdalplugins
        echo GDAL_DRIVER_PATH set to %GDAL_DRIVER_PATH% 
    :skipGdalDrivers
:noGdalDrivers


rem -----------------------------------------------------------------------------
rem Start the Jetty servlet container and the GeoServer web app
rem -----------------------------------------------------------------------------
pushd bin
call startup.bat
popd
