<img src="https://worldwind.arc.nasa.gov/img/nasa-logo.svg" height="100"/> 

# WorldWind Server Kit (WWSK)
## WorldWind GeoServer Explorer (worldwind-gs-explorer)

This module contains the WWSK Explorer web application. The Explorer is a NASA 
WebWorldWind-based web client integrated into GeoServer.  It can be accessed from
the GeoServer web administration interface.

### Features
* Visualize ALL the layers and layer groups you’ve defined on 3D terrain 
* See all your data in the context of a 3D globe or a 2D map
* Integrated collapsible layer manager
* Layer selections persist between sessions
* Supports persistent markers
* Sharable bookmark links
* Date/time widget displays the date/time adjusted for time zone and shows solar hour
* Location widget displays the compass, coordinates, slope and aspect, and the solar azimuth angle

### Module structure
* `src/main/resources` contains the JavaScript code and libraries and the HMTL
* `src/main/java` contains the module code that manifests the Explorer in the GeoServer web admin interface