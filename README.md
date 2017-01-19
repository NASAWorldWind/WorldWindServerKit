# <img src="https://worldwind.arc.nasa.gov/css/images/nasa-logo.svg" height="100"/> WorldWindServerKit
NASA World Wind map server kit

The [NASA World Wind](https://worldwind.arc.nasa.gov) Server Kit is an open source Java project 
that assembles [GeoServer](http://geoserver.org/) for easy distribution and implementation.

## License

GeoServer is licensed under the [GPL Version 2](https://www.gnu.org/licenses/gpl-2.0.html). 

## Building

The Server Kit uses [Apache Maven](http://maven.apache.org/) for a build system. To 
build GeoServer and its dependencies run maven from the root of the repository.

    $ mvn clean install

## Running

* Deploy the worldwind-geoserver.war file (found in the worldwind-geoserver/target folder) to your servlet container, e.g., Apache Tomcat. 

* To test with a local Jetty Server, run the preconfigured jetty-maven-plugin from the root of the 
WorldWind GeoServer Application module (worldwind-geoserver). Then point your browser to http://localhost:8080/wwgs/index.html

    $ mvn jetty:run

* To run in NetBeans, simply invoke "Run" on the WorldWind GeoServer Application module (worldwind-geoserver) 
and NetBeans will automatically deploy the war file to your configured application server and launch your browser.

## Bugs

NASA WorldWind uses [GitHub Issues](https://github.com/NASAWorldWind/WorldWindServerKit/issues) 
for issue tracking.