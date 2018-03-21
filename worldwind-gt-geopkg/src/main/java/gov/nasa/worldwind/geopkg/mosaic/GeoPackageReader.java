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
import it.geosolutions.imageio.maskband.DatasetLayout;
import java.awt.BasicStroke;
import java.awt.Dimension;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.ColorModel;
import java.awt.image.RenderedImage;
import java.awt.image.renderable.ParameterBlock;
import java.net.URL;
import javax.media.jai.ImageLayout;
import javax.media.jai.JAI;
import javax.media.jai.PlanarImage;
import javax.media.jai.RenderedOp;
import org.geotools.coverage.Category;

import org.geotools.coverage.CoverageFactoryFinder;
import org.geotools.coverage.GridSampleDimension;
import org.geotools.coverage.TypeMap;
import org.geotools.coverage.grid.GridCoverage2D;
import org.geotools.coverage.grid.GridEnvelope2D;
import org.geotools.coverage.grid.GridGeometry2D;
import org.geotools.coverage.grid.io.AbstractGridCoverage2DReader;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.coverage.grid.io.OverviewPolicy;
import org.geotools.data.DataSourceException;
import org.geotools.data.DefaultResourceInfo;
import org.geotools.data.ResourceInfo;
import org.geotools.factory.Hints;
import org.geotools.geometry.GeneralEnvelope;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.image.ImageWorker;
import org.geotools.referencing.CRS;
import static org.geotools.referencing.CRS.AxisOrder.EAST_NORTH;
import org.geotools.referencing.operation.builder.GridToEnvelopeMapper;
import org.geotools.referencing.operation.matrix.XAffineTransform;
import org.geotools.referencing.operation.transform.ProjectiveTransform;
import org.geotools.resources.coverage.CoverageUtilities;
import org.geotools.resources.image.ImageUtilities;
import org.geotools.util.Utilities;
import org.geotools.util.logging.Logging;
import org.opengis.coverage.ColorInterpretation;
import org.opengis.coverage.grid.Format;
import org.opengis.coverage.grid.GridEnvelope;
import org.opengis.geometry.Envelope;
import org.opengis.parameter.GeneralParameterValue;
import org.opengis.parameter.ParameterValue;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.ReferenceIdentifier;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.cs.CoordinateSystem;
import org.opengis.referencing.cs.CoordinateSystemAxis;
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

        } finally {
            gpkg.close();
        }
    }

    GeoPackageReader(URL source) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
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
        ReferencedEnvelope bounds = (ReferencedEnvelope) tileset.getTileMatrixSetBounds();
        CoordinateReferenceSystem crs1 = bounds.getCoordinateReferenceSystem();
        TileMatrix matrix = tileset.getTileMatrix(zoomLevel);
        int startCol = matrix.getMinCol();
        int startRow = matrix.getMinRow();
        double pixSizeX = matrix.getXPixelSize();
        double pixSizeY = matrix.getYPixelSize();
        // Get the size of world in CRS units
        final int xIndex = CRS.getAxisOrder(crs1) == EAST_NORTH ? 0 : 1;
        final int yIndex = 1 - xIndex;
        CoordinateSystemAxis xAxis = crs1.getCoordinateSystem().getAxis(xIndex);
        CoordinateSystemAxis yAxis = crs1.getCoordinateSystem().getAxis(yIndex);
        // Compute the size of a tile in CRS units
        double colSpan = (xAxis.getMaximumValue() - xAxis.getMinimumValue()) / matrix.getMatrixWidth();
        double rowSpan = (yAxis.getMaximumValue() - yAxis.getMinimumValue()) / matrix.getMatrixHeight();
        // Compute the location of the upper-left corner of the tile set in the CRS
        double originX = xAxis.getMinimumValue() + (colSpan * startCol);
        double originY = yAxis.getMaximumValue() - (rowSpan * startRow);
        // Compute the x/y pixel offsets for the upper-left corner of the tileset's bounds.
        // The x/y pixel values are the margin between the tileset's edge and the imagery.
        int xPix = (int) Math.round((bounds.getMinimum(xIndex) - originX) / pixSizeX);
        int yPix = (int) Math.round((originY - bounds.getMaximum(yIndex)) / pixSizeY);
        // Compute width and height of a tile in pixels
        int width = (int) Math.round((bounds.getMaximum(xIndex) - bounds.getMinimum(xIndex)) / pixSizeX);
        int height = (int) Math.round((bounds.getMaximum(yIndex) - bounds.getMinimum(yIndex)) / pixSizeY);

        GridEnvelope2D gridRange = new GridEnvelope2D(xPix, yPix, width, height);

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
        BufferedImage image = new BufferedImage(4, 4, BufferedImage.TYPE_4BYTE_ABGR);
        ColorModel cm = image.getColorModel();
        SampleModel sm = image.getSampleModel();
        imageLayout.setColorModel(cm).setSampleModel(sm);

        return imageLayout;
    }

    @Override
    public DatasetLayout getDatasetLayout(String coverageName) {
        return new GeoPackageDatasetLayout(getTileset(coverageName));
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
        TileEntry tileset = getTileset(coverageName);
        double horRes = requestedRes[0];

        // Loop over matrices to find the best match. They are ordered by zoom level in ascending order         
        double difference = Double.MAX_VALUE;
        int zoomLevel = 0;
        for (TileMatrix matrix : tileset.getTileMatricies()) {
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
                int xAxis = (CRS.getAxisOrder(originalEnvelope1.getCoordinateReferenceSystem()) == CRS.AxisOrder.EAST_NORTH ? 0 : 1);
                int yAxis = 1 - xAxis;
                w = (int) Math.round(originalEnvelope1.getSpan(xAxis) / selectedRes[0]);
                h = (int) Math.round(originalEnvelope1.getSpan(yAxis) / selectedRes[1]);
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
     * {@code AbstractGridFormat.READ_GRIDGEOMETRY2D} descriptor. See
     * {@link GeoPackageFormat}.
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
     * {@code AbstractGridFormat.READ_GRIDGEOMETRY2D} descriptor. See
     * {@link GeoPackageFormat}.
     *
     * @return A grid coverage that contains the supplied grid geometry
     *
     * @throws IllegalArgumentException
     * @throws IOException
     */
    @Override
    public GridCoverage2D read(String coverageName, GeneralParameterValue[] parameters) throws IllegalArgumentException, IOException {
//        GridCoverage2D origCoverage = read_original(coverageName, parameters);
//        GridCoverage2D newCoverage = read_new(coverageName, parameters);
        GridCoverage2D newestCoverage = read_newest(coverageName, parameters);

        return newestCoverage;
    }

    private GridCoverage2D read_original(String coverageName, GeneralParameterValue[] parameters) throws IllegalArgumentException, IOException {
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
                                final MathTransform gridToWorldCorner = getOriginalGridToWorld(coverageName, PixelInCell.CELL_CORNER);
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
                    }
                    if (name.equals(AbstractGridFormat.INPUT_TRANSPARENT_COLOR.getName())) {
                        inputTransparentColor = (Color) param.getValue();
                    }
                }
            }
            final int xAxis = (CRS.getAxisOrder(requestedEnvelope.getCoordinateReferenceSystem()) == CRS.AxisOrder.EAST_NORTH ? 0 : 1);
            final int yAxis = 1 - xAxis;
            int leftTile, topTile, rightTile, bottomTile;

            //find the closest zoom based on horizontal resolution
            TileMatrix bestMatrix = null;
            if (requestedEnvelope != null && dim != null) {
                //requested res
                // TODO: Replace this with a call to getResolution(coverage)
                double horRes = requestedEnvelope.getSpan(xAxis) / dim.getWidth(); //proportion of total width that is being requested
                double worldSpan = crs.getCoordinateSystem().getAxis(xAxis).getMaximumValue() - crs.getCoordinateSystem().getAxis(xAxis).getMinimumValue();

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
                double remX = (requestedEnvelope.getMinimum(xAxis) - originX) % resX;
                double remY = (originY - requestedEnvelope.getMaximum(yAxis)) % resY;
                boolean extentsWithinAPixel = (remX < pixSizeX) && (remY < pixSizeY);
                boolean identicalTileSize = (dim != null && dim.getWidth() == tileWidth && dim.getHeight() == tileHeight);
                if (identicalTileSize && extentsWithinAPixel) {
                    leftTile = Math.max(leftTile, (int) Math.round((requestedEnvelope.getMinimum(xAxis) - originX) / resX));
                    topTile = Math.max(topTile, (int) Math.round((originY - requestedEnvelope.getMaximum(yAxis)) / resY));
                    rightTile = leftTile;
                    bottomTile = topTile;
                } else {
                    leftTile = Math.max(leftTile, (int) Math.round(Math.floor((requestedEnvelope.getMinimum(xAxis) - originX) / resX)));
                    rightTile = Math.max(leftTile, (int) Math.min(rightTile, Math.round(Math.floor((requestedEnvelope.getMaximum(xAxis) - originX) / resX))));
                    topTile = Math.max(topTile, (int) Math.round(Math.floor((originY - requestedEnvelope.getMaximum(yAxis)) / resY)));
                    bottomTile = Math.max(topTile, (int) Math.min(bottomTile, Math.round(Math.floor((originY - requestedEnvelope.getMinimum(yAxis)) / resY))));
                }
            }

            int width = (int) (rightTile - leftTile + 1) * tileWidth;
            int height = (int) (bottomTile - topTile + 1) * tileHeight;

            // Recalculate the envelope we are actually returning
            // TODO: should ensure x/y ordering matches CRS
            resultEnvelope = new ReferencedEnvelope(
                    originX + leftTile * resX,
                    originX + (rightTile + 1) * resX,
                    originY - topTile * resY,
                    originY - (bottomTile + 1) * resY, crs);

            TileReader it;
            it = file.reader(entry, bestMatrix.getZoomLevel(), bestMatrix.getZoomLevel(), leftTile, rightTile, topTile, bottomTile);

            while (it.hasNext()) {
                Tile tile = it.next();

                // Get the image data using an ImageReader
                BufferedImage tileImage = createImageFromBytes(tile.getData());

                ////////////////////////////////////////////////////////////////
                // DEBUGGING: Uncomment block to draw a border around the tiles
                {
                    Graphics2D graphics = tileImage.createGraphics();
                    float thickness = 2;
                    graphics.setStroke(new BasicStroke(thickness));
                    graphics.drawRect(0, 0, tileImage.getWidth(), tileImage.getHeight());
                    graphics.drawString(
                            "Row: " + tile.getRow()
                            + "\nCol: " + tile.getColumn()
                            + "\nZoom: " + tile.getZoom(), 10, 100);
                }

                // Create the destination image that we draw into
                if (image == null) {
                    image = createImage(width, height, inputTransparentColor);
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
                image = createImage(width, height, inputTransparentColor);
            }

            // Apply the color transparency mask
            if (inputTransparentColor != null) {
                // Note: ImageWorker.makeColorTransparent only works 
                // with an IndexColorModel or a ComponentColorModel
                image = new ImageWorker(image).makeColorTransparent(inputTransparentColor).getRenderedOperation().getAsBufferedImage();
            }
        } catch (Exception e) {
            System.out.println("*****************" + e.getMessage());
            LOGGER.log(Level.SEVERE, "read_original", e);

        } finally {
            file.close();
        }
        return coverageFactory.create(entry.getTableName(), image, resultEnvelope);
    }

    private GridCoverage2D read_new(String coverageName, GeneralParameterValue[] params) throws IllegalArgumentException, IOException {
        TileEntry tileset = getTileset(coverageName);
        CoordinateReferenceSystem crs1 = getCoordinateReferenceSystem(coverageName);
        final int xAxis = (CRS.getAxisOrder(crs1) == CRS.AxisOrder.EAST_NORTH ? 0 : 1);
        final int yAxis = 1 - xAxis;

        ReferencedEnvelope requestedEnvelope = null;
        Rectangle dim = null;
        Color inputTransparentColor = null;
        OverviewPolicy overviewPolicy = null;
        // Extract the input parameters
        if (params != null) {
            for (GeneralParameterValue parameter : params) {
                final ParameterValue param = (ParameterValue) parameter;
                final ReferenceIdentifier name = param.getDescriptor().getName();
                // Extract requested envelope and dimensions.
                if (name.equals(AbstractGridFormat.READ_GRIDGEOMETRY2D.getName())) {
                    final GridGeometry2D gg = (GridGeometry2D) param.getValue();
                    try {
                        // Create a request envelope in the same CRS as the coverage
                        requestedEnvelope = ReferencedEnvelope.create(
                                gg.getEnvelope(),
                                gg.getCoordinateReferenceSystem()).transform(crs1, true);
                    } catch (TransformException | FactoryException ex) {
                        LOGGER.log(Level.SEVERE, null, ex);
                        requestedEnvelope = null;
                    }
                    dim = gg.getGridRange2D().getBounds();
                    continue;
                }
                // Extract the input transparent color
                if (name.equals(AbstractGridFormat.INPUT_TRANSPARENT_COLOR.getName())) {
                    inputTransparentColor = (Color) param.getValue();
                    continue;
                }
                if (name.equals(AbstractGridFormat.OVERVIEW_POLICY.getName())) {
                    overviewPolicy = (OverviewPolicy) param.getValue();
                    continue;
                }
            }
        }

        if (requestedEnvelope == null) {
            throw new IllegalArgumentException(
                    "The request envelope could not be extracted from the READ_GRIDGEOMETRY2D param");
        }
        if (dim == null) {
            throw new IllegalArgumentException(
                    "The request dimensions could not be extracted from the READ_GRIDGEOMETRY2D param");
        }

        // TODO: check for an interpolation setting/param/hint
        double[] requestedRes = getResolution(new GeneralEnvelope(requestedEnvelope), dim, crs1);
        if (overviewPolicy == null) {
            overviewPolicy = extractOverviewPolicy();
        }
        int zoomLevel = pickZoomLevel(coverageName, overviewPolicy, requestedRes);
        zoomLevel = Math.min(Math.max(zoomLevel, tileset.getMinZoomLevel()), tileset.getMaxZoomLevel());

        TileMatrix matrix = tileset.getTileMatrix(zoomLevel);
        // TODO: origin should be gppk_tile_matrix_set values, not CRS values
        final double xOrigin = crs1.getCoordinateSystem().getAxis(xAxis).getMinimumValue(); // left
        final double yOrigin = crs1.getCoordinateSystem().getAxis(yAxis).getMaximumValue(); // top
        final double xMin = requestedEnvelope.getMinimum(xAxis);
        final double xMax = requestedEnvelope.getMaximum(xAxis);
        final double yMin = requestedEnvelope.getMinimum(yAxis);
        final double yMax = requestedEnvelope.getMaximum(yAxis);
        // Get pixel values of the source image data
        final double xPixelSize = matrix.getXPixelSize();
        final double yPixelSize = matrix.getYPixelSize();
        final double tileColSpan = matrix.getTileWidth() * xPixelSize;
        final double tileRowSpan = matrix.getTileHeight() * yPixelSize;
        // Compute the tile bounds that intersect the requested envelope
        int startCol = (int) ((xMin - xOrigin) / tileColSpan);
        int endCol = (int) ((xMax - xOrigin) / tileColSpan);
        int startRow = (int) ((yOrigin - yMax) / tileRowSpan);
        int endRow = (int) ((yOrigin - yMin) / tileRowSpan);

        // Read the tiles into an image
        BufferedImage srcImage = readTiles(coverageName, zoomLevel, startCol, endCol, startRow, endRow, inputTransparentColor);

        // Copy the src image into the dest image, cropping the image as required                
        // TODO: if src and dest images have the same dimensions, then return src image
        double xImgOrigin = xOrigin + (startCol * tileColSpan);
        double yImgOrigin = yOrigin - (startRow * tileRowSpan);
        int sx = (int) ((xMin - xImgOrigin) / xPixelSize);
        int sy = (int) ((yImgOrigin - yMax) / yPixelSize);
        int width = (int) ((xMax - xMin) / xPixelSize);
        int height = (int) ((yMax - yMin) / yPixelSize);
        BufferedImage destImage = createImage(width, height, inputTransparentColor);
        Graphics2D g2 = destImage.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);

        g2.drawImage(srcImage,
                0, //int dx1,
                0, //int dy1,
                width, //int dx2,
                height, //int dy2,
                sx, //int sx1,
                sy, //int sy1,
                sx + width, //int sx2,
                sy + height, //int sy2,
                null); //ImageObserver observer)
        g2.dispose();

