package org.geotools.geopkg.mosaic;

import java.io.IOException;
import java.util.Locale;
import javax.imageio.spi.ImageReaderSpi;

/**
 * The service provider interface for the GeoPackageImageReader.
 * @author Bruce Schubert
 */
public class GeoPackageImageReaderSpi extends ImageReaderSpi {

    /**
     * The class name of the image reader.
     */
    private static final String READER_CLASS_NAME = "org.geotools.geopkg.mosaic.GeoPackageImageReader";

    /**
     * The Writer SPI class name.
     */
    private static final String[] WRITER_SPI_NAME = null;

    /**
     * the flag for stream metadata support.
     */
    private static final boolean SUPPORTS_STANDARD_STREAM_METADATA_FORMAT = false;

    private static final String NATIVE_STREAM_METADATA_FORMAT_NAME = null;
    private static final String NATIVE_STREAM_METADATA_FORMAT_CLASSNAME = null;
    private static final String[] EXTRA_STREAM_METADATA_FORMAT_NAMES = null;
    private static final String[] EXTRA_STREAM_METADATA_FORMAT_CLASSNAMES = null;

    /**
     * the flag for image metadata support.
     */
    private static final boolean SUPPORTS_STANDARD_IMAGE_METADATA_FORMAT = false;

    private static final String NATIVE_IMAGE_METADATA_FORMAT_NAME = null;
    private static final String NATIVE_IMAGE_METADATA_FORMAT_CLASSNAME = null;
    private static final String[] EXTRA_IMAGE_METADATA_FORMAT_NAMES = null;
    private static final String[] EXTRA_IMAGE_METADATA_FORMAT_CLASSNAMES = null;

    /**
     * default constructor for the service provider interface.
     */
    public GeoPackageImageReaderSpi() {
        super(GeoPackageFormat.VENDOR, GeoPackageFormat.VERSION,
                GeoPackageFormat.FORMAT_NAMES, GeoPackageFormat.SUFFIXES, 
                GeoPackageFormat.MIME_TYPES, READER_CLASS_NAME, 
                GeoPackageFormat.INPUT_TYPES, WRITER_SPI_NAME,
                SUPPORTS_STANDARD_STREAM_METADATA_FORMAT, NATIVE_STREAM_METADATA_FORMAT_NAME,
                NATIVE_STREAM_METADATA_FORMAT_CLASSNAME, EXTRA_STREAM_METADATA_FORMAT_NAMES,
                EXTRA_STREAM_METADATA_FORMAT_CLASSNAMES, SUPPORTS_STANDARD_IMAGE_METADATA_FORMAT,
                NATIVE_IMAGE_METADATA_FORMAT_NAME, NATIVE_IMAGE_METADATA_FORMAT_CLASSNAME,
                EXTRA_IMAGE_METADATA_FORMAT_NAMES, EXTRA_IMAGE_METADATA_FORMAT_CLASSNAMES);
    }

    @Override
    public String getDescription(Locale locale) {
        return "GeoPackage raster image reader service provider interface, version " + version;
    }

    /**
     * Returns true if the supplied source object appears to reference a
     * GeoPackage file.
     *
     * @param source a URL, File, String or FileImageInputStreamExtImpl object
     * @return if the source object references an existing GeoPackage file
     * @throws IOException
     */
    @Override
    public boolean canDecodeInput(Object source) throws IOException {
        return GeoPackageFormat.isValidGeoPackage(source);
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
