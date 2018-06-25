/*
 * Copyright (C) 2017 NASA World Wind.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301  USA
 */
package org.geotools.geopkg.wps;

import org.geotools.geopkg.wps.GeoPackageProcessRequest;
import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geopkg.wps.xml.GPKG;
import java.net.URI;
import java.net.URL;
import java.awt.Color;
import java.net.URISyntaxException;
import java.util.Arrays;
import javax.xml.namespace.QName;
import org.junit.Test;
import static org.junit.Assert.*;
import org.junit.Ignore;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageProcessRequestTest {

    public GeoPackageProcessRequestTest() {
    }

    /**
     * Test of hashCode method, of class GeoPackageProcessRequest.
     */
    @Test
    public void testHashCode() throws URISyntaxException {
        // Assemble two differnt requests
        GeoPackageProcessRequest request1 = new GeoPackageProcessRequest();
        GeoPackageProcessRequest request2 = new GeoPackageProcessRequest();
        initializeTilesRequest(request1);
        initializeTilesRequest(request2);

        int firstHashCode = request1.hashCode();
        int secondHashCode = request1.hashCode();
        int thirdHashCode = request2.hashCode();

        // Assert same hash code from multiple invocations
        assertEquals(firstHashCode, secondHashCode);
        // Assert same hash code from identical object
        assertEquals(firstHashCode, thirdHashCode);
    }

    /**
     * Test of equals method, of class GeoPackageProcessRequest.
     */
    @Test
    public void testEquals() throws URISyntaxException {
        // Assemble two identical requests
        GeoPackageProcessRequest request1 = new GeoPackageProcessRequest();
        GeoPackageProcessRequest request2 = new GeoPackageProcessRequest();
        initializeTilesRequest(request1);
        initializeTilesRequest(request2);

        assertEquals(request1, request2);
    }

    @Test
    public void testNotEquals() throws URISyntaxException {
        // Assemble two different requests
        GeoPackageProcessRequest request1 = new GeoPackageProcessRequest();
        GeoPackageProcessRequest request2 = new GeoPackageProcessRequest();
        initializeTilesRequest(request1);
        initializeTilesRequest(request2);
        request2.setName("DIFFERENT_NAME");

        assertNotEquals(request1, request2);

    }

    static void initializeTilesRequest(GeoPackageProcessRequest request) throws URISyntaxException {
        GeoPackageProcessRequest.TilesLayer tiles = new GeoPackageProcessRequest.TilesLayer();
        GeoPackageProcessRequest.TilesLayer.TilesCoverage coverage = new GeoPackageProcessRequest.TilesLayer.TilesCoverage();
        request.setName("FILENAME");
        request.addLayer(tiles);
        tiles.setName("NAME");
        tiles.setIdentifier("ID");
        tiles.setSrs(new URI("EPSG:4326"));
        tiles.setBbox(new Envelope(11,12,23,24));
        tiles.setLayers(Arrays.asList(new QName(null, "LAYER1", "WORKSPACE"), new QName(null, "LAYER2", "WORKSPACE"), new QName(GPKG.NAMESPACE, "LAYER3", "")));
        tiles.setStyles(Arrays.asList("RASTER1", "RASTER2"));
        tiles.setFormat("image/vnd.jpeg-png");
        tiles.setBgColor(Color.white);
        tiles.setTransparent(true);
        tiles.setCoverage(coverage);
        coverage.setMinZoom(1);
        coverage.setMaxZoom(2);
        coverage.setMinColumn(3);
        coverage.setMaxColumn(4);
        coverage.setMinRow(5);
        coverage.setMaxRow(6);

    }

    /**
     * Test of addLayer method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testAddLayer() {
        GeoPackageProcessRequest.Layer layer = null;
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        instance.addLayer(layer);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of getLayer method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testGetLayer() {
        int i = 0;
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        GeoPackageProcessRequest.Layer expResult = null;
        GeoPackageProcessRequest.Layer result = instance.getLayer(i);
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of getLayerCount method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testGetLayerCount() {
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        int expResult = 0;
        int result = instance.getLayerCount();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of getName method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testGetName() {
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        String expResult = "";
        String result = instance.getName();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of setName method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testSetName() {
        String name = "";
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        instance.setName(name);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of getPath method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testGetPath() {
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        URL expResult = null;
        URL result = instance.getPath();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of setPath method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testSetPath() {
        URL path = null;
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        instance.setPath(path);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of getRemove method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testGetRemove() {
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        Boolean expResult = null;
        Boolean result = instance.getRemove();
        assertEquals(expResult, result);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

    /**
     * Test of setRemove method, of class GeoPackageProcessRequest.
     */
    @Test
    @Ignore
    public void testSetRemove() {
        Boolean remove = null;
        GeoPackageProcessRequest instance = new GeoPackageProcessRequest();
        instance.setRemove(remove);
        // TODO review the generated test code and remove the default call to fail.
        fail("The test case is a prototype.");
    }

}
