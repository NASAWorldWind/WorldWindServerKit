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

import com.vividsolutions.jts.geom.Envelope;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.awt.image.Raster;
import java.awt.image.SampleModel;
import java.awt.image.WritableRaster;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import gov.nasa.worldwind.geopkg.GeoPackage;
import gov.nasa.worldwind.geopkg.Tile;
import gov.nasa.worldwind.geopkg.TileEntry;
import gov.nasa.worldwind.geopkg.TileMatrix;
import gov.nasa.worldwind.geopkg.TileReader;
import java.awt.BasicStroke;
import java.awt.Dimension;
import java.awt.image.ColorModel;
import javax.media.jai.ImageLayout;

import org.geotools.coverage.CoverageFactoryFinder;
import org.geotools.coverage.grid.GridCoverage2D;
import org.geotools.coverage.grid.GridEnvelope2D;
import org.geotools.coverage.grid.GridGeometry2D;
import org.geotools.coverage.grid.io.AbstractGridCoverage2DReader;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.coverage.grid.io.OverviewPolicy;
import org.geotools.data.DefaultResourceInfo;
import org.geotools.data.ResourceInfo;
import org.geotools.factory.Hints;
import org.geotools.geometry.GeneralEnvelope;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.image.ImageWorker;
import org.geotools.referencing.CRS;
import org.geotools.util.Utilities;
import org.geotools.util.logging.Logging;
import org.opengis.coverage.grid.Format;
import org.opengis.coverage.grid.GridEnvelope;
import org.opengis.parameter.GeneralParameterValue;
import org.opengis.parameter.ParameterValue;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.ReferenceIdentifier;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.cs.CoordinateSystem;
import org.opengis.referencing.datum.PixelInCell;
import org.opengis.referencing.operation.MathTransform;
import org.opengis.referencing.operation.TransformException;

/**
 * GeoPackage reader for OGC GeoPackage Tile Encoding.
 *
 * @author Justin Deoliveira
 * @author Niels Charlier
 * @author Bruce Schubert
 */
public final class GeoPackageReader extends AbstractGridCoverage2DReader {

    /**
     * The {@link Logger} for this {@link GeoPackageReader}.
     */
    static final Logger LOGGER = Logging.getLogger("org.geotools.geopkg");

    // BDS: commented out so as set/use base-class member
    //protected GridCoverageFactory coverageFactory;
    protected File sourceFile;

    protected Map<String, TileEntry> tiles = new HashMap<>();

    /**
     * Constructs a GeoPackageReader from a source.
     *
     * @param source File, URL or filename.
     * @param hints
     * @throws IOException
     */
    public GeoPackageReader(Object source, Hints hints) throws IOException {
        coverageFactory = CoverageFactoryFinder.getGridCoverageFactory(this.hints);
        sourceFile = GeoPackageFormat.getFileFromSource(source);

        // A GeoPackage object is used to read the contents of the file
        GeoPackage gpkg = new GeoPackage(sourceFile);
        try {
            coverageName = null;

            // Use the first table found as the default coverage name for this reader
            for (TileEntry tileset : gpkg.tiles()) {
                // Set the default coverage name to the name of the the first raster tileset.
                if (coverageName == null) {
                    coverageName = tileset.getTableName();
                }
                // Map the tileset to the coverage name (table name)
                tiles.put(tileset.getTableName(), tileset);
            }

            // Set the image layout for the reader to the first available coverage
            if (coverageName != null) {
                setlayout(getImageLayout(coverageName));
            }

        } finally {
            gpkg.close();
        }
    }

    /**
     * Returns the tileset corresponding to the default raster coverage in this
     * GeoPackage.
     *
     * @return a {@link TileEntry} representing the tileset
     */
    public TileEntry getTileset() {
        return getTileset(coverageName);
    }

    /**
     * Returns the tileset corresponding to the raster coverage name.
     *
     * @param coverageName the coverage name matching a user-data table name
     * @return a TileEntry object representing the tileset
     * @throws IllegalArgumentException if the coverage name does not match a
     * user-data table
     */
    public TileEntry getTileset(String coverageName) {
        if (!checkName(coverageName)) {
            throw new IllegalArgumentException("The specified coverageName " + coverageName
                    + "is not supported");
        }
        return tiles.get(coverageName);
    }

    /**
     * Returns the Format that is handled by this reader.
     *
     * @return a new {@link GeoPackageFormat}
     */
    @Override
    public Format getFormat() {
        return new GeoPackageFormat();
    }

    /**
     * Returns a {@link ResourceInfo} describing the specified coverage.
     *
     * @param coverageName The name of a coverage in the GeoPackage
     * @return a {@link ResourceInfo} or null if the coverage is not found
     */
    @Override
    public ResourceInfo getInfo(String coverageName) {
        DefaultResourceInfo info = null;
        if (checkName(coverageName)) {
            TileEntry tileset = tiles.get(coverageName);
            info = new DefaultResourceInfo();
            info.setName(coverageName);
            info.setTitle(tileset.getTableName());
            info.setDescription(tileset.getDescription());
            info.setBounds(tileset.getBounds());
            info.setCRS(getCoordinateReferenceSystem(coverageName));
        } else {
            LOGGER.log(Level.WARNING, "getInfo failed to locate the coverage: {0}", coverageName);
        }
        return info;
    }

    /**
     * Ensure the given coverage name matches a user-data table name in the
     * GeoPackage.
     *
     * @param coverageName the name to validate
     * @return true if the name matches a user-data table name in the
     * {@link GeoPackage}
     */
    @Override
    protected boolean checkName(String coverageName) {
        Utilities.ensureNonNull("coverageName", coverageName);
        return tiles.keySet().contains(coverageName);
    }

    /**
     * Returns the number of coverages in the {@link GeoPackage}.
     *
     * @return the number of user-data tables in the {@link GeoPackage}
     */
    @Override
    public int getGridCoverageCount() {
        return tiles.size();
    }

    /**
     * Returns the list of the raster coverages in the GeoPackage.
     *
     * @return an array of the {@link GeoPackage}'s user-data table names
     */
    @Override
    public String[] getGridCoverageNames() {
        return tiles.keySet().toArray(new String[tiles.size()]);
    }

