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

import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.geotools.coverage.grid.io.AbstractGridCoverage2DReader;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.coverage.grid.io.imageio.GeoToolsWriteParams;
import org.geotools.factory.Hints;
import org.geotools.parameter.DefaultParameterDescriptorGroup;
import org.geotools.parameter.ParameterGroup;
import org.geotools.referencing.factory.gridshift.DataUtilities;
import org.geotools.util.logging.Logging;
import org.opengis.coverage.grid.GridCoverageWriter;
import org.opengis.parameter.GeneralParameterDescriptor;

/**
 * GeoPackage Grid Format (supports the GP mosaic datastore).
 *
 * @author Justin Deoliveira
 * @author Niels Charlier
 * @author Bruce Schubert (contributor)
 */
public class GeoPackageFormat extends AbstractGridFormat {

    public final static String GPKG_FILE_EXTENSION = ".gpkg";
    private final static Logger LOGGER = Logging.getLogger(GeoPackageFormat.class.getPackage().getName());
    final static String NAME = "GeoPackage (tiles)";
    final static String DESC = "GeoPackage format with OGC encoding";
    final static String VENDOR = "WorldWind";   // TODO: Change back to GeoTools when this fork is rolled back into community
    final static String DOC_URL = "";
    final static String VERSION = "1.0";
    

    /**
     * Creates an instance and sets the metadata and default read parameters.
     */
    public GeoPackageFormat() {
        setInfo();
    }

    /**
     * Gets a GeoPackageReader object capable of reading the source object.
     *
     * @param source A File, filename String, file:// URL or a
     * FileImageInputStreamExtImpl
     * @return a new GeoPackageReader object.
     */
    @Override
    public AbstractGridCoverage2DReader getReader(Object source) {
        return getReader(source, null);
    }

    /**
     * Gets a GeoPackageReader object capable of reading the source object.
     *
     * @param source A File, filename String, file:// URL or a
     * FileImageInputStreamExtImpl
     * @return a new GeoPackageReader object.
     */
    @Override
    public AbstractGridCoverage2DReader getReader(Object source, Hints hints) {
        try {
            return new GeoPackageReader(source, hints);
        } catch (IOException e) {
            LOGGER.log(Level.WARNING, e.getLocalizedMessage(), e);
            return null;
        }
    }

    /**
     * Not implemented.
     *
     * @throws UnsupportedOperationException
     */
    @Override
    public GridCoverageWriter getWriter(Object destination) {
        return getWriter(destination, null);
    }

    /**
     * Not implemented.
     *
     * @throws UnsupportedOperationException
     */
    @Override
    public GridCoverageWriter getWriter(Object destination, Hints hints) {
        throw new UnsupportedOperationException("Unsupported method: Geopackage format is read-only.");
    }

    /**
     * Test if the given source object points to a GeoPackage file object.
     *
     * @param source A File, filename String, file:// URL or a
     * FileImageInputStreamExtImpl
     * @param hints ignored
     * @return true if the file exists and is has a .gpkg extension
     */
    @Override
    public boolean accepts(Object source, Hints hints) {
        if (source == null) {
            return false;
        }

        // Assert that the source references a valid file object
        File sourceFile = getFileFromSource(source);
        if (sourceFile == null) {
            return false;
        }

        
        // Assert the source file appears to be a GeoPackage
        // TODO: check if it is proper sqlite database
        return sourceFile.getName().toLowerCase().endsWith(GPKG_FILE_EXTENSION);
    }

    /**
     * Not implemented.
     *
     * @throws UnsupportedOperationException
     */
    @Override
    public GeoToolsWriteParams getDefaultImageIOWriteParameters() {
        throw new UnsupportedOperationException("Unsupported method.");
    }

    /**
     * Sets the metadata information.
     */
    private void setInfo() {
        final HashMap<String, String> info = new HashMap<String, String>();
        info.put("name", NAME);
        info.put("description", DESC);
        info.put("vendor", VENDOR);
        info.put("docURL", DOC_URL);
        info.put("version", VERSION);
        // Update base-class metadata
        mInfo = info;

        // Update base-class default readParameters
        readParameters = new ParameterGroup(
                new DefaultParameterDescriptorGroup(
                        mInfo,
                        new GeneralParameterDescriptor[]{
                            READ_GRIDGEOMETRY2D,
                            INPUT_TRANSPARENT_COLOR /*, 
                            SUGGESTED_TILE_SIZE,
                            OUTPUT_TRANSPARENT_COLOR,
                            USE_JAI_IMAGEREAD,
                            BACKGROUND_VALUES,
                            ALLOW_MULTITHREADING,
                            MAX_ALLOWED_TILES,
                            TIME,
                            ELEVATION,
                            FILTER,
                            ACCURATE_RESOLUTION,
                            SORT_BY,
                            MERGE_BEHAVIOR,
                            FOOTPRINT_BEHAVIOR */}));

        // reading parameters
        writeParameters = null;
    }

    /**
     * Attempts to return a File object from the input source.
     *
     * @param source a File, URL or filename referencing a GeoPackage file
     * @return a File object or null
     */
    public static File getFileFromSource(Object source) {
        if (source == null) {
            return null;
        }

        File sourceFile = null;
        try {
            if (source instanceof File) {
                sourceFile = (File) source;
            } else if (source instanceof FileImageInputStreamExtImpl) {
                // FileImageInputStreamExtImpl is used by image mosaic granules
                sourceFile = ((FileImageInputStreamExtImpl) source).getFile();
            } else if (source instanceof URL) {
                if (((URL) source).getProtocol().equals("file")) {
                    sourceFile = DataUtilities.urlToFile((URL) source);
                }
            } else if (source instanceof String) {
                sourceFile = new File((String) source);
            }
        } catch (Exception e) {
            if (LOGGER.isLoggable(Level.FINE)) {
                LOGGER.log(Level.FINE, e.getLocalizedMessage(), e);
            }
        }
        if (sourceFile != null && sourceFile.isFile()) {
            return sourceFile;
        }
        return null;
    }

}
