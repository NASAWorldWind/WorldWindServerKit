package org.geotools.geopkg.mosaic;

import org.geotools.geopkg.mosaic.GeoPackageReader;
import org.geotools.geopkg.mosaic.GeoPackageFormat;
import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import org.geotools.coverage.grid.io.AbstractGridCoverage2DReader;
import org.geotools.coverage.grid.io.imageio.GeoToolsWriteParams;
import org.geotools.factory.GeoTools;
import org.geotools.factory.Hints;
import org.geotools.referencing.factory.gridshift.DataUtilities;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import org.opengis.coverage.grid.GridCoverageWriter;
import org.opengis.parameter.ParameterValueGroup;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageFormatTest {

    private final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    private URL sourceUrl;

    public GeoPackageFormatTest() {
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
     * Test of constructor of class GeoPackageFormat.
     */
    @Test
    public void testConstructor_metadata() {
        GeoPackageFormat instance = new GeoPackageFormat();
        String name = instance.getName();
        String description = instance.getDescription();
        String docURL = instance.getDocURL();
        String vendor = instance.getVendor();
        String version = instance.getVersion();

        assertEquals(GeoPackageFormat.NAME, name);
        assertEquals(GeoPackageFormat.DESC, description);
        assertEquals(GeoPackageFormat.DOC_URL, docURL);
        assertEquals(GeoPackageFormat.VENDOR, vendor);
        assertEquals(GeoPackageFormat.VERSION, version);
    }

    /**
     * Test of constructor of class GeoPackageFormat.
     */
    @Test
    public void testConstructor_readParams() {
        GeoPackageFormat instance = new GeoPackageFormat();

        ParameterValueGroup readParameters = instance.getReadParameters();

        assertNotNull(readParameters);
        assertNotNull(readParameters.parameter("ReadGridGeometry2D")); // READ_GRIDGEOMETRY2D
        assertNotNull(readParameters.parameter("InputTransparentColor")); // INPUT_TRANSPARENT_COLOR

    }

    /**
     * Test of getReader method, of class GeoPackageFormat.
     */
    @Test
    public void testGetReader_Object() {
        GeoPackageFormat instance = new GeoPackageFormat();

        AbstractGridCoverage2DReader result = instance.getReader(sourceUrl);

        assertNotNull(result);
        assertTrue("reader should be a GeoPackageReader", result instanceof GeoPackageReader);
    }

    /**
     * Test of getReader method, of class GeoPackageFormat.
     */
    @Test
    public void testGetReader_Object_Hints() {
        GeoPackageFormat instance = new GeoPackageFormat();
        final Hints defaultHints = GeoTools.getDefaultHints();

        AbstractGridCoverage2DReader result = instance.getReader(sourceUrl, defaultHints);

        assertNotNull(result);
        assertTrue("reader should be a GeoPackageReader", result instanceof GeoPackageReader);
    }

    /**
     * Test of getWriter method, of class GeoPackageFormat.
     */
    @Test(expected = UnsupportedOperationException.class)
    public void testGetWriter_Object() {
        GeoPackageFormat instance = new GeoPackageFormat();
        Object destination = null;

        GridCoverageWriter result = instance.getWriter(destination);

        fail("The getWriter method should have thrown an unsupported exception.");
    }

    /**
     * Test of getWriter method, of class GeoPackageFormat.
     */
    @Test(expected = UnsupportedOperationException.class)
    public void testGetWriter_Object_Hints() {
        GeoPackageFormat instance = new GeoPackageFormat();
        Object destination = null;
        Hints hints = null;

        GridCoverageWriter result = instance.getWriter(destination, hints);

        fail("The getWriter method should have thrown an unsupported exception.");
    }

    /**
     * Test of accepts method, of class GeoPackageFormat.
     */
    @Test
    public void testAccepts() {
        GeoPackageFormat instance = new GeoPackageFormat();

        boolean result = instance.accepts(sourceUrl, null);

        assertTrue("A valid URL should be accepted", result);
    }

    /**
     * Test of accepts method, of class GeoPackageFormat.
     */
    @Test
    public void testAccepts_file() {
        GeoPackageFormat instance = new GeoPackageFormat();
        File sourceFile = DataUtilities.urlToFile((URL) sourceUrl);

        boolean result = instance.accepts(sourceFile, null);

        assertTrue("A valid File object should be accepted", result);
    }

    /**
     * Test of accepts method, of class GeoPackageFormat.
     */
    @Test
    public void testAccepts_string() {
        GeoPackageFormat instance = new GeoPackageFormat();
        File sourceFile = DataUtilities.urlToFile((URL) sourceUrl);
        String filename = sourceFile.getAbsolutePath();

        boolean result = instance.accepts(filename, null);

        assertTrue("A valid filename should be accepted", result);
    }

    /**
     * Test of accepts method, of class GeoPackageFormat.
     * @throws java.io.IOException
     */
    @Test
    public void testAccepts_fileImageInputStreamExt() throws IOException {
        GeoPackageFormat instance = new GeoPackageFormat();
        File sourceFile = DataUtilities.urlToFile((URL) sourceUrl);
        FileImageInputStreamExtImpl inputStream = new FileImageInputStreamExtImpl(sourceFile);

        boolean result = instance.accepts(inputStream, null);

        assertTrue("A valid FileImageInputStreamExtImpl should be accepted", result);
    }

    /**
     * Test of getDefaultImageIOWriteParameters method, of class
     * GeoPackageFormat.
     */
    @Test(expected = UnsupportedOperationException.class)
    public void testGetDefaultImageIOWriteParameters() {
        GeoPackageFormat instance = new GeoPackageFormat();

        GeoToolsWriteParams result = instance.getDefaultImageIOWriteParameters();

        fail("The getDefaultImageIOWriteParameters method should have thrown an unsupported exception.");
    }

    /**
     * Test of getFileFromSource method, of class GeoPackageFormat.
     */
    @Test
    public void testGetFileFromSource_url() {

        File result = GeoPackageFormat.getFileFromSource(sourceUrl);

        assertNotNull(result);
    }

    @Test
    public void testGetFileFromSource_file() {
        File sourceFile = DataUtilities.urlToFile((URL) sourceUrl);

        File result = GeoPackageFormat.getFileFromSource(sourceFile);

        assertNotNull(result);
    }

    @Test
    public void testGetFileFromSource_filename() {
        File sourceFile = DataUtilities.urlToFile((URL) sourceUrl);
        String filename = sourceFile.getAbsolutePath();

        File result = GeoPackageFormat.getFileFromSource(filename);

        assertNotNull(result);
    }

    @Test
    public void testGetFileFromSource_fileImageInputStream() throws IOException {
        File sourceFile = DataUtilities.urlToFile((URL) sourceUrl);
        FileImageInputStreamExtImpl inputStream = new FileImageInputStreamExtImpl(sourceFile);

        File result = GeoPackageFormat.getFileFromSource(inputStream);

        assertNotNull(result);
    }

    @Test
    public void testGetFileFromSource_bad_filename() {

        File result = GeoPackageFormat.getFileFromSource("a-bogus-filename");

        assertNull(result);
    }

    @Test
    public void testGetFileFromSource_fileNotExists() {
        File source = new File("a-bogus-filename");
        
        File result = GeoPackageFormat.getFileFromSource(source);

        assertNull(result);
    }

    @Test
    public void testGetFileFromSource_bad_url() throws MalformedURLException {

        File result = GeoPackageFormat.getFileFromSource(new URL("http://a-bad-protocol.com"));

        assertNull(result);
    }

}