    /**
     * Returns the geographic extents of the given raster coverage.
     *
     * @param coverageName the name of the raster coverage
     * @return a {@link GeneralEnvelope} containing the bounds of the given
     * coverage
     */
    @Override
    public GeneralEnvelope getOriginalEnvelope(String coverageName) {
        return new GeneralEnvelope(getTileset(coverageName).getBounds());
    }

    /**
     * Returns the pixel envelope surrounding the raster data at the highest
     * resolution (maximum zoom level).
     *
     * @param coverageName the name of the GeoPackage coverage
     * @return a GridEnvelope containing the location and dimensions of the
     * raster data within the tileset's pixel grid
     */
    @Override
    public GridEnvelope getOriginalGridRange(String coverageName) {
        int zoomLevel = getTileset(coverageName).getMaxZoomLevel();
        return getGridRange(coverageName, zoomLevel);
    }

    /**
     * Return the pixel envelope surrounding the raster data found at the given
     * zoom level.
     *
     * @param zoomLevel
     * @return a {@link GridEnvelope} containing the location and dimensions of
     * the raster data within the tileset's pixel grid
     */
    public GridEnvelope getGridRange(int zoomLevel) {
        return getGridRange(coverageName, zoomLevel);
    }

    /**
     * Returns the pixel envelope corresponding to the geographic extents of
     * this coverage local to given zoom level's pixel grid. The grid range's
     * x/y values are the margins between the tileset's left/top edge and the
     * left/top edge of the raster data.
     *
     * @param coverageName the name of the GeoPackage coverage
     * @param zoomLevel the zoom level within the coverage
     * @return a {@link GridEnvelope} containing the location and dimensions of
     * the the geographic bounds within the tileset's pixel grid
     */
    public GridEnvelope getGridRange(String coverageName, int zoomLevel) {
        TileEntry tileset = getTileset(coverageName);
        Envelope bounds = tileset.getTileMatrixSetBounds();
        CoordinateReferenceSystem crs1 = tileset.getCrs();
        TileMatrix matrix = tileset.getTileMatrix(zoomLevel);
        int startCol = matrix.getMinCol();
        int startRow = matrix.getMinRow();
        double pixSizeX = matrix.getXPixelSize();
        double pixSizeY = matrix.getYPixelSize();
        // Get the size of world in CRS units
        double worldSpanHorz = crs1.getCoordinateSystem().getAxis(0).getMaximumValue() - crs1.getCoordinateSystem().getAxis(0).getMinimumValue();
        double worldSpanVert = crs1.getCoordinateSystem().getAxis(1).getMaximumValue() - crs1.getCoordinateSystem().getAxis(1).getMinimumValue();
        // Compute the size of a tile in CRS units
        double colSpan = worldSpanHorz / matrix.getMatrixWidth(); // matrixWidth is num columns
        double rowSpan = worldSpanVert / matrix.getMatrixHeight();// matrixHeight is num rows
        // Compute the location of the upper-left corner of the tile set in the CRS
        double originX = crs1.getCoordinateSystem().getAxis(0).getMinimumValue() + (colSpan * startCol);
        double originY = crs1.getCoordinateSystem().getAxis(1).getMaximumValue() - (rowSpan * startRow);
        // Compute the x/y pixel offsets for the upper-left corner of the tileset's bounds.
        // The x/y pixel values are the margin between the tileset's edge and the imagery.
        int x = (int) Math.round((bounds.getMinX() - originX) / pixSizeX);
        int y = (int) Math.round((originY - bounds.getMaxY()) / pixSizeY);
        // Compute width and height of a tile in pixels
        int width = (int) Math.round((bounds.getMaxX() - bounds.getMinX()) / pixSizeX);
        int height = (int) Math.round((bounds.getMaxY() - bounds.getMinY()) / pixSizeY);

        GridEnvelope2D gridRange = new GridEnvelope2D(x, y, width, height);

        return gridRange;
    }

    /**
     * Returns the coordinate reference system for the given coverage.
     *
     * @param coverageName the raster coverage name
     * @return the tile set's spatial reference ID (SRID) decoded to a CRS
     */
    @Override
    public CoordinateReferenceSystem getCoordinateReferenceSystem(String coverageName) {
        return getTileset(coverageName).getCrs();
    }

    /**
     * Number of overviews for the specified coverage.
     *
     * @param coverageName
     * @return the number of zoom levels minus 1
     */
    @Override
    public int getNumOverviews(String coverageName) {
        TileEntry tileset = getTileset(coverageName);
        int minZoom = tileset.getMinZoomLevel();
        int maxZoom = tileset.getMaxZoomLevel();

        return maxZoom - minZoom;
    }

    /**
     * Returns the resolution (pixel sizes) of the specified coverage's maximum
     * zoom level.
     *
     * @param coverageName the raster coverage name
     * @return new double[]{xPixelSize, yPixelSize}
     */
    @Override
    protected double[] getHighestRes(String coverageName) {
        TileEntry tileset = getTileset(coverageName);
        TileMatrix matrix = tileset.getTileMatrix(tileset.getMaxZoomLevel());
        return new double[]{matrix.getXPixelSize(), matrix.getYPixelSize()};
    }

    /**
     * Returns the resolution levels of the overviews for the specified
     * coverage.
     *
     * @param coverageName the raster coverage name
     * @return new double[imageIndex][resolution]
     */
    @Override
    public double[][] getResolutionLevels(String coverageName) {
        // The superclass method doesn't handle multiple coverages and operates
        // off protected members and not getters
        TileEntry tilepyramid = getTileset(coverageName);
        int maxZoomLevel = tilepyramid.getMaxZoomLevel();
        int minZoomLevel = tilepyramid.getMinZoomLevel();
        int numImages = maxZoomLevel - minZoomLevel + 1;

        final double[][] resolutionLevels = new double[numImages][2];
        for (int i = 0, level = maxZoomLevel; level >= minZoomLevel; level--, i++) {
            double[] res = getResolution(coverageName, level); // [lonRes, latRes]
            System.arraycopy(res, 0, resolutionLevels[i], 0, 2);
        }
        return resolutionLevels;
    }

