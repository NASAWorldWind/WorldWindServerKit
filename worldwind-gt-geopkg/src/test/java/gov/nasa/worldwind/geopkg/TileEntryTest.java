/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gov.nasa.worldwind.geopkg;

import com.vividsolutions.jts.geom.Envelope;
import gov.nasa.worldwind.geopkg.mosaic.GeoPackageReader;
import java.io.IOException;
import java.net.URL;
import java.util.List;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.CRS;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeNotNull;
import org.junit.Ignore;
import org.omg.IOP.ENCODING_CDR_ENCAPS;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CoordinateReferenceSystem;

/**
 *
 * @author Bruce Schubert
 */
public class TileEntryTest {

    private final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    private final static String COVERAGE_NAME = "GeoPackageTutorial";
    private GeoPackageReader reader;
    private final static int MIN_ZOOM_LEVEL = 11;
    private final static int MAX_ZOOM_LEVEL = 16;
    private final static ReferencedEnvelope ENVELOPE = new ReferencedEnvelope(
            -76.0637651, -76.0014413, 36.7975956, 36.8303400, DefaultGeographicCRS.WGS84);

    public TileEntryTest() {
    }

    @Before
    public void setUp() throws IOException {
        URL source = GeoPackageReader.class.getResource(GEOPACKAGE);
        reader = new GeoPackageReader(source, null);

    }

    @After
    public void tearDown() {
        reader = null;
    }

    /**
     * Test of getTileMatricies method, of class TileEntry.
     */
    @Test
    public void testGetTileMatricies() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);

        List<TileMatrix> tileMatricies = instance.getTileMatricies();

        assertNotNull(tileMatricies);
        assertEquals("Expected size", MAX_ZOOM_LEVEL + 1, tileMatricies.size());
    }

    /**
     * Test of getTileMatrix method, of class TileEntry.
     */
    @Test
    public void testGetTileMatrix_for_each_zoom_level() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);
        for (int zoomLevel = 0; zoomLevel <= 16; zoomLevel++) {

            TileMatrix result = instance.getTileMatrix(zoomLevel);

            assertNotNull("Zoom Level " + zoomLevel, result);
        }
    }
    

    /**
     * Test of getTileMatrix method, of class TileEntry.
     */
    @Test(expected = IllegalArgumentException.class)
    public void testGetTileMatrix_zoom_level_out_of_range() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);

        instance.getTileMatrix(17);

        fail("Expected IllegalArgumentException");
    }

    
    /**
     * Test of getTileMatrixSetBounds method, of class TileEntry.
     */
    @Test
    public void testGetTileMatrixSetBounds() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);
                
        Envelope result = instance.getTileMatrixSetBounds();

        assertNotNull(result);
        assertEquals(ENVELOPE.getMinimum(0), result.getMinX(), 0.000001);
        assertEquals(ENVELOPE.getMinimum(1), result.getMinY(), 0.000001);
        assertEquals(ENVELOPE.getMaximum(0), result.getMaxX(), 0.000001);
        assertEquals(ENVELOPE.getMaximum(1), result.getMaxY(), 0.000001);
        
    }
    
    /**
     * Test of getMaxZoomLevel method, of class TileEntry.
     */
    @Test
    public void testGetMaxZoomLevel() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);

        int maxZoomLevel = instance.getMaxZoomLevel();

        assertEquals(MAX_ZOOM_LEVEL, maxZoomLevel);
    }

    /**
     * Test of getMinZoomLevel method, of class TileEntry.
     */
    @Test
    public void testGetMinZoomLevel() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);

        int minZoomLevel = instance.getMinZoomLevel();

        assertEquals(MIN_ZOOM_LEVEL, minZoomLevel);
    }

    /**
     * Test of getCrs method, of class TileEntry.
     */
    @Test
    public void testGetCrs() throws FactoryException {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);
        CoordinateReferenceSystem expected = CRS.decode("EPSG:4326", true);

        CoordinateReferenceSystem result = instance.getCrs();
        
        assertNotNull(result);
        assertEquals(expected, result);
    }


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    
    /**
     * Test of setTileMatricies method, of class TileEntry.
     */
    @Ignore
    @Test
    public void testSetTileMatricies() {
        System.out.println("setTileMatricies");
        List<TileMatrix> tileMatricies = null;
        TileEntry instance = new TileEntry();
        instance.setTileMatricies(tileMatricies);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of init method, of class TileEntry.
     */
    @Ignore
    @Test
    public void testInit() {
        System.out.println("init");
        TileEntry e = null;
        TileEntry instance = new TileEntry();
        instance.init(e);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }


    /**
     * Test of setTileMatrixSetBounds method, of class TileEntry.
     */
    @Ignore
    @Test
    public void testSetTileMatrixSetBounds() {
        System.out.println("setTileMatrixSetBounds");
        Envelope tileMatrixSetBounds = null;
        TileEntry instance = new TileEntry();
        instance.setTileMatrixSetBounds(tileMatrixSetBounds);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }


    /**
     * Test of setMinZoomLevel method, of class TileEntry.
     */
    @Ignore
    @Test
    public void testSetMinZoomLevel() {
        System.out.println("setMinZoomLevel");
        int minZoom = 0;
        TileEntry instance = new TileEntry();
        instance.setMinZoomLevel(minZoom);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }


    /**
     * Test of setMaxZoomLevel method, of class TileEntry.
     */
    @Ignore
    @Test
    public void testSetMaxZoomLevel() {
        System.out.println("setMaxZoomLevel");
        int maxZoom = 0;
        TileEntry instance = new TileEntry();
        instance.setMaxZoomLevel(maxZoom);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }



}
