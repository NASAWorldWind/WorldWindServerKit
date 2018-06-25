<img src="https://worldwind.arc.nasa.gov/img/nasa-logo.svg" height="100"/> 

# WorldWindServerKit 

[![Build Status](https://travis-ci.org/NASAWorldWind/WorldWindServerKit.svg?branch=develop)](https://travis-ci.org/NASAWorldWind/WorldWindServerKit)
[![Download](https://api.bintray.com/packages/nasaworldwind/maven/WorldWindServerKit/images/download.svg)](https://bintray.com/nasaworldwind/maven/WorldWindServerKit/_latestVersion)

The [NASA WorldWind](https://worldwind.arc.nasa.gov) Server Kit (WWSK) is an open 
source Java project that assembles [GeoServer](http://geoserver.org/) for easy 
distribution and implementation.

## License

Copyright 2004-2006, 2008, 2017, United States Government, as represented by the Administrator of the National Aeronautics and Space Administration. All rights reserved.

The NASA WorldWind Server Kit (WWSK) framework is licensed under the Apache License, Version 2.0 (the "License"); you may not use this application except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.

GeoServer is licensed under the [GPL Version 2](https://www.gnu.org/licenses/gpl-2.0.html). 

## Building

The WWSK uses [Apache Maven](http://maven.apache.org/) for a build system. To 
build GeoServer and its dependencies run maven from the root of the WWSK repository.
Example:

    $ mvn clean install

### Versions

The versions for GeoServer, GeoTools, ImageIO, JAI and others are defined and 
maintained in the properties section of the WWSK parent POM. 
- Also review travis scripts and installation scripts for the old GeoServer version
- If you update the GeoServer version you must download the GDAL extension for
the new version from the GeoServer distribution site and copy the zip file to the 
resources folder. For example, for GeoServer 2.13.0, download 
[geoserver-2.13.0-gdal-plugin.zip](https://sourceforge.net/projects/geoserver/files/GeoServer/2.13.0/extensions/geoserver-2.13.0-gdal-plugin.zip).
You will need to create a .tgz version of the .zip file for inclusion in the 
Linux distribution.
- If you update the ImageIO version you must download the artifacts for the new version
from [geo-solutions.it](https://demo.geo-solutions.it/share/github/imageio-ext/releases/1.1.X/) 
and copy them to the resources folder. For example, for ImageIO 1.0.20, download
[imageio-ext-1.1.20-jars.zip](https://demo.geo-solutions.it/share/github/imageio-ext/releases/1.1.X/1.1.20/imageio-ext-1.1.20-jars.zip).
You will need to create a .tgz version of the .zip file for inclusion in the 
Linux distribution.

### Integration Tests

The integration tests are run via a script via Maven and a JMeter maven plugin. 
The tests can be run in Travis-CI and on a local development workstation. 

- To run the tests locally, run _./travis/run_integration_tests.sh_ (Linux/Ubuntu only at this time).
- See the _worldwind-geoserver/src/test/uris_ folder for the URI CSV files used by the JMeter tests.
- The maven based test plan is _worldwind-geoserver/src/test/jmeter/test.jmx_
- Review the _worldwind-geoserver/src/test/jmeter_ folder for the JMeter test plans.
- The test data is located in the _resources/data/test_ folder

The tests are controlled the following profiles found in the _worldwind-geoserver.pom_:

#### `integration-test`
Runs JMeter tests against the standard geoserver build.

#### `integration-test-gdal`
Runs JMeter tests against the a standard geoserver build after adding GDAL to the 
geoserver instance.

#### `integration-test-jai`
Runs JMeter tests against the a standard geoserver build after adding JAI native 
to the JRE

### What to do if a test fails
The _worldwind-geoserver/src/test/jmeter/test.jmx_ outputs assertion error and the
associated responses to log files in the _worldwind-geoserver/target/jmeter/logs_
folder. These logs may be voluminous do the nature of the responses, but the nature
of the assertion failures can be obtained examining <failureMessage> messsages.
If its a Content-Type error, compare the expected content type to the received
header a few lines down in the log. If required, you can change the expected 
content type in the URI text file(s) located in _worldwind-geoserver/src/test/uris_ 
folder.

#### Test Results
The test results from the last Travis-CI build can be viewed here:
- https://nasaworldwind.github.io/WorldWindServerKit/core/
- https://nasaworldwind.github.io/WorldWindServerKit/gdal/


### Functional Tests

To run the functional tests you must install [Apache JMeter](https://jmeter.apache.org).
Launch JMeter from the {project root}/jmeter folder.  From the JMeter client, 
open the `functional_test/GeoServer Functional Tests.jmx`. Prerequisites:
 - GeoServer Functional Tests requires running instance of GeoServer. Configure
the test suite to point to the server.
 - The server instance must have the internal [test data and workspaces](https://drive.google.com/drive/folders/0Bxjx1De3fE2KemZQc1NPMmhWaVU) installed.


## Debugging
To allow a debugger to be attached to an instance of WWSK, add or uncomment the following code block 
in env.sh right after the existing `DEBUG` variable assignment.
```
# Allow Java JPDA debugger to be attached to this process via SocketAttach with transport dt_socket on port 8000
DEBUG=${DEBUG}" -Xdebug -Xrunjdwp:transport=dt_socket,address=8000,server=y,suspend=n "
```

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
