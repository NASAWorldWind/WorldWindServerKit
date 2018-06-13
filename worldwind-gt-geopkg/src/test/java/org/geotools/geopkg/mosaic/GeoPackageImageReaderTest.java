package org.geotools.geopkg.mosaic;

import org.geotools.geopkg.mosaic.GeoPackageReader;
import org.geotools.geopkg.mosaic.GeoPackageImageReaderSpi;
import org.geotools.geopkg.mosaic.GeoPackageImageReader;
import static org.geotools.geopkg.mosaic.GeoPackageReaderTest.LEVEL_12_GRID_RANGE;
import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.metadata.IIOMetadata;
import org.geotools.coverage.grid.io.OverviewPolicy;
import org.geotools.geometry.GeneralEnvelope;
import org.geotools.image.test.ImageAssert;
import org.geotools.referencing.factory.gridshift.DataUtilities;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeNotNull;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageImageReaderTest {

    private final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    public final static String COVERAGE_NAME = "GeoPackageTutorial";
    private final static int MAX_ZOOM_LEVEL = 16;
    private GeoPackageImageReaderSpi imageReaderSpi;
    private FileImageInputStreamExtImpl inputStream;
    private URL source;

    public GeoPackageImageReaderTest() {
    }

    @Before
    public void setUp() {
        imageReaderSpi = new GeoPackageImageReaderSpi();
        try {
            source = GeoPackageReader.class.getResource(GEOPACKAGE);
            File file = DataUtilities.urlToFile(source);
            inputStream = new FileImageInputStreamExtImpl(file);
        } catch (IOException ex) {
            Logger.getLogger(GeoPackageImageReaderTest.class.getName()).log(Level.SEVERE, null, ex);
        }

    }

    @After
    public void tearDown() {
        imageReaderSpi = null;
        inputStream = null;
        source = null;
    }

    @Test
    public void testConstructor() {
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);

        assertNotNull(instance);
    }

    @Test
    public void testSetInput() {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        boolean seekForwardOnly = false;
        boolean ignoreMetadata = true;

        instance.setInput(inputStream, seekForwardOnly, ignoreMetadata);

        Object input = instance.getInput();
        assertNotNull(input);
    }

    @Test
    public void testGetZoomLevel() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        int result = instance.getZoomLevel(imageIndex);

        assertEquals(GeoPackageImageReaderTest.MAX_ZOOM_LEVEL, result);
    }

    @Test
    public void testGetHeight() throws IOException {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        int result = instance.getHeight(imageIndex);

        assertEquals(GeoPackageReaderTest.ORIGINAL_GRID_RANGE.getSpan(1), result);
    }

    @Test
    public void testGetWidth() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        int result = instance.getWidth(imageIndex);

        assertEquals(GeoPackageReaderTest.ORIGINAL_GRID_RANGE.getSpan(0), result);
    }

    @Test
    public void testGetNumImages() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        boolean allowSearch = false;

        int result = instance.getNumImages(allowSearch);

        assertEquals(GeoPackageReaderTest.NUM_ZOOM_LEVELS, result);
    }

    @Test
    public void testGetImageTypes() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        Iterator<ImageTypeSpecifier> result = instance.getImageTypes(imageIndex);

        assertTrue("at least one ImageTypeSpecifier", result.hasNext());
    }

    @Test
    public void testGetTileHeight() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        int result = instance.getTileHeight(imageIndex);

        assertEquals(256, result);
    }

    @Test
    public void testGetTileWidth() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        int result = instance.getTileWidth(imageIndex);

        assertEquals("GeoPackage tile width", 256, result);
    }

    @Test
    public void testIsImageTiled() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        boolean result = instance.isImageTiled(imageIndex);

        assertEquals(true, result);
    }

    @Test
    public void testReset() throws IOException {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        assertNotNull("input", instance.getInput());

        instance.reset();

        assertNull("input", instance.getInput());
    }

    @Test
    public void testGetStreamMetadata() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        IIOMetadata expResult = null;
        IIOMetadata result = instance.getStreamMetadata();

        assertEquals(expResult, result);
    }

    @Test
    public void testGetImageMetadata() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;

        IIOMetadata expResult = null;
        IIOMetadata result = instance.getImageMetadata(imageIndex);

        assertEquals(expResult, result);
    }

    @Test
    public void testReadTile() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;
        int tileX = 0;
        int tileY = 0;

        BufferedImage result = instance.readTile(imageIndex, tileX, tileY);
        //ImageIO.write(result, "png", DataUtilities.urlToFile(getClass().getResource("testReadTile.png")));    // writes to target/test_classes

        assertNotNull(result);
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testReadTile.png")), result, 2);
    }

    @Test
    public void testRead_imageIndex_readParam() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        // Prepare the readParms and imageIndex
        GeoPackageReader reader = new GeoPackageReader(source, null);
        GeneralEnvelope requestedEnvelope = reader.getOriginalEnvelope(COVERAGE_NAME);
        //System.out.println(requestedEnvelope);
        
        Rectangle requestedDim = new Rectangle(0, 0, LEVEL_12_GRID_RANGE.getSpan(0), LEVEL_12_GRID_RANGE.getSpan(1));
        ImageReadParam readParams = new ImageReadParam();
        int imageIndex = reader.setReadParams(COVERAGE_NAME, OverviewPolicy.NEAREST, readParams, requestedEnvelope, requestedDim);

        BufferedImage result = instance.read(imageIndex, readParams);
        //ImageIO.write(result, "png", DataUtilities.urlToFile(getClass().getResource("testRead.png"))); // writes to target folder

        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testRead.png")), result, 2);
        assertNotNull(result);
    }

    @Test
    public void testRead_imageIndex() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 4; // 0 = level 16: native resolution
        int srcWidth = instance.getWidth(imageIndex);
        int srcHeight = instance.getHeight(imageIndex);  
        
        BufferedImage result = instance.read(imageIndex);
        //ImageIO.write(result, "png", DataUtilities.urlToFile(getClass().getResource("testRead.png"))); // writes to target folder
        
        assertNotNull(result);
        assertEquals(srcWidth, result.getWidth());
        assertEquals(srcHeight, result.getHeight());
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("testRead.png")), result, 2);
    }

}