    /**
     * Returns the pixel resolution for the given coverage and zoom level.
     *
     * @param coverage
     * @param zoomLevel
     * @return double[]{resX, resY}
     */
    public double[] getResolution(String coverage, int zoomLevel) {
        TileEntry tilePyramid = getTileset(coverageName);
        TileMatrix matrix = tilePyramid.getTileMatrix(zoomLevel);
        double[] resXY = new double[2];
        resXY[0] = matrix.getXPixelSize();
        resXY[1] = matrix.getYPixelSize();
        return resXY;
    }

    /**
     * Returns the actual resolution used to read the data given the specified
     * target resolution and the specified overview policy.
     *
     * Copied from base class and fixed to use getNumOverviews(coverageName).
     *
     * @param coverageName
     * @param policy
     * @param requestedResolution
     * @return new double[]{xRes, yRes}
     */
    @Override
    public double[] getReadingResolutions(
            String coverageName, OverviewPolicy policy, double[] requestedResolution) {
        // Find the target resolution level
        double[] result;
        if (getNumOverviews(coverageName) > 0) {
            int zoomLevel = pickZoomLevel(coverageName, policy, requestedResolution);
            return getResolution(coverageName, zoomLevel);
        } else {
            return getHighestRes(coverageName);
        }
    }

    /**
     * Returns an {@link ImageLayout} specified coverage at its highest
     * resolution. The ImageLayout contains the image bounds comprising the
     * image X/Y and width/height; the tile grid layout, comprising tile grid
     * X/Y offsets, and tile width/height; and the {@link ColorModel} and the
     * {@link SampleModel} of the image.
     *
     * @param coverageName the raster coverage name
     * @return a {@link ImageLayout} initialized with image bounds, tile grid
     * layout, color model and sample model
     */
    @Override
    public ImageLayout getImageLayout(String coverageName) {
        TileEntry tileset = getTileset(coverageName);
        int maxZoomLevel = tileset.getMaxZoomLevel();

        // Create the ImageLayout with the image bounds of the primary image
        GridEnvelope gridRange = getOriginalGridRange(coverageName);
        ImageLayout imageLayout = new ImageLayout(
                gridRange.getLow(0), gridRange.getLow(1),
                gridRange.getSpan(0), gridRange.getSpan(1));

        // Set the tile grid offsets; the x/y coords of the upper-left pixel in the upper-left tile 
        Dimension tileSize = getTileSize(coverageName, maxZoomLevel);
        imageLayout.setTileGridXOffset(0).setTileGridYOffset(0);
        imageLayout.setTileWidth(tileSize.width).setTileHeight(tileSize.height);

        // Set the color/sample models
        BufferedImage image = new BufferedImage(tileSize.width, tileSize.height, BufferedImage.TYPE_4BYTE_ABGR);
        ColorModel cm = image.getColorModel();
        SampleModel sm = image.getSampleModel();
        imageLayout.setColorModel(cm).setSampleModel(sm);

        return imageLayout;
    }

    /**
     * Returns the pixel dimensions of a tile in the specified coverage at the
     * specified zoom level.
     *
     * @param coverageName the raster coverage name
     * @param zoomLevel the zoom level
     * @return the width and hight of a tile in pixels
     */
    public Dimension getTileSize(String coverageName, int zoomLevel) {
        TileMatrix matrix = getTileset(coverageName).getTileMatrix(zoomLevel);
        Integer tileHeight = matrix.getTileHeight();
        Integer tileWidth = matrix.getTileWidth();

        return new Dimension(tileWidth, tileHeight);
    }

    /**
     * This method is responsible for preparing the @{link ImageReadParam} for
     * doing an {@link ImageReader#read(int, ImageReadParam)}.
     *
     * @param coverageName the raster coverage name
     * @param overviewPolicy specifies the policy to compute the zoom level
     * @param readParams an instance of {@link ImageReadParam} for setting the
     * subsampling factors
     * @param requestedEnvelope the {@link GeneralEnvelope} we are requesting
     * @param requestedDim a {@link Rectangle} containing requested dimensions
     * @return the selected overview: a zero-based image index where 0 is the
     * highest resolution, 1 is the first overview, and so on
     * @throws IOException
     * @throws TransformException
     */
    @Override
    protected Integer setReadParams(String coverageName,
            OverviewPolicy overviewPolicy,
            ImageReadParam readParams,
            GeneralEnvelope requestedEnvelope,
            Rectangle requestedDim) throws IOException, TransformException {

        // Default image index is 0, the highest resolution tile level
        Integer imageIndex = 0;

        // Extract the overview policy from the hints if it is not explictly provided
        if (overviewPolicy == null) {
            overviewPolicy = extractOverviewPolicy();
        }

        // Set the default values for subsampling
        readParams.setSourceSubsampling(
                /*sourceXSubsampling*/1, /*sourceXSubsampling*/ 1,
                /*subsamplingXOffset*/ 0, /*subsamplingYOffset*/ 0);

        // All done if ignoring overviews
        if (overviewPolicy.equals(OverviewPolicy.IGNORE)) {
            return imageIndex;
        }

        final boolean useOverviews = (getNumOverviews(coverageName) > 0);

        // Compute the requested resolution to determine the zoom level
        //  The super.getResolution utility returns a two-element array: [xRes,yRes]
        double[] requestedRes = getResolution(requestedEnvelope, requestedDim, getCoordinateReferenceSystem(coverageName));
        if (requestedRes == null) {
            return imageIndex;
        }

        // Get the imageIndex from the zoom level
        if (useOverviews) {
            int zoomLevel = pickZoomLevel(coverageName, overviewPolicy, requestedRes);
            imageIndex = getTileset(coverageName).getMaxZoomLevel() - zoomLevel;
        }

        // Update the readParams' subsampling based on the selected overview and resolution.
        decimationOnReading(coverageName, imageIndex, readParams, requestedRes);

        return imageIndex;
    }

