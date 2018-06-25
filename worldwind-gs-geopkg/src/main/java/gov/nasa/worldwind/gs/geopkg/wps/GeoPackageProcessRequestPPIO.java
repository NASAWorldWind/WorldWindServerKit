package gov.nasa.worldwind.gs.geopkg.wps;

import org.geotools.geopkg.wps.GeoPackageProcessRequest;
import org.geotools.geopkg.wps.xml.GPKGConfiguration;
import org.geotools.geopkg.wps.xml.GPKGParserDelegate;

import java.io.InputStream;
import java.io.OutputStream;

import org.apache.commons.io.IOUtils;

import org.geoserver.util.EntityResolverProvider;
import org.geoserver.wps.ppio.ComplexPPIO;
import org.geoserver.wps.xml.WPSConfiguration;
import org.geotools.ows.ServiceException;
import org.geotools.xml.Parser;
import org.picocontainer.MutablePicoContainer;

/**
 * GeoPackageProcessRequestPPIO is the GeoPackageProcessRequest WPS process
 * parameter input / output (PPIO) for data on the
 * {@code "text/xml; subtype=geoserver/geopackage"} mime type.
 * <p/>
 * GeoPackageProcessRequestPPIO is registered as a Spring bean.
 *
 * <pre>{@code
 * <wps:ComplexData mimeType="text/xml; subtype=geoserver/geopackage">
 *     <geopackage xmlns="http://www.opengis.net/gpkg"  name="...">
 *     ...
 *     </geopackage>}
 * </pre>
 *
 * @author Bruce Schubert (contributor)
 */
public class GeoPackageProcessRequestPPIO extends ComplexPPIO {

    GPKGConfiguration config = new GPKGConfiguration();

    EntityResolverProvider resolverProvider;

    /**
     * Constructor, registered in the Spring applicationContext. This
     * constructor adds the GPKG bindings/parser to the WPS bindings
     * configuration.
     *
     * The stock {@link WPSConfiguration} does not have the requisite bindings
     * to parse the {@code <geopackage xmlns="http://www.opengis.net/gpkg"/>}
     * content. Adding a {@link GPKGParserDelegate} to the WPS config makes it
     * possible to parse a GeoPackage WPS request with the gpkg.xsd bindings.
     *
     * @param resolverProvider GeoServer XML EnityResolver
     * @param wpsConfiguration WPS bindings configuration used to execute the
     * WPS request: the wpsXmlConfiguration-1.0.0 bean registered in the
     * wps-core module's Spring context
     */
    protected GeoPackageProcessRequestPPIO(EntityResolverProvider resolverProvider, WPSConfiguration wpsConfiguration) {
        super(GeoPackageProcessRequest.class, GeoPackageProcessRequest.class, "text/xml; subtype=geoserver/geopackage");
        this.resolverProvider = resolverProvider;

        if (wpsConfiguration == null) {
            throw new IllegalArgumentException("WPSConfiguration argument cannot be null");
        }
        // Add an XSDParserDelegate capable of parsing the gpkg.xsd schema to the
        // WPS bindings/parsers.
        MutablePicoContainer context = wpsConfiguration.getContext();
        context.registerComponentInstance(new GPKGParserDelegate());
    }

    /**
     * Decodes the parameter from an external source or input stream to a
     * GeoPackageProcessRequest. This decode method is used when a
     * SimpleInputProvider is used via the unit tests.
     *
     * @param input an input stream
     * @return a GeoPackageProcessRequest
     * @throws Exception
     */
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

    /**
     * Decodes the parameter from an external source that has been pre-parsed.
     * <p>
     * This method should transform the object from the external representation
     * to the internal representation: a GeoPackageProcessRequest.
     * </p>
     *
     * @param input An object from the XML parser
     * @return a GeoPackageProcessRequest
     * @throws Exception
     */
    @Override
    public Object decode(Object input) throws Exception {
        if (input == null) {
            return null;
        } else if (input instanceof GeoPackageProcessRequest) {
            // call via web server
            return input;
        } else if (input instanceof String) {
            // call from SimpleInputProvider via unit tests
            return decode(IOUtils.toInputStream((String) input));
        } else {
            // possibly a HashMap - a sign that the GPKG bindings were not found by the parser
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
