/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gov.nasa.worldwind.geopkg.mosaic;

import it.geosolutions.imageio.stream.input.FileImageInputStreamExtImpl;
import java.awt.Dimension;
import java.awt.image.BufferedImage;
import java.awt.image.ColorModel;
import java.awt.image.Raster;
import java.awt.image.SampleModel;
import java.awt.image.WritableRaster;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.zip.DataFormatException;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.stream.ImageInputStream;
import javax.media.jai.ImageLayout;
import javax.media.jai.PlanarImage;
import org.geotools.resources.image.ImageUtilities;
import org.opengis.coverage.grid.GridEnvelope;
import org.opengis.util.ProgressListener;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageImageReader extends ImageReader {

    /**
     * This method sets the input only if the input object is a supported input
     * type.
     */
    @Override
    public void setInput(Object source, boolean seekForwardOnly, boolean ignoreMetadata) {
        if (source instanceof FileImageInputStreamExtImpl) {
            source = ((FileImageInputStreamExtImpl) source).getFile();
//            if (LOGGER.isLoggable(Level.FINE)) {
//                LOGGER.fine("Found a valid FileImageInputStream");
//            }
        }
        super.setInput(source, seekForwardOnly, ignoreMetadata);

    }

    /**
     * The {@linkplain GeoPackageReader} that takes care of all the input needed
     * to read raster geopackage files.
     */
    private GeoPackageReader gpkgReader = null;

    /**
     * An array of coverage names that map to the imageIndex arguments
     */
    private String[] coverageNames = null;

    /**
     * the flag defining if there are some listeners attached to this reader.
     */
    private boolean hasListeners;

    /**
     * the {@link ColorModel} to be used for the read raster.
     */
    public ColorModel ccmdl = null;

    /**
     * the {@link SampleModel} associated to this reader.
     */
    private SampleModel csm = null;

    /**
     * the {@link ImageTypeSpecifier} associated to this reader.
     */
    private ImageTypeSpecifier imageType;

    /**
     * the hashmap holding reference of all the available images.
     */
    private HashMap<Integer, BufferedImage> imagesMap = new HashMap<Integer, BufferedImage>();

    private boolean useSubSamplingAsRequestedRowcols = false;
    private boolean castDoubleToFloating = false;

//    /**
//     * A progress monitor, set to a dummy one, in the case it is not set by the
//     * user.
//     */
//    private ProgressListener monitor = new DummyProgressListener();
    public void setUseSubSamplingAsRequestedRowcols(boolean useSubSamplingAsRequestedRowcols) {
        this.useSubSamplingAsRequestedRowcols = useSubSamplingAsRequestedRowcols;
    }

    public void setCastDoubleToFloating(boolean castDoubleToFloating) {
        this.castDoubleToFloating = castDoubleToFloating;
    }

    /**
     * constructs an {@link ImageReader} able to read grass raster maps.
     *
     * @param originatingProvider the service provider interface for the reader.
     */
    public GeoPackageImageReader(GeoPackageImageReaderSpi originatingProvider) {
        super(originatingProvider);
    }

    /**
     * Opens the GeoPackage raster file and obtains the coverage names used for
     * the image index.
     * <p>
     * This method has to be called before any data access, in order to already
     * have the native raster data metadata available.
     * </p>
     *
     * @return <code>true</code> if everything is consistent
     * @throws IIOException
     */
    private void ensureOpen() throws IOException {
        if (gpkgReader == null) {
            gpkgReader = new GeoPackageReader((File) input, /*hints*/ null);
            //
            coverageNames = gpkgReader.getGridCoverageNames();
        }
    }

    /*
     * Returns the height in pixels of the given image within the
     * input source.
     */
    @Override
    public int getHeight(final int imageIndex) throws IOException {
        ensureOpen();
        if (gpkgReader != null) {
            // Get the envelope surrounding the tiles found in the maximum zoom level
            GridEnvelope gridRange = gpkgReader.getOriginalGridRange(coverageNames[imageIndex]);
            final Dimension tileSize = ImageUtilities.toTileSize(new Dimension(gridRange.getSpan(0), gridRange.getSpan(1)));
            return tileSize.height;
        }
        return -1;
    }

    public int getWidth(final int imageIndex) throws IOException {
        ensureOpen();
        if (gpkgReader != null) {
            // Get the envelope surrounding the tiles found in the maximum zoom level
            GridEnvelope gridRange = gpkgReader.getOriginalGridRange(coverageNames[imageIndex]);
            final Dimension tileSize = ImageUtilities.toTileSize(new Dimension(gridRange.getSpan(0), gridRange.getSpan(1)));
            return tileSize.width;
        }
        return -1;
    }

    /**
     * Returns the number of grid coverages in the raster GeoPackage.
     *
     * @param allowSearch ignored
     * @return the number of grid coverages
     * @throws IOException
     */
    @Override
    public int getNumImages(final boolean allowSearch) throws IOException {
        ensureOpen();
        return gpkgReader.getGridCoverageCount();
    }

    @Override
    public synchronized Iterator<ImageTypeSpecifier> getImageTypes(final int imageIndex) throws IOException {
        ensureOpen();

        csm = gpkgReader.getImageLayout(coverageNames[imageIndex]).getSampleModel(null);
        ccmdl = PlanarImage.createColorModel(csm);
        final List<ImageTypeSpecifier> l = new ArrayList<>();

        if (imageType == null) {
            imageType = new ImageTypeSpecifier(ccmdl, csm);
            l.add(imageType);
        }
        return l.iterator();
    }

    @Override
    public IIOMetadata getStreamMetadata() throws IOException {
        return null;
    }

    @Override
    public IIOMetadata getImageMetadata(final int imageIndex) throws IOException {
        return null;
    }

//    public void setMonitor(ProgressListener monitor) {
//        this.monitor = monitor;
//    }
    /**
     * Performs the read method adding the possibility to override subsampling.
     *
     * @param imageIndex same as
     * {@link GrassBinaryImageReader#read(int, ImageReadParam)}
     * @param param same as
     * {@link GrassBinaryImageReader#read(int, ImageReadParam)}
     * @param useSubSamplingAsRequestedRowcols a flag that gives the possibility
     * to bypass the imageio subsampling mechanism. With GRASS maps this is
     * often more performant in some boundary situations. In the case this flag
     * is set to true, the subsampling values will be handled as the requested
     * columns and rows.
     * @param castDoubleToFloating a flag that gives the possibility to force
     * the reading of a map as a floating point map. This is necessary right now
     * because of a imageio bug:
     * https://jai-imageio-core.dev.java.net/issues/show_bug.cgi?id=180
     * @param monitor
     * @return same as {@link GrassBinaryImageReader#read(int, ImageReadParam)}
     * @throws IOException same as
     * {@link GrassBinaryImageReader#read(int, ImageReadParam)}
     */
    public BufferedImage read(final int imageIndex, ImageReadParam param,
            boolean useSubSamplingAsRequestedRowcols, boolean castDoubleToFloating,
            ProgressListener monitor) throws IOException {
        ensureOpen();
        this.useSubSamplingAsRequestedRowcols = useSubSamplingAsRequestedRowcols;
        this.castDoubleToFloating = castDoubleToFloating;
//        this.monitor = monitor;

        return read(imageIndex, param);
    }

    @Override
    public BufferedImage read(final int imageIndex, ImageReadParam param) throws IOException {
        ensureOpen();
        throw new UnsupportedOperationException("read(final int imageIndex, ImageReadParam param) not implemented!");
    }

    @Override
    public BufferedImage read(final int imageIndex) throws IOException {
        ensureOpen();
        return read(imageIndex, null);
    }

    @Override
    public Raster readRaster(final int imageIndex, ImageReadParam param) throws IOException {
        ensureOpen();
        throw new UnsupportedOperationException("readRaster(final int imageIndex, ImageReadParam param) not implemented!");
    }

    /**
     * Resets this {@link GrassBinaryImageReader}.
     */
    @Override
    public void reset() {
        dispose();
        super.setInput(null, false, false);
        gpkgReader = null;
        csm = null;
        imageType = null;
    }

//    /**
//     * Request to abort any current read operation.
//     */
//    @Override
//    public synchronized void abort() {
//        // super.abort();
//        if (gpkgReader != null) {
//            gpkgReader.abort();
//            gpkgReader = null;
//        }
//    }
//    /**
//     * Checks if a request to abort the current read operation has been made.
//     */
//    protected synchronized boolean abortRequested() {
//        return gpkgReader.isAborting();
//    }
}
