@echo off
rem -----------------------------------------------------------------------------
rem Environment variables for the World Wind Server Kit (WWSK) - GeoServer
rem -----------------------------------------------------------------------------
set GEOSERVER_HOME=%CD%
set GEOSERVER_DATA_DIR=%GEOSERVER_HOME%\data_dir

rem -----------------------------------------------------------------------------
rem Use the local Java JRE if it exists
rem -----------------------------------------------------------------------------
if exist "%GEOSERVER_HOME%\java\" (
    set JAVA_HOME=%GEOSERVER_HOME%\java
)

rem -----------------------------------------------------------------------------
rem Stop the Jetty server hosting GeoServer
rem -----------------------------------------------------------------------------
pushd bin
call shutdown.bat
popd