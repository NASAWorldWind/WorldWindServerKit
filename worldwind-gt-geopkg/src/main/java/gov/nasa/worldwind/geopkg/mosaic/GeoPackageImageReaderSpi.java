package gov.nasa.worldwind.geopkg.mosaic;

import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Locale;
import javax.imageio.spi.ImageReaderSpi;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageImageReaderSpi extends ImageReaderSpi {

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
    public String getDescription(Locale locale) {
        return "GeoPackage raster image reader service provider interface, version " + version;
    }

    /**
     * Returns true if the input source can be is a GeoPackage file.
     *
     * @param source a URL or File object
     * @return true if the (underlying) file extension is valid for a GeoPackage
     * @throws IOException
     */
    @Override
    public boolean canDecodeInput(Object source) throws IOException {
        File file = GeoPackageFormat.getFileFromSource(source);
        if (file == null) {
            return false;
        }
        String filename = file.getName().toLowerCase();
        for (String suffix : suffixes) {
            if (filename.endsWith("." + suffix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns an instance of a GeoPackageImageReader..
     *
     * @param extension a plug-in specific extension object, which may be null.
     * @return a new GeoPackageImageReader object
     * @throws IOException
     */
    @Override
    public GeoPackageImageReader createReaderInstance(Object extension) throws IOException {
        return new GeoPackageImageReader(this);
    }

}
