@echo off
rem -----------------------------------------------------------------------------
rem Setup the GDAL ECW and MrSID plugins for GeoServer
rem -----------------------------------------------------------------------------
if exist "gdal\gdal-19-1600-x64-ecw.msi" gdal\gdal-19-1600-x64-ecw.msi
if exist "gdal\gdal-19-1600-x64-mrsid.msi" gdal\gdal-19-1600-x64-mrsid.msi
if exist "gdal\gdal-19-1600-ecw.msi" gdal\gdal-19-1600-ecw.msi
if exist "gdal\gdal-19-1600-mrsid.msi"  gdal\gdal-19-1600-mrsid.msi
