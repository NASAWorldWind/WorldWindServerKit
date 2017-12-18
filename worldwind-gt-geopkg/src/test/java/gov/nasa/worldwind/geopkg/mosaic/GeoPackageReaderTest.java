/*
 *    GeoTools - The Open Source Java GIS Toolkit
 *    http://geotools.org
 *
 *    (C) 2002-2010, Open Source Geospatial Foundation (OSGeo)
 *
 *    This library is free software; you can redistribute it and/or
 *    modify it under the terms of the GNU Lesser General Public
 *    License as published by the Free Software Foundation;
 *    version 2.1 of the License.
 *
 *    This library is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *    Lesser General Public License for more details.
 */
package gov.nasa.worldwind.geopkg.mosaic;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.awt.Rectangle;
import java.awt.image.RenderedImage;
import java.io.IOException;
import java.net.URL;
import javax.imageio.ImageIO;
import javax.media.jai.ImageLayout;

import org.geotools.coverage.grid.GridCoverage2D;
import org.geotools.coverage.grid.GridEnvelope2D;
import org.geotools.coverage.grid.GridGeometry2D;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.data.DataUtilities;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.image.test.ImageAssert;
import org.geotools.parameter.Parameter;
import org.geotools.referencing.CRS;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assume.assumeNotNull;
import org.junit.Ignore;
import org.junit.Test;
import org.opengis.parameter.GeneralParameterValue;

public class GeoPackageReaderTest {

    private final static String GEOPACKAGE = "GeoPackageTutorial.gpkg";
    private final static String COVERAGE_NAME = "GeoPackageTutorial";
    private final static ReferencedEnvelope BBOX = new ReferencedEnvelope(
            -76.0693359375,
            -75.9814453125,
            36.7822265625,
            36.8701171875,
            DefaultGeographicCRS.WGS84
    );

    @Test
    public void testImageLayout() throws IOException {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found

        GeoPackageReader reader = new GeoPackageReader(gpkg, null);
        ImageLayout imageLayout = reader.getImageLayout();
        assertNotNull("ImageLayout must not be null", imageLayout);

    }

    @Test
    public void testZoomLevel_12() throws IOException {
        URL gpkg = getClass().getResource(GEOPACKAGE);
        assumeNotNull(gpkg);  // Skip test if not found

        // Get an image from the coverage containing, but not cropped to, the bounding box 
        GeoPackageReader reader = new GeoPackageReader(gpkg, null);
        GeneralParameterValue[] parameters = new GeneralParameterValue[1];
        GridGeometry2D gg = new GridGeometry2D(new GridEnvelope2D(new Rectangle(500, 500)), BBOX);
        parameters[0] = new Parameter<GridGeometry2D>(AbstractGridFormat.READ_GRIDGEOMETRY2D, gg);
        GridCoverage2D gc = reader.read(COVERAGE_NAME, parameters);
        RenderedImage img = gc.getRenderedImage();

        assertEquals(BBOX.getMinX(), gc.getEnvelope().getMinimum(0), 0.01);
        assertEquals(BBOX.getMinY(), gc.getEnvelope().getMinimum(1), 0.01);
        assertEquals(BBOX.getMaxX(), gc.getEnvelope().getMaximum(0), 0.01);
        assertEquals(BBOX.getMaxY(), gc.getEnvelope().getMaximum(1), 0.01);
        assertEquals(512, img.getWidth());
        assertEquals(512, img.getHeight());

        assertTrue(CRS.equalsIgnoreMetadata(gc.getCoordinateReferenceSystem(), gc.getEnvelope().getCoordinateReferenceSystem()));

//        ImageIO.write(img, "png", DataUtilities.urlToFile(getClass().getResource("GeoPackageTutorial.png")));
        ImageAssert.assertEquals(DataUtilities.urlToFile(getClass().getResource("GeoPackageTutorial.png")), img, 250);

    }

}
