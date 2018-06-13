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
package org.geotools.geopkg.wps;

import org.geotools.geopkg.wps.GeoPackageProcessRequestTransformer;
import org.geotools.geopkg.wps.GeoPackageProcessRequest;
import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geopkg.wps.xml.GPKG;
import org.geotools.geopkg.wps.xml.GPKGTestSupport;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import javax.xml.namespace.QName;
import javax.xml.transform.TransformerException;
import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;
import org.junit.Test;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageProcessRequestTransformerTest extends GPKGTestSupport {

    public GeoPackageProcessRequestTransformerTest() {
    }

    /**
     * Test that a GeoPackageProcessRequest can be converted to XML correctly.
     */
    @Test
    public void testTransformTiles() throws URISyntaxException, TransformerException, Exception {
        //System.out.println("Test GeoPackageProcessRequest for tiles");

        // Assemble the GeoGeoPackageProcessRequest to be transformed to XML
        GeoPackageProcessRequest request = new GeoPackageProcessRequest();
        GeoPackageProcessRequestTest.initializeTilesRequest(request);

        // Assemble a transformer that generates only the <geopackage/> element
        GeoPackageProcessRequestTransformer transformer = new GeoPackageProcessRequestTransformer();
        transformer.setOmitXMLDeclaration(true);
        transformer.setOmitWpsRequestHeaders(true);
        transformer.setIndentation(2);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        // Action to perform the tranform 
        transformer.transform(request, out);
        String xmlResult = out.toString();
        //System.out.println(out.toString());

        // Assert the XML is valid by trying to parse it
        buildDocument(xmlResult);
        Object object = parse();
        assertNotNull(object);

        // Assert the object contens from parsed XML are identical to the source object
        assertTrue(object instanceof GeoPackageProcessRequest);
        boolean isEqual = request.equals((GeoPackageProcessRequest) object);
        assertTrue(isEqual);
    }

}