//        ReferencedEnvelope resultEnvelope = new ReferencedEnvelope(
//                xImgOrigin,
//                xImgOrigin + (width * xPixelSize),
//                yImgOrigin - (height * yPixelSize),
//                yImgOrigin,
//                crs1);
        // Create a coverage from the image
        return coverageFactory.create(coverageName, destImage, requestedEnvelope);
    }


    /**
     * Read the GeoPackage into a coverage raster via a GeoPackageImageReader
     * and a JAI "ImageRead" operation.
     *
     * @param coverageName
     * @param params
     * @return
     * @throws IllegalArgumentException
     * @throws IOException
     */
    private GridCoverage2D read_newest(String coverageName, GeneralParameterValue[] params) throws IllegalArgumentException, IOException {
        TileEntry tileset = getTileset(coverageName);
        CoordinateReferenceSystem crs1 = getCoordinateReferenceSystem(coverageName);
        final int xAxis = (CRS.getAxisOrder(crs1) == CRS.AxisOrder.EAST_NORTH ? 0 : 1);
        final int yAxis = 1 - xAxis;

        //ReferencedEnvelope requestedEnvelope = null;
        GeneralEnvelope requestedEnvelope = null;
        Rectangle dim = null;
        Color inputTransparentColor = null;
        OverviewPolicy overviewPolicy = null;
        // Extract the input parameters
        if (params != null) {
            for (GeneralParameterValue parameter : params) {
                final ParameterValue param = (ParameterValue) parameter;
                final ReferenceIdentifier name = param.getDescriptor().getName();
                // Extract requested envelope and dimensions.
                if (name.equals(AbstractGridFormat.READ_GRIDGEOMETRY2D.getName())) {
                    final GridGeometry2D gg = (GridGeometry2D) param.getValue();
                    requestedEnvelope = new GeneralEnvelope((org.opengis.geometry.Envelope) gg.getEnvelope2D());
                    dim = gg.getGridRange2D().getBounds();
                    continue;
                }
                // Extract the input transparent color
                if (name.equals(AbstractGridFormat.INPUT_TRANSPARENT_COLOR.getName())) {
                    inputTransparentColor = (Color) param.getValue();
                    continue;
                }
                if (name.equals(AbstractGridFormat.OVERVIEW_POLICY.getName())) {
                    overviewPolicy = (OverviewPolicy) param.getValue();
                    continue;
                }
                //  TODO: Extract interpolation
            }
        }

        if (requestedEnvelope == null) {
            throw new IllegalArgumentException(
                    "The request envelope could not be extracted from the READ_GRIDGEOMETRY2D param");
        }
        if (dim == null) {
            throw new IllegalArgumentException(
                    "The request dimensions could not be extracted from the READ_GRIDGEOMETRY2D param");
        }

        //
        // Initialize/set the readParams
        //
        Integer imageChoice = 0;
        final ImageReadParam readParams = new ImageReadParam();
        try {
            imageChoice = setReadParams(coverageName, overviewPolicy, readParams, requestedEnvelope, dim);
        } catch (TransformException e) {
            throw new DataSourceException(e);
        }

        int overviewImageIndex = getDatasetLayout(coverageName).getInternalOverviewImageIndex(imageChoice);
        int index = overviewImageIndex >= 0 ? overviewImageIndex : 0;

        //
        // IMAGE READ OPERATION
        //
        Hints newHints = null;
//        if (suggestedTileSize != null) {
//            newHints = hints.clone();
//            final ImageLayout layout = new ImageLayout();
//            layout.setTileGridXOffset(0);
//            layout.setTileGridYOffset(0);
//            layout.setTileHeight(suggestedTileSize[1]);
//            layout.setTileWidth(suggestedTileSize[0]);
//            newHints.add(new RenderingHints(JAI.KEY_IMAGE_LAYOUT, layout));
//        }

//        GridEnvelope gridRange = getOriginalGridRange(coverageName);
//        int hrWidth = gridRange.getSpan(0);
//        int hrHeight = gridRange.getSpan(1);
//        final ImageLayout layout = getImageLayout(coverageName);
//        final ImageLayout finalLayout = new ImageLayout(
//                0, 0,                                           // minX, minY, 
//                hrWidth / readParams.getSourceXSubsampling(),   // width
//                hrHeight / readParams.getSourceYSubsampling(),  // height
//                0, 0,                                           // tileGridXOffset, tileGridYOffset,
//                layout.getTileWidth(null),
//                layout.getTileHeight(null),
//                layout.getSampleModel(null),
//                layout.getColorModel(null));
//
//        final RenderingHints newHints = new RenderingHints(JAI.KEY_IMAGE_LAYOUT, finalLayout);
        final ParameterBlock pbjRead = new ParameterBlock();
        ImageInputStream iis = ImageIO.createImageInputStream(sourceFile);
        pbjRead.add(iis);               // Input: the image source
        pbjRead.add(index);             // ImageChoice: the image index(s) to read
        pbjRead.add(Boolean.FALSE);     // ReadMetadata:
        pbjRead.add(Boolean.FALSE);     // ReadThumbnails:
        pbjRead.add(Boolean.FALSE);     // VerifyInput:
        pbjRead.add(null);              // Listeners:
        pbjRead.add(null);              // Locale:
        pbjRead.add(readParams);        // ReadParam:
        pbjRead.add(new GeoPackageImageReaderSpi().createReaderInstance()); // Reader:

        RenderedOp coverageRaster = JAI.create("ImageRead", pbjRead, newHints != null ? (RenderingHints) newHints : null);
        iis.close();

        //
        // MASKING INPUT COLOR as indicated
        //
        if (inputTransparentColor != null) {
            coverageRaster = new ImageWorker(coverageRaster).setRenderingHints(newHints).makeColorTransparent(inputTransparentColor).getRenderedOperation();
        }
        //
        // BUILDING COVERAGE
        //
        AffineTransform rasterToModel = getRescaledRasterToModel(coverageRaster);
        try {
            return createCoverage(coverageName, coverageRaster, ProjectiveTransform.create(rasterToModel));
        } catch (Exception e) {
            // dispose and close file
            ImageUtilities.disposePlanarImageChain(coverageRaster);

            // rethrow
            if (e instanceof DataSourceException) {
                throw (DataSourceException) e;
            }
            throw new DataSourceException(e);
        }
    }

    protected MathTransform getGridToEnvelope(String coverageName) {
        final GridToEnvelopeMapper geMapper = new GridToEnvelopeMapper(
                getOriginalGridRange(coverageName),
                getOriginalEnvelope(coverageName));
        geMapper.setPixelAnchor(PixelInCell.CELL_CENTER);

        return geMapper.createTransform();
    }

    /**
     * Computes the raster to model of a rescaled output raster, based on the
     * original transform and output raster scaling factor
     *
     * @param coverageRaster
     * @return
     */
    @Override
    protected AffineTransform getRescaledRasterToModel(RenderedImage coverageRaster) {
        final int ssWidth = coverageRaster.getWidth();
        final int ssHeight = coverageRaster.getHeight();
        if (LOGGER.isLoggable(Level.FINE)) {
            LOGGER.log(Level.FINE, "Coverage read: width = {0} height = {1}", new Object[]{ssWidth, ssHeight});
        }

        // //
        //
        // setting new coefficients to define a new affineTransformation
        // to be applied to the grid to world transformation
        // -----------------------------------------------------------------------------------
        //
        // With respect to the original envelope, the obtained planarImage
        // needs to be rescaled. The scaling factors are computed as the
        // ratio between the output raster sizes and the original sizes
        // (this correctly accounts for odd sized overviews)
        // //
        GridEnvelope originalGridRange1 = getOriginalGridRange(coverageName);

        final double scaleX = originalGridRange1.getSpan(0) / (1.0 * ssWidth);
        final double scaleY = originalGridRange1.getSpan(1) / (1.0 * ssHeight);
        final AffineTransform tempRaster2Model = new AffineTransform((AffineTransform) getGridToEnvelope(coverageName));
        AffineTransform scale = new AffineTransform(scaleX, 0, 0, scaleY, 0, 0);
        if (!XAffineTransform.isIdentity(scale, EPS)) {
            // the transformation includes the pixel is center shift, we need to
            // remove it before rescaling, and then apply it back later
            tempRaster2Model.concatenate(CoverageUtilities.CENTER_TO_CORNER);
            tempRaster2Model.concatenate(scale);
            tempRaster2Model.concatenate(CoverageUtilities.CORNER_TO_CENTER);
        }

        return tempRaster2Model;
    }

    /**
     * Creates a {@link GridCoverage} for the provided {@link PlanarImage} using
     * the {@link #raster2Model} that was provided for this coverage.
     *
     *
     * @param coverageName
     * @param image contains the data for the coverage to create.
     * @param raster2Model is the {@link MathTransform} that maps from the
     * raster space to the model space.
     * @return a {@link GridCoverage}
     * @throws IOException
     */
    protected final GridCoverage2D createCoverage(String coverageName, PlanarImage image, MathTransform raster2Model) throws IOException {
        // Creating bands
        final SampleModel sm = image.getSampleModel();
        final ColorModel cm = image.getColorModel();
        final int numBands = sm.getNumBands();
        final GridSampleDimension[] bands = new GridSampleDimension[numBands];

        for (int i = 0; i < numBands; i++) {
            final ColorInterpretation colorInterpretation = TypeMap.getColorInterpretation(cm, i);
            if (colorInterpretation == null) {
                throw new IOException("Unrecognized sample dimension type");
            }
            Category[] categories = null;
            String bandName = colorInterpretation.name();
            // make sure we create no duplicate band names
            if (colorInterpretation == ColorInterpretation.UNDEFINED) {
                bandName = "Band" + (i + 1);
            }
            bands[i] = new GridSampleDimension(bandName, categories, null);
        }

        // Creating coverage
        // BDS: Something's missing. this isn't translating from the tile origin to the image origin
//        CoordinateReferenceSystem crs1 = getCoordinateReferenceSystem(coverageName);
//        if (raster2Model != null) {
//            return coverageFactory.create(coverageName, image, crs1, raster2Model, bands, null, null);
//        }
        return coverageFactory.create(coverageName, image, new GeneralEnvelope(getOriginalEnvelope(coverageName)), bands, null, null);

    }

    /**
     * Reads the default coverage's raster tile data intersecting the given
     * region into a {@link BufferedImage}. Called by {@link GeoPackageImageReader).
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
    public BufferedImage readTiles(String coverageName, int zoomLevel, Rectangle region, Color inputTransparentColor)
            throws IllegalArgumentException, IOException {
        // Compute the index of the left-most tile
        TileEntry pyramid = getTileset(coverageName);
        TileMatrix matrix = pyramid.getTileMatrix(zoomLevel);
        GridEnvelope gridRange = getGridRange(zoomLevel);

        // Get pixel values of the source image data
        final int tileWidth = matrix.getTileWidth();
        final int tileHeight = matrix.getTileHeight();
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
        final int endCol = matrix.getMinCol() + ((regionX + region.width) / tileWidth);
        final int endRow = matrix.getMinRow() + ((regionY + region.height) / tileHeight);

        // Read the tiles into an image
        BufferedImage srcImage = readTiles(coverageName, zoomLevel, startCol, endCol, startRow, endRow, inputTransparentColor);

        // Copy the src image into the dest image, cropping the image as required                
        // TODO: if src and dest images have the same dimensions, then return src image
        BufferedImage destImage = createImage(region.width, region.height, inputTransparentColor);

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

        return destImage;
    }

    /**
     * Reads the raster tile data into a BufferedImage.
     *
     * @param coverageName
     * @param zoomLevel
     * @param startCol
     * @param endCol
     * @param startRow
     * @param endRow
     * @param inputTransparentColor
     * @return
     * @throws IOException
     */
    protected BufferedImage readTiles(String coverageName, int zoomLevel,
            int startCol, int endCol, int startRow, int endRow, Color inputTransparentColor)
            throws IllegalArgumentException, IOException {
        TileEntry tileset = getTileset(coverageName);
        TileMatrix matrix = tileset.getTileMatrix(zoomLevel);
        GeoPackage file = new GeoPackage(sourceFile);
        final int tileWidth = matrix.getTileWidth();
        final int tileHeight = matrix.getTileHeight();
        final int matrixPixWidth = (endCol - startCol + 1) * tileWidth;
        final int matrixPixHeight = (endRow - startRow + 1) * tileHeight;

        // Create the image to hold the tiles.
        BufferedImage srcImage = createImage(matrixPixWidth, matrixPixHeight, inputTransparentColor);
        try {
            Graphics2D g2 = srcImage.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
            // Open a tile reader on the result set matching the zoom level and the tile indices
            TileReader it = file.reader(tileset, zoomLevel, zoomLevel, startCol, endCol, startRow, endRow);
            try {

                while (it.hasNext()) {

                    // Read the tile's image data into a BufferedImage
                    Tile tile = it.next();
                    BufferedImage tileImage = createImageFromBytes(tile.getData());

                    // DEBUGGING: Uncomment block to draw a border around the tiles
                    {
                        Graphics2D graphics = tileImage.createGraphics();
                        float thickness = 2;
                        graphics.setStroke(new BasicStroke(thickness));
                        graphics.drawRect(0, 0, tileImage.getWidth(), tileImage.getHeight());
                        graphics.drawString("Row: " + tile.getRow(), 100, 100);
                        graphics.drawString("Col: " + tile.getColumn(), 100, 120);
                        graphics.drawString("Zoom: " + tile.getZoom(), 100, 140);
                        graphics.dispose();
                    }
                    // Get the tile coordinates within the mosaic
                    int posx = (tile.getColumn() - startCol) * tileWidth;
                    int posy = (tile.getRow() - startRow) * tileHeight;

                    // Draw the tile. We 'draw' versus using 'copy data' to 
                    // accomdate potentially different SampleModels between image tiles,
                    // e.g., when there's a mix of PNG and JPEG image types in the table.
                    g2.drawImage(tileImage, posx, posy, tileWidth, tileHeight, null);

                }
            } finally {
                it.close();
                g2.dispose();
            }
            // Apply the color transparency mask
            if (inputTransparentColor != null) {
                // Note: ImageWorker.makeColorTransparent only works 
                // with an IndexColorModel or a ComponentColorModel
                srcImage = new ImageWorker(srcImage).makeColorTransparent(inputTransparentColor).getRenderedOperation().getAsBufferedImage();
            }
        } catch (Exception e) {
            System.out.println("*****************" + e.getMessage());
            LOGGER.log(Level.SEVERE, "readTiles", e);

        } finally {
            file.close();
        }
        return srcImage;
    }

    /**
     * Maybe used by GeoPackageImageReader.readTile().
     *
     * @param zoomLevel
     * @param tileX a matrix tile index
     * @param tileY a matrix tile index
     * @return A BufferedImage containing the specified tile
     * @throws java.io.IOException
     */
    public BufferedImage readTile(int zoomLevel, int tileX, int tileY) throws IOException {
        TileEntry tileset = getTileset(coverageName);
        GeoPackage gpkg = new GeoPackage(sourceFile);
        BufferedImage tileImage = null;
        TileReader it = gpkg.reader(tileset, zoomLevel, zoomLevel, tileX, tileX, tileY, tileY);
        try {
            while (it.hasNext()) {
                Tile tile = it.next();
                // Convert the tile image data to a BufferedImage
                tileImage = createImageFromBytes(tile.getData());
            }
        } finally {
            it.close();
            gpkg.close();
        }
        return tileImage;
    }

    /**
     * Creates a BufferedImage from the supplied image data byte array.
     *
     * @param data A byte array containing image data
     * @return A new BufferedImage
     * @throws IOException
     */
    protected static BufferedImage createImageFromBytes(byte[] data) throws IOException {
        ImageReader reader = null;
        try {
            ByteArrayInputStream source = new ByteArrayInputStream(data);
            ImageInputStream iis = ImageIO.createImageInputStream(source);

            Iterator<?> readers = ImageIO.getImageReaders(iis);
            reader = (ImageReader) readers.next();
            if (reader == null) {
                LOGGER.log(Level.SEVERE, "Could not find an ImageReader for a GeoPackage's ByteArrayInputStream.");
                return null;
            }
            reader.setInput(iis, true);
            ImageReadParam param = reader.getDefaultReadParam();

            return reader.read(0, param);

        } finally {
            if (reader != null) {
                reader.dispose();
            }
        }
    }

    /**
     * Creates a transparent image suitable for rendering tiles into.
     *
     * @param width The width of the new image
     * @param height The height of the new image
     * @param inputTransparentColor
     * @return A new BufferedImage with transparent fill.
     */
    protected BufferedImage createImage(int width, int height, Color inputTransparentColor) {

        // ImageWorker.makeColorTransparent used in the read method only 
        // works images with a a ComponentColorModel or IndexColorModel
        int imageType = (inputTransparentColor != null)
                ? /*ComponentColorModel*/ BufferedImage.TYPE_4BYTE_ABGR
                : /*DirectColorModel*/ BufferedImage.TYPE_INT_ARGB;

        BufferedImage image = new BufferedImage(width, height, imageType);

        // Fill with white transparent background
        Graphics2D g2D = (Graphics2D) image.getGraphics();
        Color save = g2D.getColor();
        g2D.setColor(new Color(255, 255, 255, 0));
        g2D.fillRect(0, 0, image.getWidth(), image.getHeight());
        g2D.setColor(save);
        g2D.dispose();

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
    protected BufferedImage createImage(BufferedImage copyFrom, int width, int height) {
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
        TileEntry tileset = getTileset(coverageName);
        ReferencedEnvelope bounds = tileset.getBounds();
        TileMatrix matrix = tileset.getTileMatrix(zoomLevel);
        CoordinateSystem coordSys = tileset.getCrs().getCoordinateSystem();
        final int xAxis = (CRS.getAxisOrder(bounds.getCoordinateReferenceSystem()) == CRS.AxisOrder.EAST_NORTH ? 0 : 1);
        final int yAxis = 1 - xAxis;

        double originX = coordSys.getAxis(xAxis).getMinimumValue(); // left
        double originY = coordSys.getAxis(yAxis).getMinimumValue(); // top
        double extentX = coordSys.getAxis(xAxis).getMaximumValue(); // right
        double extentY = coordSys.getAxis(yAxis).getMaximumValue(); // bottom
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
}
