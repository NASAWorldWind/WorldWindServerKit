/* (c) 2014 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2013 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package org.geotools.geopkg.wps;

import org.geotools.geopkg.wps.GeoPackageProcessRequest;
import com.vividsolutions.jts.geom.Envelope;
import java.awt.Color;
import java.util.List;
import java.util.logging.Logger;
import javax.xml.namespace.QName;
import org.geotools.filter.v1_0.OGC;
import org.geotools.gml3.GML;
import org.geotools.ows.v1_1.OWS;
import org.geotools.util.logging.Logging;
import org.geotools.wps.WPS;
import org.geotools.xlink.XLINK;
import org.geotools.xml.transform.TransformerBase;
import org.geotools.xml.transform.Translator;
import org.xml.sax.ContentHandler;
import org.xml.sax.helpers.AttributesImpl;

/**
 * Helper class to turn a {@link GeoPackageProcessRequest} into the
 * corresponding WPS 1.0 execute XML request.
 *
 * This class uses the GeoTools XML Transform classes.
 *
 */
public class GeoPackageProcessRequestTransformer extends TransformerBase {

    static final Logger LOGGER = Logging.getLogger(GeoPackageProcessRequestTransformer.class);

    private boolean omitWpsRequestHeaders;

    /**
     * If true, only the geopackage element is generated.
     *
     * @return the value of omitWpsRequestHeaders
     */
    public boolean isOmitWpsRequestHeaders() {
        return omitWpsRequestHeaders;
    }

    /**
     * Set the value of omitWpsRequestHeaders
     *
     * @param omitWpsRequestHeaders new value of omitWpsRequestHeaders
     */
    public void setOmitWpsRequestHeaders(boolean omitWpsRequestHeaders) {
        this.omitWpsRequestHeaders = omitWpsRequestHeaders;
    }

    @Override
    public Translator createTranslator(ContentHandler handler) {
        return new RequestTranslator(this, handler);
    }

    public class RequestTranslator extends TranslatorSupport {

        protected static final String WFS_URI = "http://www.opengis.net/wfs";
        protected static final String WPS_URI = "http://www.opengis.net/wps/1.0.0";
        protected static final String WCS_URI = "http://www.opengis.net/wcs/1.1.1";
        protected static final String XSI_PREFIX = "xsi";
        protected static final String XSI_URI = "http://www.w3.org/2001/XMLSchema-instance";

        protected GeoPackageProcessRequestTransformer base;

        public RequestTranslator(GeoPackageProcessRequestTransformer base, ContentHandler ch) {
            super(ch, null, null);
            this.base = base;
        }

        /**
         * Encodes a GeoPackageProcessRequest object as XML.
         *
         * @param o a GeoPackageProcessRequest object
         * @throws IllegalArgumentException
         */
        @Override
        public void encode(Object o) throws IllegalArgumentException {
            GeoPackageProcessRequest request = (GeoPackageProcessRequest) o;
            encode(request, true);
        }

        /**
         * Encodes a GeoPackageProcessRequest object as XML.
         *
         * @param request The GeoPackageProcessRequest to encode
         * @param mainProcess
         */
        private void encode(GeoPackageProcessRequest request, boolean mainProcess) {
            if (base.isOmitWpsRequestHeaders()) {
                handleGeoPackage(request);
            } else {
                if (mainProcess) {
                    AttributesImpl attributes = attributes("version", "1.0.0", "service", "WPS",
                            "xmlns:xsi", XSI_URI, "xmlns", WPS_URI, "xmlns:wfs", WFS_URI, "xmlns:wps",
                            WPS_URI, "xmlns:ows", OWS.NAMESPACE, "xmlns:gml", GML.NAMESPACE, "xmlns:ogc",
                            OGC.NAMESPACE, "xmlns:wcs", WCS_URI, "xmlns:xlink", XLINK.NAMESPACE,
                            "xsi:schemaLocation", WPS.NAMESPACE + " "
                            + "http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd");
                    start("wps:Execute", attributes);
                } else {
                    AttributesImpl attributes = attributes("version", "1.0.0", "service", "WPS");
                    start("wps:Execute", attributes);
                }
                element("ows:Identifier", "gs:GeoPackage");
                handleInputs(request);
                handleOutputs();
                end("wps:Execute");
            }
        }

        /**
         * Helper to build a set of attributes out of a list of key/value pairs
         *
         * @param nameValues
         */
        AttributesImpl attributes(String... nameValues) {
            AttributesImpl atts = new AttributesImpl();

            for (int i = 0; i < nameValues.length; i += 2) {
                String name = nameValues[i];
                String valu = nameValues[i + 1];

                atts.addAttribute(null, null, name, null, valu);
            }

            return atts;
        }

