<img src="https://worldwind.arc.nasa.gov/css/images/nasa-logo.svg" height="100"/> 
# WorldWindServerKit

The [NASA World Wind](https://worldwind.arc.nasa.gov) Server Kit (WWSK) is an open 
source Java project that assembles [GeoServer](http://geoserver.org/) for easy 
distribution and implementation.

## License

GeoServer is licensed under the [GPL Version 2](https://www.gnu.org/licenses/gpl-2.0.html). 

## Building

The WWSK uses [Apache Maven](http://maven.apache.org/) for a build system. To 
build GeoServer and its dependencies run maven from the root of the WWSK repository.
Example:

    $ mvn clean install

## Running

### Option 1. Deploy the WAR file
Deploy the *worldwind-geoserver.war* file (found in the *worldwind-geoserver/target* folder) 
to your preferred servlet container, e.g., Apache Tomcat. Then point your browser to the 
*wwgs* web context on your server.

### Option 2. Run in NetBeans
Simply invoke "Run" on the *WorldWind GeoServer Application* module (*worldwind-geoserver*) 
and NetBeans will automatically deploy the war file to your configured application server 
and launch your browser (typically http://localhost:8084/wwgs/index.html).

### Option 3. Run in Jetty
Run the preconfigured *jetty-maven-plugin* with maven from the root of the *WorldWind 
GeoServer Application* module (*worldwind-geoserver*). Example:

    $ mvn jetty:run

Then point your browser to http://localhost:8080/wwgs/index.html to access the 
GeoServer web admin interface.

### Option 4. Deploy a binary distribution
Copy and unzip a binary distribution (found in the *worldwind-geoserver-dist/target* folder)
to a folder on your target computer. Then navigate to the root of the distribution folder 
and launch the appropriate startup script found in the bin folder. You must establish 
some requisite environment variables to run GeoServer. The startup script will prompt
you to satisfy any missing prerequisites.

Windows example:

    C:\...> bin\startup.bat

Linux example

    $ ./bin/startup.sh  

Then point your browser to http://localhost:8080/wwgs/index.html to access the 
GeoServer web admin interface.

### Option 5. Deploy the SSGF distribution
Copy and unzip the *ssgf* tarball distribution (found in the *worldwind-geoserver-dist/target* 
folder) to a folder on the target Linux computer. Then navigate to the root of the 
distribution folder and launch the setup script to install the Oracle Server JRE.  
Afterwards, you can launch GeoServer with the run script.

Install the JRE (one time), example:

    $ ./setup.sh

Launch GeoServer, example:

    $ ./run.sh

Then point your browser to http://localhost:8080/wwgs/index.html to access the 
GeoServer web admin interface.

## OGC GeoPackage
The WWSK adds support for reading OGC GeoPackages in GeoServer. WWSK manifests the 
**GeoPackage (mosaic) [OGC Compliant]** raster data source for OGC GeoPackages.  

The **GeoPackage (mosaic)** raster data source is the native GeoServer/GeoTools 
GeoPackage extension which is not compatible with GeoPackages conforming to the 
OGC GeoPackage Encoding Standard (http://www.geopackage.org/spec/). 
Do not use this data source for OGC GeoPackages.

### Reading
TODO: Write instructions.

### Writing
TBD: Not implemented yet.

## GeoWebCache 
The WWSK has integrated support the GeoWebCache (GWC) enabled by default.  Tile Caching
options available on Layers are applicable.

## SRS
WMS supported SRS have been limited to the following EPSG codes mentioned in the NSG Profile: 
4326, 3395, 4979, 5041, 5042, 5773, 5714, 5715


## Bugs
NASA WorldWind uses [GitHub Issues](https://github.com/NASAWorldWind/WorldWindServerKit/issues) 
for issue tracking.