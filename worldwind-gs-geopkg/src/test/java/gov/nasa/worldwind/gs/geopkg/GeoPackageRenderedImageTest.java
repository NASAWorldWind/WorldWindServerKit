/*
 * Copyright (C) 2017 NASA World Wind
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */
package gov.nasa.worldwind.gs.geopkg;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.net.URL;
import javax.imageio.ImageIO;
import javax.media.jai.RenderedOp;
import javax.xml.namespace.QName;

import org.geoserver.catalog.Catalog;
import org.geoserver.catalog.CoverageInfo;
import org.geoserver.data.test.SystemTestData;
import org.geoserver.wms.CachedGridReaderLayer;
import org.geoserver.wms.GetMapRequest;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.WMSTestSupport;
import org.geoserver.wms.map.RenderedImageMap;
import org.geoserver.wms.map.RenderedImageMapOutputFormat;
import org.geotools.coverage.grid.io.GridCoverage2DReader;
import org.geotools.data.DataUtilities;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.image.test.ImageAssert;
import org.geotools.map.Layer;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.geotools.styling.StyleBuilder;
import org.junit.After;

import static org.junit.Assume.assumeNotNull;

import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * Tests for JPEG and PNG images produced by the GeoPackage
 *
 * @author Bruce Schubert
 */
public class GeoPackageRenderedImageTest extends WMSTestSupport {

    private final static String AGC_URI = "http://gov.nasa.worldwind/agc";
    private final static String AGC_PREFIX = "agc";
    private final static QName JOG = new QName(AGC_URI, "JOG", AGC_PREFIX);
    private final static String MIME_TYPE = "image/jpeg";
    private final static String GEOPACKAGE = "jog.gpkg";
    private final int WIDTH = 768;
    private final int HEIGHT = 580;
    private final static ReferencedEnvelope BBOX_1TO1M = new ReferencedEnvelope(
            -78.26385498046875, -76.15447998046875,
            38.03466796875, 39.627685546875,
            DefaultGeographicCRS.WGS84);
    private final static ReferencedEnvelope BBOX_1TO545K = new ReferencedEnvelope(
            -77.73513793945312, -76.68045043945312,
            38.431549072265625, 39.228057861328125,
            DefaultGeographicCRS.WGS84);

    public GeoPackageRenderedImageTest() {
    }

    /**
     * WMSTestSupport hook called after the system (ie spring context) has been
     * fully initialized. Adds JOG GeoPackage to the raster layers.
     *
     * @param testData
     * @throws Exception
     */
    @Override
    protected void onSetUp(SystemTestData testData) throws Exception {
        super.onSetUp(testData);

        URL gpkg = getClass().getResource("jog.gpkg");
        if (gpkg != null) {
            Catalog catalog = super.getCatalog();
            testData.addWorkspace(AGC_PREFIX, AGC_URI, catalog);
            testData.addRasterLayer(JOG, GEOPACKAGE, null, null, getClass(), catalog);
        }
    }

    @Before
    public void setUp() {
    }

    @After
    public void tearDown() {
    }

    @Test
    public void test_CroppingIssue_1To1M() throws Exception {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found        

        // Get an image directly from a RenderedImageMapOutputFormat
        BufferedImage mapImage1 = getRenderedImageMap(BBOX_1TO1M, MIME_TYPE, JOG);
        // Get an image through a GetMap request
        BufferedImage mapImage2 = getHttpServletResponse(BBOX_1TO1M, MIME_TYPE, JOG);
        // Compare the images (Note: interactive compare only availabe on File-based assert does not work here)
        ImageAssert.assertEquals(mapImage1, mapImage2, /*differing pixels threshold*/ 250);
    }

    @Test
    public void test_CroppingIssue_1To545K() throws Exception {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found        

        // Get an image directly from a RenderedImageMapOutputFormat
        BufferedImage mapImage1 = getRenderedImageMap(BBOX_1TO545K, MIME_TYPE, JOG);
        // Get an image through a GetMap request
        BufferedImage mapImage2 = getHttpServletResponse(BBOX_1TO545K, MIME_TYPE, JOG);
        // Compare the images (Note: interactive compare only availabe on File-based assert. does not work here)
        ImageAssert.assertEquals(mapImage1, mapImage2, /*differing pixels threshold*/ 250);
    }

