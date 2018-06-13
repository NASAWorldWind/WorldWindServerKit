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

import org.geotools.geopkg.mosaic.GeoPackageReader;
import org.geotools.geopkg.mosaic.GeoPackageFormat;
import org.geotools.geopkg.TileEntry;
import org.geotools.geopkg.TileMatrix;
import java.awt.Color;
import java.awt.Dimension;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.RenderedImage;
import java.io.IOException;
import java.net.URL;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.media.jai.ImageLayout;
import static junit.framework.TestCase.assertNull;
import static junit.framework.TestCase.fail;

import org.geotools.coverage.grid.GridCoverage2D;
import org.geotools.coverage.grid.GridEnvelope2D;
import org.geotools.coverage.grid.GridGeometry2D;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.coverage.grid.io.OverviewPolicy;
import org.geotools.data.DataUtilities;
import org.geotools.data.ResourceInfo;
import org.geotools.geometry.GeneralEnvelope;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.image.test.ImageAssert;
import org.geotools.parameter.Parameter;
import org.geotools.referencing.CRS;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.junit.After;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assume.assumeNotNull;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.opengis.coverage.grid.Format;
import org.opengis.coverage.grid.GridEnvelope;
import org.opengis.parameter.GeneralParameterValue;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CoordinateReferenceSystem;

public class GeoPackageReaderTest {

    public final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    public final static String COVERAGE_NAME = "GeoPackageTutorial";
    public final static int NUM_ZOOM_LEVELS = 6;
    public final static int MAX_ZOOM_LEVEL = 16;

    // ORIGINAL_ENVELOPE report by GDAL
    public final static ReferencedEnvelope ORIGINAL_ENVELOPE = new ReferencedEnvelope(
            -76.0637651, -76.0014413, 36.7975956, 36.8303400, DefaultGeographicCRS.WGS84);

    // GRID_RANGE width, height values are reported by GDAL.
    // GRID_RANGE x,y values are simply recorded values so the unit test can detect a change.
    public final static GridEnvelope ORIGINAL_GRID_RANGE = new GridEnvelope2D(7, 124, 5809, 3052);
    public final static GridEnvelope LEVEL_15_GRID_RANGE = new GridEnvelope2D(4, 62, 2905, 1526);
    public final static GridEnvelope LEVEL_14_GRID_RANGE = new GridEnvelope2D(130, 159, 1452, 763);
    public final static GridEnvelope LEVEL_13_GRID_RANGE = new GridEnvelope2D(65, 207, 726, 382); // GDAL reports 381 (using 382 so test will pass)
    public final static GridEnvelope LEVEL_12_GRID_RANGE = new GridEnvelope2D(32, 232, 363, 191);
    public final static GridEnvelope LEVEL_11_GRID_RANGE = new GridEnvelope2D(144, 244, 182, 95);

    // Test specific values
    private final static ReferencedEnvelope ZOOMLEVEL_12_BBOX = new ReferencedEnvelope(
            -76.0693359375, -75.9814453125, 36.7822265625, 36.8701171875, DefaultGeographicCRS.WGS84);

    private URL source;

    @Before
    public void setUp() {
        source = getClass().getResource(GEOPACKAGE);
    }

    @After
    public void tearDown() {
        source = null;
    }

    @Test
    public void testCheckName() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        boolean coverageFound = reader.checkName(COVERAGE_NAME);

