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
package gov.nasa.worldwind.gs.wms.map;

import java.awt.RenderingHints;
import java.awt.image.IndexColorModel;
import java.awt.image.RenderedImage;
import java.io.IOException;
import java.io.OutputStream;
import javax.media.jai.RenderedOp;
import javax.media.jai.operator.ExtremaDescriptor;
import org.geoserver.platform.Operation;
import org.geoserver.platform.ServiceException;
import org.geoserver.wms.WMS;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.map.JPEGMapResponse;
import org.geoserver.wms.map.JpegPngMapResponse;
import org.geoserver.wms.map.PNGMapResponse;
import org.geoserver.wms.map.RenderedImageMap;
import org.geotools.resources.image.ImageUtilities;

/**
 * A customized JpegPngMapResponse that uses specialized logic to determine the
 * best output format for an image.
 *
 * The JpegOrPngChooser class is (was) not extensible, so some of the logic used
 * in that class has been rolled into this class.
 *
 * @author Bruce Schubert
 */
public class CustomJpegPngMapResponse extends JpegPngMapResponse {

    private final PNGMapResponse pngResponse;
    private final JPEGMapResponse jpegResponse;
    private Boolean jpegPreferred;

    public CustomJpegPngMapResponse(WMS wms, JPEGMapResponse jpegResponse, PNGMapResponse pngResponse) {
        super(wms, jpegResponse, pngResponse);
        this.jpegResponse = jpegResponse;
        this.pngResponse = pngResponse;
    }

    @Override
    public String getMimeType(Object value, Operation operation) throws ServiceException {
        RenderedImage image = ((RenderedImageMap) value).getImage();
        return isBestFormatJpeg(image) ? "image/jpeg" : "image/png";
    }

    @Override
    public String getPreferredDisposition(Object value, Operation operation) {
        RenderedImageMap map = ((RenderedImageMap) value);
        String extension = isBestFormatJpeg(map.getImage()) ? "jpeg" : "png";
        return map.getSimpleAttachmentFileName() + "." + extension;
    }

    /**
     * Transforms the rendered image into the appropriate format, streaming to
     * the output stream.
     *
     * @see RasterMapOutputFormat#formatImageOutputStream(RenderedImage,
     * OutputStream)
     */
    @Override
    public void formatImageOutputStream(RenderedImage image, OutputStream outStream, WMSMapContent mapContent)
            throws ServiceException, IOException {
        if (isBestFormatJpeg(image)) {
            this.jpegResponse.formatImageOutputStream(image, outStream, mapContent);
        } else {
            this.pngResponse.formatImageOutputStream(image, outStream, mapContent);
        }
    }

    /**
     * Returns true if the image is best formatted as a JPEG based on the
     * detection of transparency.
     *
     * @param renderedImage
     * @return
     */
    protected boolean isBestFormatJpeg(RenderedImage renderedImage) {
        if (this.jpegPreferred == null) {
            int numBands = renderedImage.getSampleModel().getNumBands();

// TODO: Research what block does.
// BDS: this block was not setting AGC or GDAL produced tiles with transparency as PNGs
//            if (numBands == 4 || numBands == 2) {
//                RenderingHints renderingHints = ImageUtilities.getRenderingHints(renderedImage);
//                RenderedOp extremaOp = ExtremaDescriptor.create(renderedImage, null, 1, 1, false, 1, renderingHints);
//                double[][] extrema = (double[][]) extremaOp.getProperty("Extrema");
//                double[] mins = extrema[0];
//
//                this.jpegPreferred = mins[mins.length - 1] == 255; // fully opaque
//            } else 
            if (renderedImage.getColorModel() instanceof IndexColorModel) {
                // JPEG would still compress a bit better, but in order to figure out
                // if the image has transparency we'd have to expand to RGB or roll
                // a new JAI image op that looks for the transparent pixels. 
                // Out of scope for the moment
                this.jpegPreferred = false;
            } else {
                // otherwise support RGB or gray
                this.jpegPreferred = (numBands == 3) || (numBands == 1);
            }
        }
        return this.jpegPreferred;
    }
}
