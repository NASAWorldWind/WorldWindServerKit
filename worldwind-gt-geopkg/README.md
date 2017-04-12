<img src="https://worldwind.arc.nasa.gov/css/images/nasa-logo.svg" height="100"/> 

# WorldWind Server Kit (WWSK)
## WorldWind GeoPackage Module (worldwind-gt-geopkg)

This module is a fork of the _GeoTools GeoPackage_ plugin (gt-geopkg v1.16.0).

* This module is a replacement for the _GeoTools GeoPackage_ plugin
* The enclosed GeoPackage class uses the OGC Tiling Scheme for GeoPackages; note _the GeoTools plugin uses incompatilbe TMS tiling scheme_
* The GeoPackageFormat is manifest as "GeoPackage (tiles)" as compared to the GeoTools plugin which is "GeoPackage (mosaic)"
* This module will not correctly ingest a GeoPackage that uses the TMS tiling scheme, nor will the GeoTools plugin ingest a GeoPackage using the OCG tiling scheme for GeoPackages
