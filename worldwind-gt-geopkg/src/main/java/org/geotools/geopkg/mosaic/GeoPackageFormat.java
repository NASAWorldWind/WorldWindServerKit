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
package org.geotools.geopkg.mosaic;

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

    public final static String NAME = "GeoPackage (tiles)";
    public final static String DESC = "GeoPackage format with OGC encoding";
    public final static String VENDOR = "worldwind.arc.nasa.gov";   // TODO: Change back to GeoTools when this fork is rolled back into community
    public final static String DOC_URL = "";
    public final static String VERSION = "1.0";
    
    /**
     * Format names for a GeoPackage.
     */
    public static final String[] FORMAT_NAMES = {"geopackage", "geopkg", "gpkg"};
    
    /**
     * The format's MIME type(s).
     */
    public static final String[] MIME_TYPES = {"application/x-gpkg"};

    /**
     * Common file suffixes.
     */
    public final static String[] SUFFIXES = {"gpkg"};
    
    /**
     * The input Types that are accepted.
     */
    public static final Class[] INPUT_TYPES = new Class[]{
        File.class, URL.class, String.class, FileImageInputStreamExtImpl.class
    };
    
    
    private final static Logger LOGGER = Logging.getLogger(GeoPackageFormat.class.getPackage().getName());

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
     * @return nothing
     * @throws UnsupportedOperationException
     */
    @Override
    public GridCoverageWriter getWriter(Object destination) {
        return getWriter(destination, null);
    }

    /**
     * Not implemented.
     *
     * @return nothing
     * @throws UnsupportedOperationException
     */
    @Override
    public GridCoverageWriter getWriter(Object destination, Hints hints) {
        throw new UnsupportedOperationException("Unsupported method: Geopackage format is read-only.");
    }

    /**
     * Tests if the given source object can be read as a GeoPackage.
     *
     * @param source A File, filename String, file:// URL or a
     * FileImageInputStreamExtImpl
     * @param hints ignored
     * @return true if the file exists and is has a .gpkg extension
     */
    @Override
    public boolean accepts(Object source, Hints hints) {
        return isValidGeoPackage(source);
    }

    /**
     * Not implemented.
     *
     * @return nothing
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
        final HashMap<String, String> info = new HashMap<>();
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
     * Tests if the source appears to be a valid GeoPackage file.
     *
     * @param source a File, String, URL or FileImageInputStreamExtImpl object
     * @return true if the source object references an existing GeoPackage file
     *
     */
    public static boolean isValidGeoPackage(Object source) {
        if (source == null) {
            return false;
        }

        // Assert that the source references a valid file object
        File sourceFile = getFileFromSource(source);
        if (sourceFile == null) {
            return false;
        }

        // Assert the source file appears to be a GeoPackage
        // TODO: Check if the file is a sqlite database
        String filename = sourceFile.getName().toLowerCase();
        for (String suffix : SUFFIXES) {
            if (filename.endsWith("."+ suffix)) {
                return true;
            }
        }
        return false;
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
