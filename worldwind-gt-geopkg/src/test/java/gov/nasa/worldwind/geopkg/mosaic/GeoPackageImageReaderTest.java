package gov.nasa.worldwind.geopkg.mosaic;

import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.metadata.IIOMetadata;
import org.geotools.referencing.factory.gridshift.DataUtilities;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeNotNull;
import org.junit.Ignore;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageImageReaderTest {

    private final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    private final static int MAX_ZOOM_LEVEL = 16;
    private GeoPackageImageReaderSpi imageReaderSpi;
    private FileImageInputStreamExtImpl inputStream;

    public GeoPackageImageReaderTest() {
    }

    @Before
    public void setUp() {
        imageReaderSpi = new GeoPackageImageReaderSpi();
        try {
            URL source = GeoPackageReader.class.getResource(GEOPACKAGE);
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
    }

    @Test
    public void testConstructor() {

        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);

        assertNotNull(instance);
    }

    @Test
    public void testSetInput() {
        assumeNotNull(inputStream);  // Skip test if not found
        boolean seekForwardOnly = false;
        boolean ignoreMetadata = true;
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);

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

        assertEquals(MAX_ZOOM_LEVEL, result);
    }

    @Ignore
    @Test
    public void testGetHeight() throws IOException {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        int expResult = 0;
        int result = instance.getHeight(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetWidth() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        int expResult = 0;
        int result = instance.getWidth(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetNumImages() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        boolean allowSearch = false;
        int expResult = 0;
        int result = instance.getNumImages(allowSearch);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetImageTypes() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        Iterator<ImageTypeSpecifier> expResult = null;
        Iterator<ImageTypeSpecifier> result = instance.getImageTypes(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetTileHeight() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        int expResult = 0;
        int result = instance.getTileHeight(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetTileWidth() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        int expResult = 0;
        int result = instance.getTileWidth(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testIsImageTiled() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        boolean expResult = false;
        boolean result = instance.isImageTiled(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testRead_int() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        BufferedImage expResult = null;
        BufferedImage result = instance.read(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testRead_int_ImageReadParam() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        ImageReadParam param = null;
        BufferedImage expResult = null;
        BufferedImage result = instance.read(imageIndex, param);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testReadTile() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        int imageIndex = 0;
        int tileX = 0;
        int tileY = 0;
        BufferedImage expResult = null;
        BufferedImage result = instance.readTile(imageIndex, tileX, tileY);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testReset() {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        instance.reset();
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetStreamMetadata() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);

        IIOMetadata expResult = null;
        IIOMetadata result = instance.getStreamMetadata();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    @Ignore
    @Test
    public void testGetImageMetadata() throws Exception {
        assumeNotNull(inputStream);  // Skip test if not found
        GeoPackageImageReader instance = new GeoPackageImageReader(imageReaderSpi);
        instance.setInput(inputStream);
        int imageIndex = 0;
        IIOMetadata expResult = null;
        IIOMetadata result = instance.getImageMetadata(imageIndex);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

}
