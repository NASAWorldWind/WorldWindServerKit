package gov.nasa.worldwind.gs.geopkg.wps;

import com.vividsolutions.jts.geom.Envelope;
import gov.nasa.worldwind.geopkg.wps.GeoPackageProcessRequest;
import gov.nasa.worldwind.geopkg.wps.xml.GPKGConfiguration;
import java.awt.Color;

import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import javax.xml.namespace.QName;

import org.apache.commons.io.IOUtils;

import org.geoserver.util.EntityResolverProvider;
import org.geoserver.wps.ppio.ComplexPPIO;

import org.geotools.ows.ServiceException;
import org.geotools.xml.Configuration;
import org.geotools.xml.Parser;

public class GeoPackageProcessRequestPPIO extends ComplexPPIO {

    Configuration config = new GPKGConfiguration();

    EntityResolverProvider resolverProvider;

    protected GeoPackageProcessRequestPPIO(EntityResolverProvider resolverProvider) {
        super(GeoPackageProcessRequest.class, GeoPackageProcessRequest.class, "text/xml; subtype=geoserver/geopackage");
        this.resolverProvider = resolverProvider;
    }

    /**
     * Decodes a ComplexDataBinding "contents" HashMap. This method is a
     * workaround to an issue where the ComplexDataBinding is returning a
     * HashMap instead of a String. The unit tests follow the prescribed path
     * and use the gpkg.xsd bindings, but at runtime, a different branch is
     * followed and the bindings are not used and a HashMap is returned.
     *
     * @param contents HashMap containing the contents of the geopackage
     * element.
     * @return The request
     * @throws Exception
     */
    public GeoPackageProcessRequest decodeContents(HashMap contents) throws Exception {
        // The return value that we'll build up
        GeoPackageProcessRequest request = new GeoPackageProcessRequest();

        // Name (manadatory) used for the GeoPackage file name
        String name = (String) contents.get("name");
        if (name == null || name.isEmpty()) {
            return null;
        }
        request.setName(name);

        Object tiles = contents.get("tiles");
        if (tiles != null) {
            if (tiles instanceof ArrayList) {
                for (Object node : (ArrayList) tiles) {
                    GeoPackageProcessRequest.TilesLayer layer = createLayer((HashMap) node);
                    request.addLayer(layer);
                }
            } else if (tiles instanceof HashMap) {
                GeoPackageProcessRequest.TilesLayer layer = createLayer((HashMap) tiles);
                request.addLayer(layer);
            }
        }
        return request;
    }

    private GeoPackageProcessRequest.TilesLayer createLayer(HashMap node) throws NumberFormatException {
        GeoPackageProcessRequest.TilesLayer layer = new GeoPackageProcessRequest.TilesLayer();
        List<QName> layers = new ArrayList<QName>();
        for (String layerName : Arrays.asList(((String) node.get("layers")).split(","))) {
            layers.add(new QName(null, layerName.trim()));
        }
        layer.setLayers(layers);
        String styleNames = (String) node.get("styles");
        if (styleNames != null) {
            List<String> styles = new ArrayList<String>();
            for (String styleName : Arrays.asList(styleNames.split(","))) {
                styles.add(styleName.trim());
            }
            layer.setStyles(styles);
        }
        //layer.setSld((URI) node.getChildValue("sld"));
        //layer.setSldBody((String) node.getChildValue("sldBody"));
        layer.setFormat((String) node.get("format"));
        layer.setName((String) node.get("name"));
        layer.setIdentifier((String) node.get("identifer"));
        String srs = (String) node.get("srs");
        if (srs != null) {
            layer.setSrs(URI.create(srs));
        }
        String bgColor = (String) node.get("bgcolor");
        if (bgColor != null) {
            layer.setBgColor(Color.decode("#" + bgColor));
        }
        Boolean transparent = (Boolean) node.get("transparent");
        if (transparent != null) {
            layer.setTransparent(transparent);
        }

        HashMap cov = (HashMap) node.get("coverage");
        if (cov != null) {
            GeoPackageProcessRequest.TilesLayer.TilesCoverage coverage = new GeoPackageProcessRequest.TilesLayer.TilesCoverage();
            coverage.setMinZoom(getInteger(cov.get("minZoom")));
            coverage.setMaxZoom(getInteger(cov.get("maxZoom")));
            coverage.setMinRow(getInteger(cov.get("minRow")));
            coverage.setMaxRow(getInteger(cov.get("maxRow")));
            coverage.setMinColumn(getInteger(cov.get("minColumn")));
            coverage.setMaxColumn(getInteger(cov.get("maxColumn")));

            layer.setCoverage(coverage);
        }

        HashMap grd = (HashMap) node.get("gridset");
        if (grd != null) {
            // TODO: process name and grids list
        }

        HashMap bbox = (HashMap) node.get("bbox");
        if (bbox != null) {
            double minx = Double.parseDouble((String) bbox.get("minx"));
            double miny = Double.parseDouble((String) bbox.get("miny"));
            double maxx = Double.parseDouble((String) bbox.get("maxx"));
            double maxy = Double.parseDouble((String) bbox.get("maxy"));

            layer.setBbox(new Envelope(minx, maxx, miny, maxy));
        }
        return layer;
    }

    private static Integer getInteger(Object element) {
        if (element == null || !(element instanceof String)) {
            return null;
        }
        try {
            return Integer.parseInt((String) element);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Override
    public Object decode(InputStream input) throws Exception {
        Parser p = new Parser(config);
        p.validate(input);
        p.setEntityResolver(resolverProvider.getEntityResolver());

        if (!p.getValidationErrors().isEmpty()) {
            throw new ServiceException("Errors were encountered while parsing GeoPackage contents: " + p.getValidationErrors());
        }

        input.reset();
        return p.parse(input);
    }

    @Override
    public Object decode(Object input) throws Exception {
        if (input == null) {
            return null;
        } else if (input instanceof HashMap) {
            return decodeContents((HashMap) input);
        } else if (input instanceof GeoPackageProcessRequest) {
            return input;
        } else if (input instanceof String) {
            return decode(IOUtils.toInputStream((String) input));
        } else {
            throw new IllegalArgumentException("Cannot convert " + input + " into a GeoPackageProcessRequest object");
        }
    }

    @Override
    public void encode(Object value, OutputStream os) throws Exception {
        throw new UnsupportedOperationException();
    }

    @Override
    public String getFileExtension() {
        return null;
    }

}
