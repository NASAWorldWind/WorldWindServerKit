
package gov.nasa.worldwind.geopkg.mosaic;

import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Locale;
import javax.imageio.spi.ImageReaderSpi;
import javax.imageio.stream.FileImageInputStream;
import javax.imageio.stream.ImageInputStream;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageImageReaderSpi extends ImageReaderSpi{
    private static final String vendorName = "worldwind.arc.nasa.gov";
    private static final String[] suffixes = {"gpkg"};
    private static final String[] formatNames = {"geopackage", "geopkg", "gpkg"};
    private static final String[] MIMETypes = {"application/x-gpkg"};
    private static final String version = "1.0";

    /**
     * the class name of the image reader.
     */
    private static final String readerCN = "gov.nasa.worldwind.geopkg.mosaic.GeoPackageImageReader";

    /**
     * the inputTypes that are accepted by the {@link GeoPackageImageReader}:
     * file, URL or filename
     */
    private static final Class[] inputTypes = new Class[]{File.class, URL.class, String.class, FileImageInputStreamExtImpl.class};

    /**
     * the writerSpiName
     */
    private static final String[] wSN = null;

    /**
     * the flag for stream metadata support.
     */
    private static final boolean supportsStandardStreamMetadataFormat = false;

    private static final String nativeStreamMetadataFormatName = null;
    private static final String nativeStreamMetadataFormatClassName = null;
    private static final String[] extraStreamMetadataFormatNames = null;
    private static final String[] extraStreamMetadataFormatClassNames = null;

    /**
     * the flag for image metadata support.
     */
    private static final boolean supportsStandardImageMetadataFormat = false;

    private static final String nativeImageMetadataFormatName = null; 
    private static final String nativeImageMetadataFormatClassName = null; 
    private static final String[] extraImageMetadataFormatNames = null;
    private static final String[] extraImageMetadataFormatClassNames = null;

 
    /**
     * default constructor for the service provider interface.
     */
    public GeoPackageImageReaderSpi() {
        super(vendorName, version, formatNames, suffixes, MIMETypes, readerCN, inputTypes, wSN,
                supportsStandardStreamMetadataFormat, nativeStreamMetadataFormatName,
                nativeStreamMetadataFormatClassName, extraStreamMetadataFormatNames,
                extraStreamMetadataFormatClassNames, supportsStandardImageMetadataFormat,
                nativeImageMetadataFormatName, nativeImageMetadataFormatClassName,
                extraImageMetadataFormatNames, extraImageMetadataFormatClassNames);
    }

    @Override
    public String getDescription( Locale locale ) {
        return "GeoPackage raster image reader service provider interface, version " + version;
    }

    @Override
    public boolean canDecodeInput( Object source ) throws IOException {
//        URI input = null;
//        if (source instanceof URI) {
//            input = (URI) source;
//        } else if (source instanceof File) {
//            input = ((File) source).toURI();
//        } else if (source instanceof FileImageInputStreamExtImpl) {
//            input = ((FileImageInputStreamExtImpl) source).getFile().toURI();
//            if (LOGGER.isLoggable(Level.FINE)) {
//                LOGGER.fine("Found a valid FileImageInputStream");
//            }
//        } else if (source instanceof URIImageInputStream) {
//            input = ((URIImageInputStream) source).getUri();
//        }
//        
//        if (input != null) {
//            return NetCDFUtilities.getFormat(input) != FileFormat.NONE;
//        } else {
//            return false;
//        }        
        return true;
    }

    @Override
    public GeoPackageImageReader createReaderInstance( Object extension ) throws IOException {
        return new GeoPackageImageReader(this);
    }
    
}
