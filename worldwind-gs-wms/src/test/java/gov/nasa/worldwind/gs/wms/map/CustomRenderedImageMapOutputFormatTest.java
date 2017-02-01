/* (c) 2014 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2013 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package gov.nasa.worldwind.gs.wms.map;

import java.awt.image.RenderedImage;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import org.geoserver.web.GeoServerWicketTestSupport;
import org.geoserver.wms.GetMapOutputFormat;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.map.RenderedImageMap;
import org.junit.Test;
import static org.junit.Assert.*;
import org.junit.Ignore;

/**
 *
 * @author Bruce Schubert
 */
public class CustomRenderedImageMapOutputFormatTest extends GeoServerWicketTestSupport {

    public CustomRenderedImageMapOutputFormatTest() {
    }

    /**
     * Add the our JPEGMapProducer Spring bean to the test's class path
     */
    @Override
    protected void setUpSpring(List<String> springContextLocations) {
        super.setUpSpring(springContextLocations);
        springContextLocations.add("classpath:applicationContext.xml");
    }

    /**
     * Test of buildMap method, of class CustomRenderedImageMapOutputFormat.
     */
    @Ignore
    @Test
    public void testBuildMap() {
// TODO: construct a RenderedImage (JAI PlanerImage) with a TranlateIntOpImage type
//        System.out.println("buildMap");
//        WMSMapContent mapContent = null;
//        RenderedImage image = null;
//        CustomRenderedImageMapOutputFormat instance = null;
//        RenderedImageMap expResult = null;
//        RenderedImageMap result = instance.buildMap(mapContent, image);
//        assertEquals(expResult, result);
//        // TODO review the generated test code and remove the default call to fail.
//        fail("The test case is a prototype.");
    }

    @Test
    public void testDiscoverCustomRenderedImageMapOutputFormat() {
        System.out.println("discover CustomRenderedImageMapOutputFormat");
        final List<GetMapOutputFormat> outputFormats = getGeoServerApplication().getBeansOfType(GetMapOutputFormat.class);
        boolean found = false;
        int mimeTypeCount = 0;

        // Check for the existance of the CustomRenderedImageMapOutputFormat bean
        // and the count of image/jpeg mime type producers
        for (GetMapOutputFormat producer : outputFormats) {
            System.out.println(producer.getClass() + " : " + producer.getMimeType());
            if ("CustomRenderedImageMapOutputFormat".equals(producer.getClass().getSimpleName())) {
                found = true;
            }
            if ("image/jpeg".equals(producer.getMimeType())) {
                mimeTypeCount++;
            }
        }
        assertTrue("CustomRenderedImageMapOutputFormat bean must be instantiated", found);
        assertTrue("Only one 'image/jpeg' mime type allowed", mimeTypeCount == 1);
    }

}