    @Test
    public void testGetMap_1To1M() throws Exception {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found        

        // Prepare a WMS map request matching the OpenLayers MapPreview at 1:1M scale
        BufferedImage img = getHttpServletResponse(BBOX_1TO1M, MIME_TYPE, JOG);
        //ImageIO.write(img, "jpg", DataUtilities.urlToFile(getClass().getResource("agc-JOG.jpg")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("agc-JOG.jpg")), img, 250);
    }

    
    @Test
    public void testGetMap_1To545K() throws Exception {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found        

        // Prepare a WMS map request matching the OpenLayers MapPreview at 1:545K scale
        BufferedImage img = getHttpServletResponse(BBOX_1TO545K, MIME_TYPE, JOG);
        //ImageIO.write(img, "jpg", DataUtilities.urlToFile(getClass().getResource("agc-JOG(1).jpg")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("agc-JOG(1).jpg")), img, 250);
    }

    @Test
    public void testProduceMap_1To1M() throws Exception {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found        

        // Produce a map with the bounding box used by OpenLayers MapPreview at 1:1M scale
        BufferedImage img = getRenderedImageMap(BBOX_1TO1M, MIME_TYPE, JOG);
        //ImageIO.write(img, "jpg", DataUtilities.urlToFile(getClass().getResource("agc-JOG.jpg")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("agc-JOG.jpg")), img, 250);
    }

    @Test
    public void testProduceMap_1To545K() throws Exception {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found        

        // Produce a map with the bounding box used by OpenLayers MapPreview at 1:545K scale
        BufferedImage img = getRenderedImageMap(BBOX_1TO545K, MIME_TYPE, JOG);
        //ImageIO.write(img, "jpg", DataUtilities.urlToFile(getClass().getResource("agc-JOG(1).jpg")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("agc-JOG(1).jpg")), img, 250);
    }

    /**
     * Create a map using an HTTP GetMap request.
     *
     * @param bbox
     * @param mimeType
     * @param coverageName
     * @return the response's content converted to a BufferedImage
     * @throws Exception
     */
    private BufferedImage getHttpServletResponse(ReferencedEnvelope bbox, String mimeType, QName coverageName) throws Exception {
        String layer = getLayerId(coverageName);
        String request = "wms?service=wms&request=GetMap&version=1.1.1"
                + "&layers=" + layer 
                + "&styles&transparent=false"
                + "&width=" + WIDTH + "&height=" + HEIGHT
                + "&format=" + mimeType + "&srs=EPSG:4326"
                + "&bbox=" + bbox.getMinX() + "," + bbox.getMinY() + "," + bbox.getMaxX() + "," + bbox.getMaxY();

        MockHttpServletResponse servletResponse = getAsServletResponse(request);
        BufferedImage img = ImageIO.read(getBinaryInputStream(servletResponse));

        return img;
    }

    /**
     * Produce a map using an RenderedImageMapOutputFormat object.
     *
     * @param bbox
     * @param mimeType
     * @param coverageName
     * @return the map.getImage() result converted to a BufferedImage
     * @throws IOException
     */
    private BufferedImage getRenderedImageMap(ReferencedEnvelope bbox, String mimeType, final QName coverageName) throws IOException {
        WMSMapContent mapContent = createMapContent(bbox, mimeType, coverageName);

        RenderedImageMapOutputFormat format = new RenderedImageMapOutputFormat(mimeType, getWMS());
        RenderedImageMap map = format.produceMap(mapContent);
        RenderedOp op = (RenderedOp) map.getImage();
        BufferedImage img = op.getAsBufferedImage();

        return img;
    }

    private WMSMapContent createMapContent(ReferencedEnvelope bbox, String mimeType, final QName coverageName) throws IOException {
        // Prepare the request
        GetMapRequest request = createMapRequest(bbox, mimeType);

        // Prepare the map content
        final WMSMapContent mapContent = new WMSMapContent(request);
        mapContent.setMapWidth(WIDTH);
        mapContent.setMapHeight(HEIGHT);
        mapContent.getViewport().setBounds(bbox);
        mapContent.setBgColor(Color.white);
        mapContent.setTransparent(false);   // not supported by JPEG
        // Add a layer to map
        final CoverageInfo ci = getCatalog().getCoverageByName(
                coverageName.getNamespaceURI(),
                coverageName.getLocalPart());
        StyleBuilder builder = new StyleBuilder();
        GridCoverage2DReader reader = (GridCoverage2DReader) ci.getGridCoverageReader(/*listener*/null, /*hints*/ null);
        Layer l = new CachedGridReaderLayer(reader, builder.createStyle(builder.createRasterSymbolizer()));
        mapContent.addLayer(l);

        return mapContent;
    }

    private GetMapRequest createMapRequest(ReferencedEnvelope bbox, String mimeType) {
        GetMapRequest request = new GetMapRequest();
        request.setBbox(bbox);
//        request.setSRS("urn:x-ogc:def:crs:EPSG:4326");
        request.setCrs(bbox.getCoordinateReferenceSystem());
        request.setFormat(mimeType);

        return request;
    }

}
