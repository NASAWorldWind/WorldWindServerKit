/*
 * (c) 2014 - 2015 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2013 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package gov.nasa.worldwind.gs.wms.map;

import java.awt.image.BufferedImage;
import java.awt.image.RenderedImage;
import java.awt.image.WritableRaster;
import org.geoserver.wms.WMS;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.map.RenderedImageMap;
import org.geoserver.wms.map.RenderedImageMapOutputFormat;

/**
 * CustomRenderedImageMapOutputFormat is a customized
 * RenderedImageMapOutputFormat for the image/jpeg mime type. It ensures the
 * rendered image is compatible for content in an HttpServletResponse.
 *
 * This Spring bean is used by the MapPreviewPage.getAvailableWMSFormats() which
 * calls GeoServerApplication.getBeansOfType(GetMapOutputFormat.class) to
 * discover the registered output format for the image/jpeg mime type.
 *
 * See applicationContext.xml.
 *
 * @author Bruce Schubert
 */
public class CustomRenderedImageMapOutputFormat extends RenderedImageMapOutputFormat {

    public CustomRenderedImageMapOutputFormat(WMS wms) {
        super(wms);
    }

    public CustomRenderedImageMapOutputFormat(String mime, WMS wms) {
        super(mime, wms);
    }

    public CustomRenderedImageMapOutputFormat(String mime, String[] outputFormats, WMS wms) {
        super(mime, outputFormats, wms);
    }

    /**
     * This overridden buildMap method ensures the image parameter is compatible
     * with ImageIO.read() prior to calling the super.buildMap method.
     *
     * @param mapContent
     * @param image
     * @return
     */
    @Override
    protected RenderedImageMap buildMap(WMSMapContent mapContent, RenderedImage image) {
        //
        // According to the GeoTools ImageWorker.writeJPEG() method, 
        // the JDK writer has problems with images that do not start at minx==miny==0
        // while the CLib writer has issues with tiled images. 
        //
        // I suspect the image created by the super's private directRasterImage() 
        // method called by produceMap() in "the fast path for pure coverage 
        // rendering" has a similar problem. I.e., the image is not converted
        // correctly by ImageIO.read() when processing a HttpServletResponse.
        // The image offsets are not applied correctly, e.g, the image is not
        // cropped correctly.
        //
        // Here we override the call to buildMap() in produceMap() to create an 
        // image compatible with the ImageIO.read() method used to process the 
        // "image" content returned in a HttpServletResponse.
        //
        if ((image.getTileGridXOffset() != 0 || image.getTileGridYOffset() != 0)) {
            // The following code to create the finalImage was copied from the
            // GeoTools ImageWorker.writeJPEG() method.
            final BufferedImage finalImage = new BufferedImage(
                    image.getColorModel(),
                    ((WritableRaster) image.getData()).createWritableTranslatedChild(0, 0),
                    image.getColorModel().isAlphaPremultiplied(), null);
            return super.buildMap(mapContent, finalImage);
        } else {
            return super.buildMap(mapContent, image);
        }
    }
}