        assertTrue(COVERAGE_NAME + "  must exist in " + GEOPACKAGE, coverageFound);
    }

    @Test
    public void testCheckName_not_exists() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        boolean coverageFound = reader.checkName("a-bogus-name");

        assertTrue(!coverageFound);
    }

    @Test(expected = NullPointerException.class)
    public void testCheckName_null() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        reader.checkName(null);

        fail("Expected NPE to be thrown");
    }

    @Test
    public void testGetTileset() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        TileEntry result = instance.getTileset();

        assertNotNull(result);
    }

    @Test
    public void testGetTileset_coverage_name() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        TileEntry result = instance.getTileset(COVERAGE_NAME);

        assertNotNull(result);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testGetTileset_bad_name() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        instance.getTileset("a-bogus-name");

        fail("Expected IllegalArgumentException to be thrown");
    }

    @Test
    public void testGetInfo() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        ResourceInfo info = reader.getInfo(COVERAGE_NAME);

        assertNotNull("ResourceInfo must not be null", info);
        assertEquals(COVERAGE_NAME, info.getName());
        assertEquals(COVERAGE_NAME, info.getTitle());

        System.out.println("Name: " + info.getName());
        System.out.println("Title: " + info.getTitle());
        System.out.println("Desc: " + info.getDescription());
        System.out.println("CRS: " + info.getCRS());
        System.out.println("Bounds:" + info.getBounds());
    }

    @Test
    public void testGetInfo_not_exists() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        ResourceInfo info = reader.getInfo("a-bogus-name");

        assertNull("ResourceInfo must null for none existant coverages", info);
    }

    @Test
    public void testGetNumOverviews() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        int numOverviews = reader.getNumOverviews();

        assertEquals("Num overviews should be one less than number of levels", NUM_ZOOM_LEVELS - 1, numOverviews);
    }

    @Test
    public void testGetGridCoverageNames() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        String[] result = instance.getGridCoverageNames();

        assertEquals("Number of coverage names", 1, result.length);
        assertEquals("Coverage name", COVERAGE_NAME, result[0]);
    }

    @Test
    public void testGetGridCoverageCount() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        int expResult = 1;

        int result = instance.getGridCoverageCount();

        assertEquals("Coveage count", expResult, result);
    }

    @Test
    public void testGetTileSize() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        Dimension expResult = new Dimension(256, 256);
        for (int i = 0; i < NUM_ZOOM_LEVELS; i++) {
            int zoomLevel = MAX_ZOOM_LEVEL - i;

            Dimension result = instance.getTileSize(COVERAGE_NAME, zoomLevel);

            assertEquals(expResult, result);
        }
    }

    @Test
    public void testGetResolution() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);
        TileMatrix matrix = reader.getTileset(COVERAGE_NAME).getTileMatrix(15);
        // Computed expected resolution
        int numPixelsX = matrix.getMatrixWidth() * matrix.getTileWidth();
        int numPixelsY = matrix.getMatrixHeight() * matrix.getTileHeight();
        double expectResX = 360.0 / numPixelsX;
        double expectResY = 180.0 / numPixelsY;

        // Get resolution
        double[] resXY = reader.getResolution(COVERAGE_NAME, 15);

        assertEquals(expectResX, resXY[0], 0.000001);
        assertEquals(expectResY, resXY[1], 0.000001);

    }

    @Test
    public void testGetResolutionLevels() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);
        // Get expected resolution at a zoom level
        int zoomLevel = 15;
        double[] expectResXY = reader.getResolution(COVERAGE_NAME, zoomLevel);
        int numImages = reader.getNumOverviews(COVERAGE_NAME) + 1;
        int imageIndex = reader.getTileset(COVERAGE_NAME).getMaxZoomLevel() - zoomLevel;

        // Get resolutions [imageIndex][resolution]
        double[][] resolutionLevels = reader.getResolutionLevels();

        // Assert expected resolution at zoom level is same in the array
        assertEquals(numImages, resolutionLevels.length);
        assertEquals(expectResXY[0], resolutionLevels[imageIndex][0], 0.000001);
        assertEquals(expectResXY[1], resolutionLevels[imageIndex][1], 0.000001);
    }

    @Test
    public void testGetHighestRes() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        TileMatrix matrix = instance.getTileset(COVERAGE_NAME).getTileMatrix(MAX_ZOOM_LEVEL);
        // Computed expected resolution
        int numPixelsX = matrix.getMatrixWidth() * matrix.getTileWidth();
        int numPixelsY = matrix.getMatrixHeight() * matrix.getTileHeight();
        double expectResX = 360.0 / numPixelsX;
        double expectResY = 180.0 / numPixelsY;

        double[] result = instance.getHighestRes(COVERAGE_NAME);

        assertEquals(expectResX, result[0], 0.000001);
        assertEquals(expectResY, result[1], 0.000001);
    }

    @Test
    public void testPickZoomLevel_nearest() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);
        // Define a desired resolution near level 14
        double[] requestedRes = {3.5e-05, 3.5e-05}; // lonRes,latRes

        int zoomLevel = reader.pickZoomLevel(COVERAGE_NAME, OverviewPolicy.NEAREST, requestedRes);

        assertEquals("Nearest zoom level", 14, zoomLevel);
    }

    @Test
    public void testPickZoomLevel_speed() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);
        // Define a desired resolution near level 14
        double[] requestedRes = {3.5e-05, 3.5e-05}; // lonRes,latRes

        int zoomLevel = reader.pickZoomLevel(COVERAGE_NAME, OverviewPolicy.SPEED, requestedRes);

        assertEquals("Nearest zoom level", 14, zoomLevel);
    }

    @Test
    public void testPickZoomLevel_quality() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);
        // Define a desired resolution between level 14 and 15
        double[] requestedRes1 = {3.5e-05, 3.5e-05};
        // Define a desired resolution at level 15 exactly (values from tile_matrix)
        double[] requestedRes2 = {2.145767211914062e-05, 2.145767211914062e-05}; // Level 15 exactly

        int zoomLevel1 = reader.pickZoomLevel(COVERAGE_NAME, OverviewPolicy.QUALITY, requestedRes1);
        int zoomLevel2 = reader.pickZoomLevel(COVERAGE_NAME, OverviewPolicy.QUALITY, requestedRes2);

        assertEquals("Nearest zoom level", 15, zoomLevel1);
        assertEquals("Nearest zoom level", 15, zoomLevel2);
    }

    @Test
    public void testImageLayout() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader reader = new GeoPackageReader(source, null);

        ImageLayout imageLayout = reader.getImageLayout(COVERAGE_NAME);

        RenderedImage fallback = null;
        assertNotNull("ImageLayout must not be null", imageLayout);
        assertEquals("X", ORIGINAL_GRID_RANGE.getLow(0), imageLayout.getMinX(fallback));
        assertEquals("Y", ORIGINAL_GRID_RANGE.getLow(1), imageLayout.getMinY(fallback));
        assertEquals("WIDTH", ORIGINAL_GRID_RANGE.getSpan(0), imageLayout.getWidth(fallback));
        assertEquals("HEIGHT", ORIGINAL_GRID_RANGE.getSpan(1), imageLayout.getHeight(fallback));
        assertEquals("TILE WIDTH", 256, imageLayout.getTileWidth(fallback));
        assertEquals("TILE HEIGHT", 256, imageLayout.getTileWidth(fallback));
        assertEquals("TILE GRID X OFFSET", -7, imageLayout.getTileGridXOffset(fallback));   // test for change between versions
        assertEquals("TILE GRID Y OFFSET", -124, imageLayout.getTileGridYOffset(fallback)); // test for change between versions
    }

    @Test
    public void testZoomLevel_12() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        // Get an image from the coverage containing, but not cropped to, the bounding box 
        GeoPackageReader reader = new GeoPackageReader(source, null);
        GeneralParameterValue[] parameters = new GeneralParameterValue[1];
        GridGeometry2D gg = new GridGeometry2D(new GridEnvelope2D(new Rectangle(500, 500)), ZOOMLEVEL_12_BBOX);
        parameters[0] = new Parameter<>(AbstractGridFormat.READ_GRIDGEOMETRY2D, gg);

        GridCoverage2D gc = reader.read(COVERAGE_NAME, parameters);
        RenderedImage img = gc.getRenderedImage();

        assertEquals(ZOOMLEVEL_12_BBOX.getMinX(), gc.getEnvelope().getMinimum(0), 0.01);
        assertEquals(ZOOMLEVEL_12_BBOX.getMinY(), gc.getEnvelope().getMinimum(1), 0.01);
        assertEquals(ZOOMLEVEL_12_BBOX.getMaxX(), gc.getEnvelope().getMaximum(0), 0.01);
        assertEquals(ZOOMLEVEL_12_BBOX.getMaxY(), gc.getEnvelope().getMaximum(1), 0.01);
        assertEquals(512, img.getWidth());
        assertEquals(512, img.getHeight());

        assertTrue(CRS.equalsIgnoreMetadata(gc.getCoordinateReferenceSystem(), gc.getEnvelope().getCoordinateReferenceSystem()));
        //ImageIO.write(img, "png", DataUtilities.urlToFile(getClass().getResource("GeoPackageTutorial.png")));

        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("GeoPackageTutorial.png")), img, 2);

    }

    @Test
    public void testGetOriginalEnvelope() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        GeneralEnvelope expResult = new GeneralEnvelope(ORIGINAL_ENVELOPE);
        CRS.AxisOrder axisOrder1 = CRS.getAxisOrder(expResult.getCoordinateReferenceSystem());
        int x1 = axisOrder1 == CRS.AxisOrder.EAST_NORTH ? 0 : 1;
        int y1 = 1 - x1;

        GeneralEnvelope result = instance.getOriginalEnvelope(COVERAGE_NAME);

        CRS.AxisOrder axisOrder2 = CRS.getAxisOrder(result.getCoordinateReferenceSystem());
        int x2 = axisOrder2 == CRS.AxisOrder.EAST_NORTH ? 0 : 1;
        int y2 = 1 - x2;

        assertEquals(expResult.getMinimum(x1), result.getMinimum(x2), 0.000001);
        assertEquals(expResult.getMinimum(y1), result.getMinimum(y2), 0.000001);
        assertEquals(expResult.getMaximum(x1), result.getMaximum(x2), 0.000001);
        assertEquals(expResult.getMaximum(y1), result.getMaximum(y2), 0.000001);
    }

    @Test
    public void testGetOriginalGridRange() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        GridEnvelope result = instance.getOriginalGridRange(COVERAGE_NAME);

        assertEquals("X", ORIGINAL_GRID_RANGE.getLow(0), result.getLow(0));
        assertEquals("Y", ORIGINAL_GRID_RANGE.getLow(1), result.getLow(1));
        assertEquals("Width", ORIGINAL_GRID_RANGE.getSpan(0), result.getSpan(0));
        assertEquals("Height", ORIGINAL_GRID_RANGE.getSpan(1), result.getSpan(1));
    }

    @Test
    public void testGetGridRange() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        GridEnvelope result15 = instance.getGridRange(COVERAGE_NAME, 15);
        GridEnvelope result14 = instance.getGridRange(COVERAGE_NAME, 14);
        GridEnvelope result13 = instance.getGridRange(COVERAGE_NAME, 13);
        GridEnvelope result12 = instance.getGridRange(COVERAGE_NAME, 12);
        GridEnvelope result11 = instance.getGridRange(COVERAGE_NAME, 11);

        assertEquals("Level 15 X", LEVEL_15_GRID_RANGE.getLow(0), result15.getLow(0));
        assertEquals("Level 15 Y", LEVEL_15_GRID_RANGE.getLow(1), result15.getLow(1));
        assertEquals("Level 15 Width", LEVEL_15_GRID_RANGE.getSpan(0), result15.getSpan(0));
        assertEquals("Level 15 Height", LEVEL_15_GRID_RANGE.getSpan(1), result15.getSpan(1));
        assertEquals("Level 14 X", LEVEL_14_GRID_RANGE.getLow(0), result14.getLow(0));
        assertEquals("Level 14 Y", LEVEL_14_GRID_RANGE.getLow(1), result14.getLow(1));
        assertEquals("Level 14 Width", LEVEL_14_GRID_RANGE.getSpan(0), result14.getSpan(0));
        assertEquals("Level 14 Height", LEVEL_14_GRID_RANGE.getSpan(1), result14.getSpan(1));
        assertEquals("Level 13 X", LEVEL_13_GRID_RANGE.getLow(0), result13.getLow(0));
        assertEquals("Level 13 Y", LEVEL_13_GRID_RANGE.getLow(1), result13.getLow(1));
        assertEquals("Level 13 Width", LEVEL_13_GRID_RANGE.getSpan(0), result13.getSpan(0));
        assertEquals("Level 13 Height", LEVEL_13_GRID_RANGE.getSpan(1), result13.getSpan(1)); // off by one pixel
        assertEquals("Level 12 X", LEVEL_12_GRID_RANGE.getLow(0), result12.getLow(0));
        assertEquals("Level 12 Y", LEVEL_12_GRID_RANGE.getLow(1), result12.getLow(1));
        assertEquals("Level 12 Width", LEVEL_12_GRID_RANGE.getSpan(0), result12.getSpan(0));
        assertEquals("Level 12 Height", LEVEL_12_GRID_RANGE.getSpan(1), result12.getSpan(1));
        assertEquals("Level 11 X", LEVEL_11_GRID_RANGE.getLow(0), result11.getLow(0));
        assertEquals("Level 11 Y", LEVEL_11_GRID_RANGE.getLow(1), result11.getLow(1));
        assertEquals("Level 11 Width", LEVEL_11_GRID_RANGE.getSpan(0), result11.getSpan(0));
        assertEquals("Level 11 Height", LEVEL_11_GRID_RANGE.getSpan(1), result11.getSpan(1));
    }

    @Test
    public void testGetFormat() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        Format result = instance.getFormat();

        assertNotNull(result);
        assertTrue("Expect instanceof GeoPackageFormat", (result instanceof GeoPackageFormat));

    }

    @Test
    public void testGetCoordinateReferenceSystem() throws IOException, FactoryException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        CoordinateReferenceSystem expected = CRS.decode("EPSG:4326", true);

        CoordinateReferenceSystem result = instance.getCoordinateReferenceSystem(COVERAGE_NAME);

        assertNotNull(result);
        assertEquals(expected, result);
    }

    @Test
    public void testSetReadParams() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        OverviewPolicy overviewPolicy = OverviewPolicy.NEAREST;
        ImageReadParam readParams = new ImageReadParam();
        GeneralEnvelope requestedEnvelope = new GeneralEnvelope(ORIGINAL_ENVELOPE);
        Rectangle requestedDim = new Rectangle(ORIGINAL_GRID_RANGE.getSpan(0) / 2, ORIGINAL_GRID_RANGE.getSpan(1) / 2); // half the original size
        Integer expImageIndex = 1;  // Expecting first overview

        Integer imageIndex = instance.setReadParams(COVERAGE_NAME, overviewPolicy, readParams, requestedEnvelope, requestedDim);

        assertNotNull(imageIndex);
        assertEquals("imageIndex of first overview", expImageIndex, imageIndex);

    }

    @Test
    public void testDecimationOnReading() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        double[] resolution = instance.getResolution(COVERAGE_NAME, MAX_ZOOM_LEVEL);
        final int imageIndex = 0;
        ImageReadParam readParams = new ImageReadParam();
        final double[] requestedRes = {resolution[0] * 2, resolution[1] * 2}; // request the previous level

        instance.decimationOnReading(COVERAGE_NAME, imageIndex, readParams, requestedRes);

        // Expecting readParams to contain 1/2 the original resolution via subsampling
        int sourceXSubsampling = readParams.getSourceXSubsampling();
        int sourceYSubsampling = readParams.getSourceYSubsampling();
        int subsamplingXOffset = readParams.getSubsamplingXOffset();
        int subsamplingYOffset = readParams.getSubsamplingYOffset();
        assertEquals("sourceXSubsampling", 2, sourceXSubsampling);
        assertEquals("sourceYSubsampling", 2, sourceYSubsampling);
        assertEquals("subsamplingXOffset", 0, subsamplingXOffset);
        assertEquals("subsamplingYOffset", 0, subsamplingYOffset);
    }

    @Test
    public void testCreateImage_width_height_null() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        int width = 256;
        int height = 256;
        Color inputTransparentColor = null;

        // Create a blank image of the given width and height
        BufferedImage result = instance.createImage(width, height, inputTransparentColor);

        assertNotNull(result);
        assertEquals(width, result.getWidth());
        assertEquals(height, result.getHeight());
    }

    @Test
    public void testCreateImage_copyFrom_width_height() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        int width = 256;
        int height = 256;
        BufferedImage copyFrom = instance.createImage(width, height, null);

        BufferedImage result = instance.createImage(copyFrom, width, height);

        assertNotNull(result);
        assertEquals(width, result.getWidth());
        assertEquals(height, result.getHeight());
    }

    @Ignore
    @Test
    public void testcreateImage_fromBytes() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        byte[] data = null;
        BufferedImage result = GeoPackageReader.createImageFromBytes(data);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Test
    public void testReadTile() throws IOException {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        TileEntry tileset = instance.getTileset();
        int zoomLevel = tileset.getMaxZoomLevel();
        int tileX = tileset.getTileMatrix(zoomLevel).getMinCol();
        int tileY = tileset.getTileMatrix(zoomLevel).getMinRow();

        BufferedImage result = instance.readTile(zoomLevel, tileX, tileY);
        //ImageIO.write(result, "png", DataUtilities.urlToFile(getClass().getResource("testReadTile.png")));

        assertNotNull(result);
        assertEquals(256, result.getWidth());
        assertEquals(256, result.getHeight());
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testReadTile.png")), result, 2);
    }

    @Test
    public void testRead_params() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        GridGeometry2D gg = new GridGeometry2D(LEVEL_12_GRID_RANGE, ZOOMLEVEL_12_BBOX);
        final Parameter<GridGeometry2D> ggParam = (Parameter<GridGeometry2D>) AbstractGridFormat.READ_GRIDGEOMETRY2D.createValue();
        ggParam.setValue(gg);

        GridCoverage2D result = instance.read(new GeneralParameterValue[]{ggParam});
        RenderedImage renderedImage = result.getRenderedImage();
        //ImageIO.write(renderedImage, "png", DataUtilities.urlToFile(getClass().getResource("testRead_1.png")));

        assertNotNull(result);
        assertEquals(ZOOMLEVEL_12_BBOX, new ReferencedEnvelope(result.getEnvelope()));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testRead_1.png")), renderedImage, 2);
    }

    @Test
    public void testRead_coverage_params() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        GridGeometry2D gg = new GridGeometry2D(LEVEL_12_GRID_RANGE, ZOOMLEVEL_12_BBOX);
        final Parameter<GridGeometry2D> ggParam = (Parameter<GridGeometry2D>) AbstractGridFormat.READ_GRIDGEOMETRY2D.createValue();
        ggParam.setValue(gg);

        GridCoverage2D result = instance.read(COVERAGE_NAME, new GeneralParameterValue[]{ggParam});
        RenderedImage renderedImage = result.getRenderedImage();
        //ImageIO.write(renderedImage, "png", DataUtilities.urlToFile(getClass().getResource("testRead_1.png")));

        assertNotNull(result);
        assertEquals(ZOOMLEVEL_12_BBOX, new ReferencedEnvelope(result.getEnvelope()));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testRead_1.png")), renderedImage, 2);
    }

    @Test
    public void testReadTiles_coverage_zoom_4tileIndices() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);

        TileMatrix tileMatrix = instance.getTileset(COVERAGE_NAME).getTileMatrix(12);
        int zoomLevel = 12;
        int leftTile = tileMatrix.getMinCol();
        int rightTile = leftTile + 1;
        int topTile = tileMatrix.getMinRow();
        int bottomTile = topTile + 1;
        BufferedImage result = instance.readTiles(COVERAGE_NAME, zoomLevel, leftTile, rightTile, topTile, bottomTile, null);

        assertNotNull(result);
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testRead_1.png")), result, 2);
    }
    
    @Test
    public void testReadTiles_zoom_region_color() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        int zoomLevel = 12;
        Rectangle region = new Rectangle(0, 0, 512, 512);
        Color inputTransparentColor = null;

        BufferedImage result = instance.readTiles(zoomLevel, region, inputTransparentColor);

        assertNotNull(result);
//        ImageIO.write(result, "png", DataUtilities.urlToFile(getClass().getResource("testReadTiles_2.png")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testReadTiles_2.png")), result, 2);
    }

    @Test
    public void testRead_coverage_zoom_region_color() throws Exception {
        assumeNotNull(source);  // Skip test if not found
        GeoPackageReader instance = new GeoPackageReader(source, null);
        int zoomLevel = 12;
        Rectangle region = new Rectangle(0, 0, 512, 512);
        Color inputTransparentColor = null;

        BufferedImage result = instance.readTiles(COVERAGE_NAME, zoomLevel, region, inputTransparentColor);

        assertNotNull(result);
//        ImageIO.write(result, "png", DataUtilities.urlToFile(getClass().getResource("testReadTiles_2.png")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testReadTiles_2.png")), result, 2);
    }


}
