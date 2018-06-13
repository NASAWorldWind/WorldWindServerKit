/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.geotools.geopkg;

import org.geotools.geopkg.TileEntry;
import org.geotools.geopkg.TileMatrix;
import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geopkg.mosaic.GeoPackageReader;
import java.io.IOException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.CRS;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeNotNull;
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
     * Test of init method, of class TileEntry.
     */
    @Test
    public void testInit() {
        assumeNotNull(reader);  // Skip test if not found        
        TileEntry e = reader.getTileset(COVERAGE_NAME);
        TileEntry instance = new TileEntry();
        
        instance.init(e);
        
        assertEquals("Expected min zoom", e.minZoom, instance.minZoom);
        assertEquals("Expected max zoom", e.maxZoom, instance.maxZoom);
        assertTrue("Tile matricies match", e.getTileMatricies().equals(instance.getTileMatricies()));
        assertTrue("Tile matricies bounds match", e.getTileMatrixSetBounds().equals(instance.getTileMatrixSetBounds()));
                
    }

    /**
     * Test of setMinZoomLevel method, of class TileEntry.
     */
    @Test
    public void testSetMinZoomLevel() {
        int minZoom = 0;
        TileEntry instance = new TileEntry();

        instance.setMinZoomLevel(minZoom);

        assertEquals("Expected min zoom", minZoom, instance.minZoom);
    }
    
    /**
     * Test of setMaxZoomLevel method, of class TileEntry.
     */
    @Test
    public void testSetMaxZoomLevel() {
        int maxZoom = 0;
        TileEntry instance = new TileEntry();

        instance.setMaxZoomLevel(maxZoom);

        assertEquals("Expected max zoom", maxZoom, instance.maxZoom);
    }
    
    /**
     * Test of setTileMatrixSetBounds method, of class TileEntry.
     */
    @Test
    public void testSetTileMatrixSetBounds() {
        Envelope tileMatrixSetBounds = new Envelope(1.0, 2.0, 3.0, 4.0);
        TileEntry instance = new TileEntry();
        
        instance.setTileMatrixSetBounds(tileMatrixSetBounds);
        
        assertEquals("Tile matrix bounds match", tileMatrixSetBounds, instance.getTileMatrixSetBounds());
    }    

    /**
     * Test of setTileMatricies method, of class TileEntry.
     */
    @Test
    public void testSetTileMatricies() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry e = reader.getTileset(COVERAGE_NAME);
        List<TileMatrix> tileMatricies = e.getTileMatricies();
        TileEntry instance = new TileEntry();
        
        instance.setTileMatricies(tileMatricies);
        
        assertNotNull(instance.tileMatricies);
        assertEquals("Expected size", tileMatricies.size(), instance.tileMatricies.size());
        assertTrue(Arrays.equals(tileMatricies.toArray(), instance.tileMatricies.toArray()));
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
        assertTrue("Expected size", tileMatricies.size() > 0);
    }

    /**
     * Test of getTileMatrix method, of class TileEntry.
     */
    @Test
    public void testGetTileMatrix_for_each_zoom_level() {
        assumeNotNull(reader);  // Skip test if not found
        TileEntry instance = reader.getTileset(COVERAGE_NAME);
        for (int zoomLevel = MIN_ZOOM_LEVEL; zoomLevel <= MAX_ZOOM_LEVEL; zoomLevel++) {

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

        ReferencedEnvelope result = (ReferencedEnvelope) instance.getTileMatrixSetBounds();

        CRS.AxisOrder axisOrder1 = CRS.getAxisOrder(ENVELOPE.getCoordinateReferenceSystem());
        int x1 = axisOrder1 == CRS.AxisOrder.EAST_NORTH ? 0 : 1;
        int y1 = 1 - x1;
        CRS.AxisOrder axisOrder2 = CRS.getAxisOrder(result.getCoordinateReferenceSystem());
        int x2 = axisOrder2 == CRS.AxisOrder.EAST_NORTH ? 0 : 1;
        int y2 = 1 - x2;

        assertNotNull(result);
        assertEquals(ENVELOPE.getMinimum(x1), result.getMinimum(x2), 0.000001);
        assertEquals(ENVELOPE.getMinimum(y1), result.getMinimum(y2), 0.000001);
        assertEquals(ENVELOPE.getMaximum(x1), result.getMaximum(x2), 0.000001);
        assertEquals(ENVELOPE.getMaximum(y1), result.getMaximum(y2), 0.000001);

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

}
