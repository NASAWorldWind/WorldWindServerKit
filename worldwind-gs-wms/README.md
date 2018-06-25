<img src="https://worldwind.arc.nasa.gov/img/nasa-logo.svg" height="100"/> 

# WorldWind Server Kit (WWSK)
## WorldWind GeoServer WMS Module (worldwind-gs-wms)

This module is a derivative of the _GeoServer WMS_ module (current build version).

* It resolves an issue with GeoTools' ImageWorker.writeJPEG() when procssing tile image offsets != 0
* It provides a CustomRenderedImageMapOutputFormat class that ensures the buildMap() output is compatible with the ImageIO.read() method
* CustomRenderedImageMapOuputFormat is used in the applicationContext.xml
* It provides a MapResponseOutputStreamAdaptor class that ensures the WMSMapContent image is compatible downstream image read operations
* MapResponseOutputStreamAdaptor is used by the GeoPackageGetmapOutputFormat class in the _WorldWind GeoServer Extention_ module (worldwind-gs-geopkg)