        /**
         * Appends the wps:DataInputs containing the geopackage element.
         *
         * @param request
         */
        public void handleInputs(GeoPackageProcessRequest request) {
            start("wps:DataInputs");
            start("wps:Input");
            element("ows:Identifier", "contents");
            start("wps:Data");
            start("wps:ComplexData", attributes("mimeType", "text/xml; subtype=geoserver/geopackage"));

            handleGeoPackage(request);

            end("wps:ComplexData");
            end("wps:Data");
            end("wps:Input");
            end("wps:DataInputs");
        }

        /**
         * Append the geopackage element.
         *
         * @param request
         */
        public void handleGeoPackage(GeoPackageProcessRequest request) {

            if (request.getName() == null || request.getName().isEmpty()) {
                throw new RuntimeException("Request name field cannot be null or empty");
            }
            start("geopackage", attributes("xmlns", "http://www.opengis.net/gpkg", "name", request.getName()));

            for (int i = 0; i < request.getLayerCount(); i++) {
                GeoPackageProcessRequest.Layer layer = request.getLayer(i);
                if (layer.getType() == GeoPackageProcessRequest.LayerType.TILES) {
                    GeoPackageProcessRequest.TilesLayer tiles = (GeoPackageProcessRequest.TilesLayer) layer;

                    if (tiles.getName() == null || tiles.getName().isEmpty()) {
                        throw new RuntimeException("TilesLayer name field cannot be null or empty.");
                    }
                    AttributesImpl tilesAttributes;
                    if (tiles.getIdentifier() != null) {
                        tilesAttributes = attributes("name", tiles.getName(), "identifier", tiles.getIdentifier());
                    } else {
                        tilesAttributes = attributes("name", tiles.getName());
                    }
                    start("tiles", tilesAttributes);

                    if (tiles.getDescription() != null) {
                        element("description", tiles.getDescription());
                    }

                    List<QName> layerList = tiles.getLayers();
                    if (layerList != null) {
                        StringBuilder layers = new StringBuilder();
                        for (QName layerName : layerList) {
                            if (layers.length() > 0) {
                                layers.append(",");
                            }
                            if (!layerName.getPrefix().isEmpty()) {
                                layers.append(layerName.getPrefix());
                                layers.append(":");
                            }
                            layers.append(layerName.getLocalPart());
                        }
                        element("layers", layers.toString());
                    }

                    List<String> stylesList = tiles.getStyles();
                    if (stylesList != null) {
                        StringBuilder styles = new StringBuilder();
                        for (String styleName : stylesList) {
                            if (styles.length() > 0) {
                                styles.append(",");
                            }
                            styles.append(styleName.toString());
                        }
                        element("styles", styles.toString());
                    }
                    if (tiles.getFormat() != null) {
                        element("format", tiles.getFormat());
                    }

                    if (tiles.getBgColor() != null) {
                        // Write out the color without the alpha
                        Color c = tiles.getBgColor();
                        element("bgcolor", String.format("ff%02x%02x%02x", c.getRed(), c.getGreen(), c.getBlue()));
                    }

                    element("transparent", tiles.isTransparent() ? "true" : "false");

                    Envelope bbox = tiles.getBbox();
                    if (bbox != null) {
                        start("bbox");
                        element("minx", Double.toString(bbox.getMinX()));
                        element("miny", Double.toString(bbox.getMinY()));
                        element("maxx", Double.toString(bbox.getMaxX()));
                        element("maxy", Double.toString(bbox.getMaxY()));
                        end("bbox");

                        element("srs", "EPSG:4326");
                    }

                    GeoPackageProcessRequest.TilesLayer.TilesCoverage coverage = tiles.getCoverage();
                    if (coverage != null) {
                        start("coverage");
                        if (coverage.getMinZoom() != null) {
                            element("minZoom", coverage.getMinZoom().toString());
                        }
                        if (coverage.getMaxZoom() != null) {
                            element("maxZoom", coverage.getMaxZoom().toString());
                        }
                        if (coverage.getMinColumn() != null) {
                            element("minColumn", coverage.getMinColumn().toString());
                        }
                        if (coverage.getMaxColumn() != null) {
                            element("maxColumn", coverage.getMaxColumn().toString());
                        }
                        if (coverage.getMinRow() != null) {
                            element("minRow", coverage.getMinRow().toString());
                        }
                        if (coverage.getMaxRow() != null) {
                            element("maxRow", coverage.getMaxRow().toString());
                        }
                        end("coverage");
                    }
                    end("tiles");
                }
            }
            end("geopackage");
        }

        /**
         * Appends the wps:ResponseForm contents.
         */
        public void handleOutputs() {
            start("wps:ResponseForm");
            start("wps:RawDataOutput");
            element("ows:Identifier", "geopackage");
            end("wps:RawDataOutput");
            end("wps:ResponseForm");
        }
    }
}
