/*
 *    GeoTools - The Open Source Java GIS Toolkit
 *    http://geotools.org
 *
 *    (C) 2002-2010, Open Source Geospatial Foundation (OSGeo)
 *
 *    This library is free software; you can redistribute it and/or
 *    modify it under the terms of the GNU Lesser General Public
 *    License as published by the Free Software Foundation;
 *    version 2.1 of the License.
 *
 *    This library is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *    Lesser General Public License for more details.
 */
package gov.nasa.worldwind.geopkg.mosaic;

import java.io.IOException;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.geotools.coverage.grid.io.AbstractGridCoverage2DReader;
import static org.geotools.coverage.grid.io.AbstractGridFormat.READ_GRIDGEOMETRY2D;
import org.geotools.factory.Hints;
import org.geotools.geopkg.mosaic.GeoPackageFormat;
import org.geotools.parameter.DefaultParameterDescriptorGroup;
import org.geotools.parameter.ParameterGroup;
import org.geotools.util.logging.Logging;
import org.opengis.parameter.GeneralParameterDescriptor;

/**
 * OGC GeoPackage Grid Format (supports the GP mosaic datastore).
 *
 * @author Bruce Schubert
 */
public class OgcGeoPackageFormat extends GeoPackageFormat {

    private final static Logger LOGGER = Logging.getLogger(OgcGeoPackageFormat.class.getPackage().getName());

    /**
     * Creates an instance and sets the metadata.
     */
    public OgcGeoPackageFormat() {
        // Override the default read and write parameters
        setInfo();
    }

    /**
     * Sets the metadata information.
     */
    private void setInfo() {
        final HashMap<String, String> info = new HashMap<String, String>();
        info.put("name", "GeoPackage (mosaic) [OGC compliant]");
        info.put("description", "GeoPackage mosaic plugin with an OGC compliant tile matrix");
        info.put("vendor", "NASA");
        info.put("docURL", "");
        info.put("version", "1.0");
        mInfo = info;

        // reading parameters
        readParameters = new ParameterGroup(new DefaultParameterDescriptorGroup(mInfo,
                new GeneralParameterDescriptor[]{
                    READ_GRIDGEOMETRY2D /*,
                       INPUT_TRANSPARENT_COLOR,
                OUTPUT_TRANSPARENT_COLOR,
                USE_JAI_IMAGEREAD,
                BACKGROUND_VALUES,
                SUGGESTED_TILE_SIZE,
                ALLOW_MULTITHREADING,
                MAX_ALLOWED_TILES,
                TIME,
                ELEVATION,
                FILTER,
                ACCURATE_RESOLUTION,
                SORT_BY,
                MERGE_BEHAVIOR,
                FOOTPRINT_BEHAVIOR*/}));

        // reading parameters
        writeParameters = null;
    }

    @Override
    public AbstractGridCoverage2DReader getReader(Object source) {
        return this.getReader(source, null);
    }

    @Override
    public AbstractGridCoverage2DReader getReader(Object source, Hints hints) {
        try {
            return new OgcGeoPackageReader(source, hints);
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, e.getLocalizedMessage(), e);
            return null;
        }
    }

}
