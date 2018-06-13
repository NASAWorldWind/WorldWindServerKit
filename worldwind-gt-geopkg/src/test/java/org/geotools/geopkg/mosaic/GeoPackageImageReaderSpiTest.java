package org.geotools.geopkg.mosaic;

import org.geotools.geopkg.mosaic.GeoPackageImageReaderSpi;
import org.geotools.geopkg.mosaic.GeoPackageFormat;
import org.geotools.geopkg.mosaic.GeoPackageImageReader;
import java.io.File;
import java.net.URL;
import java.util.Locale;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageImageReaderSpiTest {

    private final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    private URL sourceUrl;

    public GeoPackageImageReaderSpiTest() {
    }

    @Before
    public void setUp() {
        sourceUrl = getClass().getResource(GEOPACKAGE);
    }

    @After
    public void tearDown() {
        sourceUrl = null;
    }

    /**
     * Test of getDescription method, of class GeoPackageImageReaderSpi.
     */
    @Test
    public void testGetDescription() {
        Locale locale = null;
        GeoPackageImageReaderSpi instance = new GeoPackageImageReaderSpi();

        String result = instance.getDescription(locale);

        assertNotNull(result);
    }

    /**
     * Test of canDecodeInput method, of class GeoPackageImageReaderSpi.
     * @throws java.lang.Exception
     */
    @Test
    public void testCanDecodeInput_url() throws Exception {
        GeoPackageImageReaderSpi instance = new GeoPackageImageReaderSpi();

        boolean result = instance.canDecodeInput(sourceUrl);

        assertTrue(result);
    }

    @Test
    public void testCanDecodeInput_file() throws Exception {
        File file = GeoPackageFormat.getFileFromSource(sourceUrl);
        GeoPackageImageReaderSpi instance = new GeoPackageImageReaderSpi();

        boolean result = instance.canDecodeInput(file);

        assertTrue(result);
    }

    @Test
    public void testCanDecodeInput_filename() throws Exception {
        File file = GeoPackageFormat.getFileFromSource(sourceUrl);
        String filename = file.getAbsolutePath();
        GeoPackageImageReaderSpi instance = new GeoPackageImageReaderSpi();

        boolean result = instance.canDecodeInput(filename);

        assertTrue("Could not validate " + filename, result);
    }

    @Test
    public void testCanDecodeInput_bogus_filename() throws Exception {
        GeoPackageImageReaderSpi instance = new GeoPackageImageReaderSpi();

        boolean result = instance.canDecodeInput("bad-extension.gkg");

        assertTrue(!result);
    }

    /**
     * Test of createReaderInstance method, of class GeoPackageImageReaderSpi.
     * @throws java.lang.Exception
     */
    @Test
    public void testCreateReaderInstance() throws Exception {
        Object plugInExtension = null;
        GeoPackageImageReaderSpi instance = new GeoPackageImageReaderSpi();

        GeoPackageImageReader imageReader = instance.createReaderInstance(plugInExtension);

        assertNotNull(imageReader);
    }


}
