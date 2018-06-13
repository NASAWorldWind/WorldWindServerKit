/* (c) 2014 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2014 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package gov.nasa.worldwind.gs.geopkg;

import org.geotools.geopkg.GeoPkgDataStoreFactory;

import org.geoserver.data.DataStoreFactoryInitializer;
import org.geoserver.platform.GeoServerResourceLoader;

/**
 * Initializes an GeoPkg data store factory by setting its location to the
 * GeoServer data directory.
 *
 * @author Justin Deoliveira, Boundless
 *
 */
public class GeoPkgDataStoreFactoryInitializer extends
        DataStoreFactoryInitializer<GeoPkgDataStoreFactory> {

    GeoServerResourceLoader resourceLoader;

    public GeoPkgDataStoreFactoryInitializer() {
        super(GeoPkgDataStoreFactory.class);
    }

    public void setResourceLoader(GeoServerResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public void initialize(GeoPkgDataStoreFactory factory) {
        factory.setBaseDirectory(resourceLoader.getBaseDirectory());
    }
}