    /**
     * Returns the {@link OverviewPolicy} found in this reader's hints.
     *
     * @return the {@link OverviewPolicy} in the hints; or if not found, the
     * {@code OverviewPolicy.getDefaultPolicy()} (NEAREST)
     */
    private OverviewPolicy extractOverviewPolicy() {
        OverviewPolicy overviewPolicy = null;
        // Check if a policy was provided using hints (check even the deprecated one)
        if (this.hints != null) {
            if (this.hints.containsKey(Hints.OVERVIEW_POLICY)) {
                overviewPolicy = (OverviewPolicy) this.hints.get(Hints.OVERVIEW_POLICY);
            }
        }
        // Use the default if not provided. Default is nearest
        if (overviewPolicy == null) {
            overviewPolicy = OverviewPolicy.getDefaultPolicy(); // NEAREST
        }
        return overviewPolicy;
    }

    /**
     * Returns a zoom level for the specified coverage matching the given
     * overview policy and requested resolution.
     *
     * @param coverageName the raster coverage name
     * @param policy the overview policy governing the zoom level selection
     * @param requestedRes two-element array defining the requested resolution:
     * [xRes, yRes]
     * @return the best zoom level for the specified overview policy and
     * resolution
     */
    Integer pickZoomLevel(String coverageName, OverviewPolicy policy, double[] requestedRes) {

        // Find the closest zoom based on the horizontal resolution
        TileEntry tilepyramid = getTileset(coverageName);
        double horRes = requestedRes[0];

        // Loop over matrices to find the best match. They are ordered by zoom level in ascending order         
        double difference = Double.MAX_VALUE;
        int zoomLevel = 0;
        for (TileMatrix matrix : tilepyramid.getTileMatricies()) {
            // TODO: Store the resolution in the matrix meta data
            // ? Is the newRes the same as the TileMatrix.getXPixelSize?
            //double newRes = worldSpan / (matrix.getMatrixWidth() * matrix.getTileWidth());
            double pixelSize = matrix.getXPixelSize();
            if (policy == OverviewPolicy.NEAREST) {
                double newDifference = Math.abs(horRes - pixelSize);
                if (newDifference < difference) {
                    difference = newDifference;
                    zoomLevel = matrix.getZoomLevel();
                }
            } else if (policy == OverviewPolicy.SPEED) {
                if (pixelSize < horRes) {
                    break;  // use previous zoom level
                }
                zoomLevel = matrix.getZoomLevel();
            } else if (policy == OverviewPolicy.QUALITY) {
                zoomLevel = matrix.getZoomLevel();
                if (pixelSize <= horRes) {
                    break;
                }
            }
        }
        return zoomLevel;
    }

    /**
     * Called by setReadParam, this method is responsible for evaluating
     * possible subsampling factors once the best resolution level has been
     * found, in case we have support for overviews, or starting from the
     * original coverage in case there are no overviews available.
     *
     * Copied from base class decimationOnReadingControl and fixed for
     * multi-coverage GeoPackage format: i.e., getHighestRes(coverageName)
     *
     * @param coverageName
     * @param imageIndex zero-based image index (0 is highest resolution)
     * @param readParams
     * @param requestedRes
     */
    protected final void decimationOnReading(String coverageName, Integer imageIndex, ImageReadParam readParams, double[] requestedRes) {
        {
            int w, h;
            double[] selectedRes = new double[2];
            if (imageIndex == 0) {
                // highest resolution
                double[] highestRes1 = getHighestRes(coverageName);
                GridEnvelope originalGridRange1 = getOriginalGridRange(coverageName);
                w = originalGridRange1.getSpan(0);
                h = originalGridRange1.getSpan(1);
                selectedRes[0] = highestRes1[0];
                selectedRes[1] = highestRes1[1];
            } else {
                // some overview
                int zoomLevel = getTileset(coverageName).getMaxZoomLevel() - imageIndex;
                double[] zoomRes = getResolution(coverageName, zoomLevel);
                selectedRes[0] = zoomRes[0];
                selectedRes[1] = zoomRes[1];

                GeneralEnvelope originalEnvelope1 = getOriginalEnvelope(coverageName);
                w = (int) Math.round(originalEnvelope1.getSpan(0) / selectedRes[0]);
                h = (int) Math.round(originalEnvelope1.getSpan(1) / selectedRes[1]);
            }
            // /////////////////////////////////////////////////////////////////////
            // DECIMATION ON READING
            // Setting subsampling factors with some checkings
            // 1) the subsampling factors cannot be zero
            // 2) the subsampling factors cannot be such that the w or h are zero
            // /////////////////////////////////////////////////////////////////////
            // setSourceSubsampling(
            //      sourceXSubsampling, sourceYSubsampling, 
            //      subsamplingXOffset, subsamplingYOffset)
            //  sourceXSubsampling - the number of columns to advance between pixels.
            //  sourceYSubsampling - the number of rows to advance between pixels.
            //  subsamplingXOffset - the horizontal offset of the first subsample within the region
            //  subsamplingYOffset - the horizontal offset of the first subsample within the region.
            // /////////////////////////////////////////////////////////////////////
            if (requestedRes == null) {
                readParams.setSourceSubsampling(1, 1, 0, 0);

            } else {
                int subSamplingFactorX = (int) Math.floor(requestedRes[0] / selectedRes[0]);
                subSamplingFactorX = subSamplingFactorX == 0 ? 1 : subSamplingFactorX;

                while (w / subSamplingFactorX <= 0 && subSamplingFactorX >= 0) {
                    subSamplingFactorX--;
                }
                subSamplingFactorX = subSamplingFactorX == 0 ? 1 : subSamplingFactorX;

                int subSamplingFactorY = (int) Math.floor(requestedRes[1] / selectedRes[1]);
                subSamplingFactorY = subSamplingFactorY == 0 ? 1 : subSamplingFactorY;

                while (h / subSamplingFactorY <= 0 && subSamplingFactorY >= 0) {
                    subSamplingFactorY--;
                }
                subSamplingFactorY = subSamplingFactorY == 0 ? 1 : subSamplingFactorY;

                readParams.setSourceSubsampling(subSamplingFactorX, subSamplingFactorY, 0, 0);
            }
        }
    }

