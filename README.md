<img src="https://worldwind.arc.nasa.gov/img/nasa-logo.svg" height="100"/> 

# WorldWindServerKit 

[![Build Status](https://travis-ci.org/NASAWorldWind/WorldWindServerKit.svg?branch=develop)](https://travis-ci.org/NASAWorldWind/WorldWindServerKit)
[![Download](https://api.bintray.com/packages/nasaworldwind/maven/WorldWindServerKit/images/download.svg)](https://bintray.com/nasaworldwind/maven/WorldWindServerKit/_latestVersion)

The [NASA WorldWind](https://worldwind.arc.nasa.gov) Server Kit (WWSK) is an open 
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

### Option 1. Deploy a standalone WWSK distribution
Copy and unzip the *worldwind-geoserver-\<version>-\<platform>* tar/zip distribution 
for your platform (found in the *worldwind-geoserver-dist/target* folder) to a folder
on the target computer. Then navigate to the root of the distribution folder and launch
the *setup* script to install the Oracle Server JRE and the GDAL dependencies.
Afterwards, you can launch GeoServer with the *run* script.

#### a) Setup the GeoServer environment, (one time, Linux only)    
Linux example:

    $ ./setup.sh

#### b) Run the script to launch GeoServer
Windows example:

    C:\...> run.bat

Linux example:

    $ ./run.sh 

Then point your browser to http://localhost:8080/geoserver/index.html to access the 
GeoServer web admin interface.

### Option 2. Deploy the WAR file
Deploy the *worldwind-geoserver.war* file (found in the *worldwind-geoserver/target* folder) 
to your preferred servlet container, e.g., Apache Tomcat. Then point your browser to the 
*geoserver* web context on your server.

### Option 3. Run in NetBeans
Simply invoke "Run" on the *WorldWind GeoServer Application* module (*worldwind-geoserver*) 
and NetBeans will automatically deploy the war file to your configured application server 
and launch your browser (typically http://localhost:8084/geoserver/index.html).

### Option 4. Run in Jetty from Maven
Run the preconfigured *jetty-maven-plugin* with maven from the root of the *WorldWind 
GeoServer Application* module (*worldwind-geoserver*). Example:

    $ mvn jetty:run

Then point your browser to http://localhost:8080/geoserver/index.html to access the 
GeoServer web admin interface.

### Option 5. Deploy a binary distribution
Copy and unzip a binary distribution (found in the *worldwind-geoserver-dist/target* folder)
to a folder on your target computer. Then navigate to the root of the distribution folder 
and launch the appropriate startup script found in the bin folder. You must establish 
some requisite environment variables to run GeoServer. The startup script will prompt
you to satisfy any missing prerequisites.

Windows example:

    C:\...> bin\startup.bat

Linux example

    $ ./bin/startup.sh  

Then point your browser to http://localhost:8080/geoserver/index.html to access the 
GeoServer web admin interface.


## OGC GeoPackage
The WWSK adds support for reading and writing OGC GeoPackages in GeoServer. 
WWSK manifests the **GeoPackage (tiles)** raster data source for OGC GeoPackages.  

Note: the *GeoPackage (mosaic)* raster data source is the GeoServer/GeoTools 
GeoPackage community extension is not compatible with GeoPackages conforming to the 
OGC GeoPackage Encoding Standard (http://www.geopackage.org/spec/). 
Do not use the community extension data source for OGC GeoPackages.

### Reading
Add an OGC GeoPackage layer:

1. Login to the GeoServer web admin interface.
2. Add a Workspace (if not already done)
  1. In the left hand pane under 'Data' select the Workspaces hyperlink to navigate to the Workspaces page.
  2. Select "Add new workspaces" under "Manage GeoServer workspaces".
  3. Complete the workspace configuration and select 'Submit'
3. Add a new Store
  1. In the left hand pane under 'Data' select the Stores hyperlink to navigate to the Stores page.
  2. Select "Add new Store" under "Manage the stores providing data to GeoServer".
  3. Select "GeoPackage (tiles)" under "Raster Data Sources"
  4. Complete the store configuration and select 'Submit'
  5. Select "Save"
  6. Select "Publish" under the "Action" column on the "New Layer" page.
  7. Scroll down and select "Save" at the bottom of the "Edit Layer" page.

### Writing
Raster layers can be exported to GeoPackages via the Web Administration's Layer Preview or
through Web Processing Service (WPS) requests.  

## GeoWebCache 
The WWSK has integrated support the GeoWebCache (GWC) enabled by default.  Tile Caching
options available on Layers are applicable.


## Bugs
NASA WorldWind uses [GitHub Issues](https://github.com/NASAWorldWind/WorldWindServerKit/issues) 
for issue tracking.