    /**
     * Reads from the first raster coverage in the GeoPackage.
     *
     * @param parameters Array containing the requested grid geometry as a
     * {@code Parameter<GridGeometry2D>} descriptor-value pair with a
     * {@code AbstractGridFormat.READ_GRIDGEOMETRY2D} descriptor
     *
     * @return A grid coverage that contains the supplied grid geometry
     *
     * @throws IllegalArgumentException
     * @throws IOException
     */
    @Override
    public GridCoverage2D read(GeneralParameterValue[] parameters) throws IllegalArgumentException, IOException {
        return read(coverageName, parameters);
    }

    /**
     * Reads from the named raster coverage.
     *
     * @param coverageName The name of the coverage to be read
     * @param parameters Array containing the requested grid geometry as a
     * {@code Parameter<GridGeometry2D>} descriptor-value pair with a
     * {@code AbstractGridFormat.READ_GRIDGEOMETRY2D} descriptor
     *
     * @return A grid coverage that contains the supplied grid geometry
     *
     * @throws IllegalArgumentException
     * @throws IOException
     */
    @Override
    public GridCoverage2D read(String coverageName, GeneralParameterValue[] parameters) throws IllegalArgumentException, IOException {
        TileEntry entry = getTileset(coverageName);
        BufferedImage image = null;
        ReferencedEnvelope resultEnvelope = null;
        GeoPackage file = new GeoPackage(sourceFile);
        try {
            CoordinateReferenceSystem crs = getCoordinateReferenceSystem(coverageName);

            ReferencedEnvelope requestedEnvelope = null;
            Rectangle dim = null;
            Color inputTransparentColor = null;

            // Extract the GridGeometry2D from the parameters and set the
            // requested envelope and dimensions.
            if (parameters != null) {
                for (int i = 0; i < parameters.length; i++) {
                    final ParameterValue param = (ParameterValue) parameters[i];
                    final ReferenceIdentifier name = param.getDescriptor().getName();
                    if (name.equals(AbstractGridFormat.READ_GRIDGEOMETRY2D.getName())) {
                        final GridGeometry2D gg = (GridGeometry2D) param.getValue();
                        try {
                            requestedEnvelope = ReferencedEnvelope.create(gg.getEnvelope(), gg.getCoordinateReferenceSystem()).transform(crs, true);
                        } catch (Exception e) {
                            requestedEnvelope = null;
                        }
                        dim = gg.getGridRange2D().getBounds();

                        /////////////////////////////////////////////////////////
                        // TODO: Remove this hack if longer needed.
                        // HACK!
                        // GeoServer CatalogBuilder.buildCoverageInternal() mistakenly 
                        // passes maxX and maxY values instead of width and height for the
                        // range when attempting to create a 5x5 test range - potentially 
                        // causing out-of-memory errors.
                        // This hack regenerates the width/height dim if we detect this condition.
                        ////////////////////////////////////////////////////////
                        GridEnvelope gridRange = getOriginalGridRange(coverageName);
                        if (dim.getWidth() > gridRange.getSpan(0)) {
                            try {
                                // Correct "bad" width/height values
                                final GridEnvelope2D testRange = new GridEnvelope2D(dim.x, dim.y, dim.width - dim.x, dim.height - dim.y);
                                // Build the corresponding envelope
                                final MathTransform gridToWorldCorner = getOriginalGridToWorld(PixelInCell.CELL_CORNER);
                                final GeneralEnvelope testEnvelope = CRS.transform(gridToWorldCorner, new GeneralEnvelope(testRange.getBounds()));
                                testEnvelope.setCoordinateReferenceSystem(requestedEnvelope.getCoordinateReferenceSystem());
                                final GridGeometry2D gg2 = new GridGeometry2D(testRange, testEnvelope);
                                dim = gg2.getGridRange2D();
                                requestedEnvelope = ReferencedEnvelope.create(gg2.getEnvelope(), gg2.getCoordinateReferenceSystem()).transform(crs, true);
                            } catch (TransformException e) {
                                Logger.getLogger(GeoPackageReader.class.getName()).log(Level.SEVERE, null, e);
                            } catch (FactoryException ex) {
                                Logger.getLogger(GeoPackageReader.class.getName()).log(Level.SEVERE, null, ex);
                            }
                            ////////////////////////////////////////////////////////                        
                        }
                        if (name.equals(AbstractGridFormat.INPUT_TRANSPARENT_COLOR.getName())) {
                            inputTransparentColor = (Color) param.getValue();
                        }
                    }
                }
            }

            int leftTile, topTile, rightTile, bottomTile;

            //find the closest zoom based on horizontal resolution
            TileMatrix bestMatrix = null;
            if (requestedEnvelope != null && dim != null) {
                //requested res
                // TODO: Replace this with a call to getResolution
                double horRes = requestedEnvelope.getSpan(0) / dim.getWidth(); //proportion of total width that is being requested
                double worldSpan = crs.getCoordinateSystem().getAxis(0).getMaximumValue() - crs.getCoordinateSystem().getAxis(0).getMinimumValue();

                //loop over matrices            
                double difference = Double.MAX_VALUE;
                for (TileMatrix matrix : entry.getTileMatricies()) {
                    double newRes = worldSpan / (matrix.getMatrixWidth() * matrix.getTileWidth());
                    double newDifference = Math.abs(horRes - newRes);
                    if (newDifference < difference) {
                        difference = newDifference;
                        bestMatrix = matrix;
                    }
                }
            }
            if (bestMatrix == null) {
                bestMatrix = entry.getTileMatricies().get(0);
            }

            // Get the range of available tiles from database
            leftTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), false, false);   // booleans: isMax, isRow
            rightTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), true, false);
            topTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), false, true);     // min tile_row
            bottomTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), true, true);   // max tile_row

            double resX = (crs.getCoordinateSystem().getAxis(0).getMaximumValue() - crs.getCoordinateSystem().getAxis(0).getMinimumValue()) / bestMatrix.getMatrixWidth();
            double resY = (crs.getCoordinateSystem().getAxis(1).getMaximumValue() - crs.getCoordinateSystem().getAxis(1).getMinimumValue()) / bestMatrix.getMatrixHeight();
            double originX = crs.getCoordinateSystem().getAxis(0).getMinimumValue(); // left
            double originY = crs.getCoordinateSystem().getAxis(1).getMaximumValue(); // top
            int tileWidth = bestMatrix.getTileWidth();
            int tileHeight = bestMatrix.getTileHeight();
            double pixSizeX = bestMatrix.getXPixelSize();
            double pixSizeY = bestMatrix.getYPixelSize();

            if (requestedEnvelope != null) { // crop tile set to requested envelope       
                // Test if the requested envelope aligns with tile matrix boundaries
                double remX = (requestedEnvelope.getMinimum(0) - originX) % resX;
                double remY = (originY - requestedEnvelope.getMaximum(1)) % resY;
                boolean extentsWithinAPixel = (remX < pixSizeX) && (remY < pixSizeY);
                boolean identicalTileSize = (dim != null && dim.getWidth() == tileWidth && dim.getHeight() == tileHeight);
                if (identicalTileSize && extentsWithinAPixel) {
                    leftTile = Math.max(leftTile, (int) Math.round((requestedEnvelope.getMinimum(0) - originX) / resX));
                    topTile = Math.max(topTile, (int) Math.round((originY - requestedEnvelope.getMaximum(1)) / resY));
                    rightTile = leftTile;
                    bottomTile = topTile;
                } else {
                    leftTile = Math.max(leftTile, (int) Math.round(Math.floor((requestedEnvelope.getMinimum(0) - originX) / resX)));
                    rightTile = Math.max(leftTile, (int) Math.min(rightTile, Math.round(Math.floor((requestedEnvelope.getMaximum(0) - originX) / resX))));
                    topTile = Math.max(topTile, (int) Math.round(Math.floor((originY - requestedEnvelope.getMaximum(1)) / resY)));
                    bottomTile = Math.max(topTile, (int) Math.min(bottomTile, Math.round(Math.floor((originY - requestedEnvelope.getMinimum(1)) / resY))));
                }
            }

            int width = (int) (rightTile - leftTile + 1) * tileWidth;
            int height = (int) (bottomTile - topTile + 1) * tileHeight;

            //recalculate the envelope we are actually returning
            resultEnvelope = new ReferencedEnvelope(originX + leftTile * resX, originX + (rightTile + 1) * resX, originY - topTile * resY, originY - (bottomTile + 1) * resY, crs);

            TileReader it;
            it = file.reader(entry, bestMatrix.getZoomLevel(), bestMatrix.getZoomLevel(), leftTile, rightTile, topTile, bottomTile);

            while (it.hasNext()) {
                Tile tile = it.next();

                // Get the image data using an ImageReader
                BufferedImage tileImage = readImage(tile.getData());

                ////////////////////////////////////////////////////////////////
                // DEBUGGING: Uncomment block to draw a border around the tiles
                /*
                {
                    Graphics2D graphics = tileImage.createGraphics();
                    float thickness = 2;
                    graphics.setStroke(new BasicStroke(thickness));
                    graphics.drawRect(0, 0, tileImage.getWidth(), tileImage.getHeight());
                }
                 */
                // Create the destination image that we draw into
                if (image == null) {
                    image = getStartImage(width, height, inputTransparentColor);
                }

                // Get the tile coordinates within the mosaic
                int posx = (int) (tile.getColumn() - leftTile) * tileWidth;
                int posy = (int) (tile.getRow() - topTile) * tileHeight;

                // Draw the tile. We 'draw' versus using 'copy data' to 
                // accomdate potentially different SampleModels between image tiles,
                // e.g., when there's a mix of PNG and JPEG image types in the table.
                Graphics2D g2 = image.createGraphics();
                g2.drawImage(tileImage, posx, posy, tileWidth, tileHeight, null);
            }

            it.close();

            // If there were no tiles, then we need to create an empty image
            if (image == null) { // no tiles ??
                image = getStartImage(width, height, inputTransparentColor);
            }

            // Apply the color transparency mask
            if (inputTransparentColor != null) {
                // Note: ImageWorker.makeColorTransparent only works 
                // with an IndexColorModel or a ComponentColorModel
                image = new ImageWorker(image).makeColorTransparent(inputTransparentColor).getRenderedOperation().getAsBufferedImage();
            }

        } finally {
            file.close();
        }
        return coverageFactory.create(entry.getTableName(), image, resultEnvelope);
    }

    /**
     * Reads the raster tile data intersecting the given region into a
     * {@link BufferedImage}. Called by {@link GeoPackageImageReader).
     *
     * @param zoomLevel the requested zoom level
     * @param region requested pixel region within the tileset
     * @param inputTransparentColor color to use for transparency; may be null
     * @return a {@link BufferedImage} matching the region's width and height
     * @throws IllegalArgumentException
     * @throws IOException
     */
    public BufferedImage readTiles(int zoomLevel, Rectangle region, Color inputTransparentColor) throws IllegalArgumentException, IOException {
        return readTiles(coverageName, zoomLevel, region, inputTransparentColor);
    }

    /**
     * Reads the raster tile data intersecting the given region within the
     * specified coverage's zoom level into a {@link BufferedImage}.
     *
     * @param coverageName the raster coverage name
     * @param zoomLevel the zoom level to read
     * @param region requested pixel region within the tileset
     * @param inputTransparentColor color to use for transparency; may be null
     * @return a {@link BufferedImage} matching the region's width and height
     * @throws IllegalArgumentException
     * @throws IOException
     */
    public BufferedImage readTiles(String coverageName, int zoomLevel, Rectangle region, Color inputTransparentColor) throws IllegalArgumentException, IOException {
        // Compute the index of the left-most tile
        TileEntry pyramid = getTileset(coverageName);
        TileMatrix matrix = pyramid.getTileMatrix(zoomLevel);
        GridEnvelope gridRange = getGridRange(zoomLevel);
        GeoPackage file = new GeoPackage(sourceFile);

        // Get pixel values of the source image data
        final int tileWidth = matrix.getTileWidth();
        final int tileHeight = matrix.getTileHeight();
        final int pixGridWidth = gridRange.getSpan(0);
        final int pixGridHeight = gridRange.getSpan(1);
        // Get the origin of the georeferenced image data within the matrix's pixel grid
        final int gridX = gridRange.getLow(0);
        final int gridY = gridRange.getLow(1);
        // Compute the offsets to the start of the image data within the top-left tile
        final int marginLeft = (int) (gridX % tileWidth);
        final int marginTop = (int) (gridY % tileHeight);
        // Compute the origin of the requested region within the tile matrix
        final int regionX = marginLeft + region.x;
        final int regionY = marginTop + region.y;
        // Get matrix tiles that intersect the specified region
        final int startCol = matrix.getMinCol() + (regionX / tileWidth);
        final int startRow = matrix.getMinRow() + (regionY / tileHeight);
        final int endCol = startCol + ((regionX + region.width) / tileWidth);
        final int endRow = startRow + ((regionY + region.height) / tileHeight);
        // Define the size of the image that will hold the intersecting tiles
        final int matrixPixWidth = (endCol - startCol + 1) * tileWidth;
        final int matrixPixHeight = (endRow - startRow + 1) * tileHeight;

        // Create the return image
        BufferedImage destImage = getStartImage(region.width, region.height, inputTransparentColor);

        try {
            // Create the image to hold the tiles.
            // TODO: if the destImage aligns with the tiles, then just use the destImage
            BufferedImage srcImage = getStartImage(matrixPixWidth, matrixPixHeight, inputTransparentColor);
            Graphics2D srcGraphics = srcImage.createGraphics();

            // Open a tile reader on the result set matching the zoom level and tile indices
            TileReader it = file.reader(pyramid, zoomLevel, zoomLevel, startCol, endCol, startRow, endRow);
            // Load all of the tiles the image
            while (it.hasNext()) {

                // Read the tile's image data into a BufferedImage
                Tile tile = it.next();
                BufferedImage tileImage = readImage(tile.getData());

                // DEBUGGING: Uncomment block to draw a border around the tiles
                /*
                {
                    Graphics2D graphics = tileImage.createGraphics();
                    float thickness = 2;
                    graphics.setStroke(new BasicStroke(thickness));
                    graphics.drawRect(0, 0, tileImage.getWidth(), tileImage.getHeight());
                }
                 */
                // Get the tile coordinates within the mosaic
                int posx = (tile.getColumn() - startCol) * tileWidth;
                int posy = (tile.getRow() - startRow) * tileHeight;

                // Draw the tile. We 'draw' versus using 'copy data' to 
                // accomdate potentially different SampleModels between image tiles,
                // e.g., when there's a mix of PNG and JPEG image types in the table.
                srcGraphics.drawImage(tileImage, posx, posy, tileWidth, tileHeight, null);

            }
            srcGraphics.dispose();
            it.close();

            // Apply the color transparency mask
            if (inputTransparentColor != null) {
                // Note: ImageWorker.makeColorTransparent only works 
                // with an IndexColorModel or a ComponentColorModel
                srcImage = new ImageWorker(srcImage).makeColorTransparent(inputTransparentColor).getRenderedOperation().getAsBufferedImage();
            }

            // Copy the src image into the dest image, cropping the image as required                
            Graphics2D g2 = destImage.createGraphics();
            int sx = regionX % tileWidth;
            int sy = regionY % tileHeight;
            g2.drawImage(srcImage,
                    0, //int dx1,
                    0, //int dy1,
                    destImage.getWidth(), //int dx2,
                    destImage.getHeight(), //int dy2,
                    sx, //int sx1,
                    sy, //int sy1,
                    sx + region.width, //int sx2,
                    sy + region.height, //int sy2,
                    null); //ImageObserver observer)
            g2.dispose();

        } finally {
            file.close();
        }
        return destImage;
    }

    /**
     * Creates a BufferedImage from the supplied image data byte array.
     *
     * @param data A byte array containing image data
     * @return A new BufferedImage
     * @throws IOException
     */
    protected static BufferedImage readImage(byte[] data) throws IOException {
        ByteArrayInputStream bis = new ByteArrayInputStream(data);
        Object source = bis;
        ImageInputStream iis = ImageIO.createImageInputStream(source);
        Iterator<?> readers = ImageIO.getImageReaders(iis);
        ImageReader reader = (ImageReader) readers.next();
        reader.setInput(iis, true);
        ImageReadParam param = reader.getDefaultReadParam();

        return reader.read(0, param);
    }

    /**
     * Creates a transparent image suitable for rendering tiles into.
     *
     * @param width The width of the new image
     * @param height The height of the new image
     * @return A new BufferedImage with transparent fill.
     */
    protected BufferedImage getStartImage(int width, int height, Color inputTransparentColor) {

        // ImageWorker.makeColorTransparent used in the read method only works images with a a ComponentColorModel or IndexColorModel
        int imageType = (inputTransparentColor != null) ? /*ComponentColorModel*/ BufferedImage.TYPE_4BYTE_ABGR : /*DirectColorModel*/ BufferedImage.TYPE_INT_ARGB;

        BufferedImage image = new BufferedImage(width, height, imageType);

        // Fill with white transparent background
        Graphics2D g2D = (Graphics2D) image.getGraphics();
        Color save = g2D.getColor();
        g2D.setColor(new Color(255, 255, 255, 0));
        g2D.fillRect(0, 0, image.getWidth(), image.getHeight());
        g2D.setColor(save);
        return image;
    }

    /**
     * Creates an image matching a source image's color model and properties.
     *
     * @param copyFrom The source image
     * @param width The width of the new image
     * @param height The height of the new image
     * @return A new BufferedImage matching the source image's color model and
     * properties
     */
    protected BufferedImage getStartImage(BufferedImage copyFrom, int width, int height) {
        Map<String, Object> properties = null;

        if (copyFrom.getPropertyNames() != null) {
            properties = new HashMap<>();
            for (String name : copyFrom.getPropertyNames()) {
                properties.put(name, copyFrom.getProperty(name));
            }
        }

        SampleModel sm = copyFrom.getSampleModel().createCompatibleSampleModel(width, height);
        WritableRaster raster = Raster.createWritableRaster(sm, null);

        BufferedImage image = new BufferedImage(copyFrom.getColorModel(), raster,
                copyFrom.isAlphaPremultiplied(), (Hashtable<?, ?>) properties);

        return image;
    }

    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
    @Deprecated
    protected int[] getTileIndex(String coverage, int zoomLevel, double xCoord, double yCoord) {
        TileEntry tilePyramid = getTileset(coverageName);
        ReferencedEnvelope bounds = tilePyramid.getBounds();
        TileMatrix matrix = tilePyramid.getTileMatrix(zoomLevel);
        CoordinateSystem coordSys = tilePyramid.getCrs().getCoordinateSystem();

        double originX = coordSys.getAxis(0).getMinimumValue(); // left
        double originY = coordSys.getAxis(1).getMinimumValue(); // top
        double extentX = coordSys.getAxis(0).getMaximumValue(); // right
        double extentY = coordSys.getAxis(1).getMaximumValue(); // bottom
        double resX = (extentX - originX) / matrix.getMatrixWidth();
        double resY = (extentY - originY) / matrix.getMatrixHeight();
        double pixSizeX = matrix.getXPixelSize();
        double pixSizeY = matrix.getYPixelSize();

        // Test if the point is with tile matrix boundaries
        double remX = (xCoord - originX) % resX;
        double remY = (originY - yCoord) % resY;
        boolean resolutionWithinAPixel = (remX < pixSizeX) && (remY < pixSizeY);

        int leftTile = -1;
        int topTile = -1;
        if (resolutionWithinAPixel) {
            leftTile = Math.max(leftTile, (int) Math.round((xCoord - originX) / resX));
            topTile = Math.max(topTile, (int) Math.round((originY - yCoord) / resY));
        } else {
            leftTile = Math.max(leftTile, (int) Math.round(Math.floor((xCoord - originX) / resX)));
            topTile = Math.max(topTile, (int) Math.round(Math.floor((originY - yCoord) / resY)));
        }
        return new int[]{leftTile, topTile};
    }

    /**
     * Used by GeoPackageImageReader.readTile().
     *
     * @param zoomLevel
     * @param tileX TODO: tileX should be an image tile index, not a matrix tile
     * index
     * @param tileY TODO: tileY should be an image tile index, not a matrix tile
     * index
     * @return
     */
    public BufferedImage readTile(int zoomLevel, int tileX, int tileY) {
        try {
            // TODO: Cache the gpkg or read and cache the metadata
            GeoPackage gpkg = new GeoPackage(sourceFile);
            TileEntry entry = getTileset(coverageName);
            TileReader tileReader = gpkg.reader(entry, zoomLevel, zoomLevel, tileX, tileX, tileY, tileY);
            while (tileReader.hasNext()) {
                Tile tile = tileReader.next();
                // Convert the tile image data to a BufferedImage
                BufferedImage tileImage = readImage(tile.getData());
                return tileImage;
            }
        } catch (IOException ex) {
            Logger.getLogger(GeoPackageReader.class.getName()).log(Level.SEVERE, null, ex);
        }
        return null;
    }

    @Deprecated
    protected BufferedImage readTiles(String coverageName, int zoomLevel, int leftTile, int rightTile, int topTile, int bottomTile) throws IllegalArgumentException, IOException {
        TileEntry pyramid = getTileset(coverageName);
        TileMatrix matrix = pyramid.getTileMatrix(zoomLevel);
        GeoPackage file = new GeoPackage(sourceFile);
        BufferedImage image = null;
        try {
            Color inputTransparentColor = null;
            int tileWidth = matrix.getTileWidth();
            int tileHeight = matrix.getTileHeight();
            int width = (int) (rightTile - leftTile + 1) * tileWidth;
            int height = (int) (bottomTile - topTile + 1) * tileHeight;

            TileReader it;
            it = file.reader(pyramid, zoomLevel, zoomLevel, leftTile, rightTile, topTile, bottomTile);

            while (it.hasNext()) {
                // Create the destination image that we draw into
                if (image == null) {
                    image = getStartImage(width, height, inputTransparentColor);
                }

                // Read the tile's image data into a BufferedImage
                Tile tile = it.next();
                BufferedImage tileImage = readImage(tile.getData());

                ////////////////////////////////////////////////////////////////
                // DEBUGGING: Uncomment block to draw a border around the tiles
                {
                    Graphics2D graphics = tileImage.createGraphics();
                    float thickness = 2;
                    graphics.setStroke(new BasicStroke(thickness));
                    graphics.drawRect(0, 0, tileImage.getWidth(), tileImage.getHeight());
                }

                // Get the tile coordinates within the mosaic
                int posx = (int) (tile.getColumn() - leftTile) * tileWidth;
                int posy = (int) (tile.getRow() - topTile) * tileHeight;

                // Draw the tile. We 'draw' versus using 'copy data' to 
                // accomdate potentially different SampleModels between image tiles,
                // e.g., when there's a mix of PNG and JPEG image types in the table.
                Graphics2D g2 = image.createGraphics();
                g2.drawImage(tileImage, posx, posy, tileWidth, tileHeight, null);
            }

            it.close();

            // If there were no tiles, then we need to create an empty image
            if (image == null) { // no tiles ??
                image = getStartImage(width, height, inputTransparentColor);
            }

            // Apply the color transparency mask
            if (inputTransparentColor != null) {
                // Note: ImageWorker.makeColorTransparent only works 
                // with an IndexColorModel or a ComponentColorModel
                image = new ImageWorker(image).makeColorTransparent(inputTransparentColor).getRenderedOperation().getAsBufferedImage();
            }

        } finally {
            file.close();
        }
        return image;
    }

}
