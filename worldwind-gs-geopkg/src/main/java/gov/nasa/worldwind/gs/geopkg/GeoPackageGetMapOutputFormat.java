/* (c) 2014 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2013 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package gov.nasa.worldwind.gs.geopkg;

import com.google.common.collect.Sets;
import com.vividsolutions.jts.geom.Envelope;

import org.geotools.geopkg.GeoPackage;
import org.geotools.geopkg.Tile;
import org.geotools.geopkg.TileEntry;
import org.geotools.geopkg.TileMatrix;
import gov.nasa.worldwind.gs.wms.map.MapResponseOutputStreamAdaptor;

import static java.lang.String.format;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.logging.Logger;

import org.geoserver.catalog.ResourceInfo;
import org.geoserver.gwc.GWC;
import org.geoserver.ows.util.OwsUtils;
import org.geoserver.platform.GeoServerExtensions;
import org.geoserver.platform.ServiceException;
import org.geoserver.tiles.AbstractTilesGetMapOutputFormat;
import org.geoserver.wms.GetMapRequest;
import org.geoserver.wms.MapLayerInfo;
import org.geoserver.wms.RasterCleaner;
import org.geoserver.wms.WMS;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.WebMap;
import org.geoserver.wms.WebMapService;
import org.geoserver.wms.map.JPEGMapResponse;
import org.geoserver.wms.map.JpegPngMapResponse;
import org.geoserver.wms.map.PNGMapResponse;
import org.geoserver.wms.map.RawMap;
import org.geoserver.wms.map.RenderedImageMap;
import org.geoserver.wms.map.RenderedImageMapResponse;
import org.geotools.coverage.grid.io.GridCoverage2DReader;

import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.referencing.CRS;
import org.geotools.renderer.lite.RendererUtilities;
import org.geotools.util.logging.Logging;

import org.geowebcache.grid.Grid;
import org.geowebcache.grid.GridSet;
import org.geowebcache.grid.GridSubset;

import org.opengis.coverage.grid.GridEnvelope;
import org.opengis.referencing.crs.CoordinateReferenceSystem;

/**
 *
 * WMS GetMap Output Format for GeoPackage
 *
 * @author Justin Deoliveira, Boundless
 * @author Bruce Schubert, NASA
 *
 */
public class GeoPackageGetMapOutputFormat extends AbstractTilesGetMapOutputFormat {

    static Logger LOGGER = Logging.getLogger("org.geoserver.geopkg");

    protected static final String JPEG_PNG_MIME_TYPE = "image/vnd.jpeg-png";

    protected static final int TILESET_NAME_MAX_LEN = 30;   // an arbitrary value 

    public GeoPackageGetMapOutputFormat(WebMapService webMapService, WMS wms, GWC gwc) {
        super(GeoPkg.MIME_TYPE, "." + GeoPkg.EXTENSION, Sets.newHashSet(GeoPkg.NAMES), webMapService, wms, gwc);
    }

    private static class GeopackageWrapper implements TilesFile {

        GeoPackage geopkg;

        TileEntry e;

        public GeopackageWrapper(GeoPackage geopkg, TileEntry e) throws IOException {
            this.geopkg = geopkg;
            this.e = e;
        }

        public GeopackageWrapper() throws IOException {
            this(new GeoPackage(), new TileEntry());
            geopkg.init();
        }

        /**
         * Sets the metadata for this GeoPackage.
         *
         * @param name Tile pyramid user data table name
         * @param box CRS and bounding box for all content in table_name
         * @param imageFormat Image format for tiles
         * @param srid Spatial Reference System ID
         * @param mapLayers Provides the identifier (title) and description
         * (abstract)
         * @param minmax Minimum and maximum zoom levels
         * @param gridSubset The tile matrix
         * @throws IOException
         * @throws ServiceException
         */
        @Override
        public void setMetadata(String name, ReferencedEnvelope box, String imageFormat, int srid,
                List<MapLayerInfo> mapLayers, int[] minmax, GridSubset gridSubset)
                throws IOException, ServiceException {

            e.setTableName(name);
            if (mapLayers.size() == 1) {
                ResourceInfo r = mapLayers.get(0).getResource();
                if (e.getIdentifier() == null) {
                    e.setIdentifier(r.getTitle());
                }
                if (e.getDescription() == null) {
                    e.setDescription(r.getAbstract());
                }
            }
            e.setBounds(box);

            e.setSrid(srid);

            // Per the OGC GeoPackage Encoding Standard (2.2.6. Tile Matrix Set),
            // define the maximum bounding box (min_x, min_y, max_x, max_y) 
            // for all possible tiles in a tile pyramid user data table.
            CoordinateReferenceSystem crs = box.getCoordinateReferenceSystem();
            double minx = crs.getCoordinateSystem().getAxis(0).getMinimumValue();
            double miny = crs.getCoordinateSystem().getAxis(1).getMinimumValue();
            double maxx = crs.getCoordinateSystem().getAxis(0).getMaximumValue();
            double maxy = crs.getCoordinateSystem().getAxis(1).getMaximumValue();
            e.setTileMatrixSetBounds(new Envelope(minx, maxx, miny, maxy));

            GridSet gridSet = gridSubset.getGridSet();
            for (int z = minmax[0]; z < minmax[1]; z++) {
                Grid g = gridSet.getGrid(z);

                TileMatrix m = new TileMatrix();
                m.setZoomLevel(z);
                m.setMatrixWidth((int) g.getNumTilesWide());
                m.setMatrixHeight((int) g.getNumTilesHigh());
                m.setTileWidth(gridSubset.getTileWidth());
                m.setTileHeight(gridSubset.getTileHeight());

                // TODO: not sure about this
                m.setXPixelSize(g.getResolution());
                m.setYPixelSize(g.getResolution());
                // m.setXPixelSize(gridSet.getPixelSize());
                // m.setYPixelSize(gridSet.getPixelSize());

                e.getTileMatricies().add(m);
            }

            // figure out the actual bounds of the tiles to be renderered
            LOGGER.fine("Creating tile entry" + e.getTableName());
            geopkg.create(e);

        }

        @Override
        public void addTile(int zoom, int x, int y, byte[] data) throws IOException {
            Tile t = new Tile();
            t.setZoom(zoom);
            t.setColumn(x);
            t.setRow(y);
            t.setData(data);
            geopkg.add(e, t);
        }

        @Override
        public File getFile() {
            return geopkg.getFile();
        }

        @Override
        public void close() {
            geopkg.close();
        }
    }

    @Override
    protected TilesFile createTilesFile() throws IOException {
        return new GeopackageWrapper();
    }

    /**
     * Asks this map producer to create a map image for the passed
     * {@linkPlain WMSMapContext}, which contains enough information for doing
     * such a process. Typically invoked by WMS GetMap.
     *
     * @param mapContent
     * @return
     *
     * @throws ServiceException
     * @throws IOException
     */
    @Override
    public WebMap produceMap(WMSMapContent mapContent) throws ServiceException, IOException {

        // Get the map request that we'll modify before calling super.produceMap
        GetMapRequest request = mapContent.getRequest();

        // See http://docs.geoserver.org/latest/en/user/services/wms/vendor.html
        // for a comprehensive (but not complete) list of format options.
        Map formatOpts = request.getFormatOptions();

        // Per the OGC GeoPackage Encoding Standard, the tile coordinate (0,0) 
        // always refers to the tile in the upper left corner of the tile matrix 
        // at any zoom level, regardless of the actual availability of that tile.
        // Enabling the "flipy" format option will cause the base class to invert
        // the row ordering such that this requirement is satisfied.
        if (formatOpts.get("flipy") == null) {
            request.getFormatOptions().put("flipy", "true");
        }

        // Set the default image format to allow a mix of JPEG and PNG images
        // depending on whether individual image tiles have transparency or not.
        if (formatOpts.get("format") == null) {
            // For production, use image/vnd.jpeg-png to select the best
            // format for individual tiles.
            request.getFormatOptions().put("format", JPEG_PNG_MIME_TYPE);

            // For debugging, you can use image/png for viewing gpkg contents with DB Browser for SQLite
            //request.getFormatOptions().put("format", PNG_MIME_TYPE);
        }

        // Enable transparent tiles if applicable for the mime-type
        String format = (String) formatOpts.get("format");
        if (PNG_MIME_TYPE.equals(format) || JPEG_PNG_MIME_TYPE.equals(format)) {
            request.setTransparent(true);
        }

        // Set the tileset name to a valid SQLite table identifier. By default,
        // the superclass uses the layer name(s) which may not be valid SQL.
        // Here we inject our own tileset name to override the default behavior.
        String tilesetName = (String) formatOpts.get("tileset_name");
        if (tilesetName == null || !SQLiteUtils.isValidIdentifier(tilesetName)) {
            request.getFormatOptions().put("tileset_name", getValidTableName(mapContent));
        }

        // The default interpolation method is established in server's WMS Settings
        return super.produceMap(mapContent);
    }

    /**
     * Returns the zoom level, plus one, closest to the highest resolution
     * coverage used in the map request. This is the ending value used in loops
     * that process the levels, it is not the max zoom level in the GeoPackage.
     *
     * Overrides the base class behavior which returned a "zoom level + 1" where
     * the zoom level contained at least 256 tiles.
     *
     * @param gridSubset the grid for the GeoPackage
     * @param minZoom the starting zoom level
     * @param request the map request containing the layer coverages
     * @return the selected maximum zoom level + 1
     */
    @Override
    protected Integer findMaxZoomAuto(GridSubset gridSubset, Integer minZoom, GetMapRequest request) {

        // Get the maximum scale for the highest resolution layer:
        // loop through the layer coverages associated with the request
        // and compute the scale for each.
        List<MapLayerInfo> layers = request.getLayers();
        double reqScaleDenominator = Double.MAX_VALUE;
        for (MapLayerInfo layer : layers) {
            try {
                if (layer.getType() == MapLayerInfo.TYPE_RASTER) {
                    // Get the width of the underlying coverage
                    GridCoverage2DReader coverageReader = (GridCoverage2DReader) layer.getCoverageReader();
                    GridEnvelope originalGridRange = coverageReader.getOriginalGridRange();
                    int imageWidth = originalGridRange.getSpan(0); // 0=cols, 1=rows
                    // Compute the scale demonimator 
                    ReferencedEnvelope bounds = this.bounds(request);       
                    double scale = RendererUtilities.calculateOGCScale(bounds, imageWidth, null);
                    // Select the largest scale (the smallest denominator)
                    reqScaleDenominator = Math.min(scale, reqScaleDenominator);
                }
            } catch (Exception e) {
                LOGGER.warning(
                        format("Exception caught computing the scale for layer %s: %s",
                                layer.getName(), e.toString()));
            }
        }
        if (reqScaleDenominator < Double.MAX_VALUE) {
            // Find the level with the closest scale denominator to the required scale
            GridSet gridSet = gridSubset.getGridSet();
            int i = minZoom;
            double error = Math.abs(gridSet.getGrid(i).getScaleDenominator() - reqScaleDenominator);
            while (i < gridSet.getNumLevels() - 1) {
                Grid g = gridSet.getGrid(i + 1);
                double e = Math.abs(g.getScaleDenominator() - reqScaleDenominator);
                if (e > error) {
                    break;
                }
                error = e;
                i++;
            }
            // Return the selected zoom level + 1; this is the ending index 
            // used in loops, not the max zoom level in the GeoPackage
            return Math.max(i + 1, 0);
        }
        return super.findMaxZoomAuto(gridSubset, minZoom, request);
    }

    /**
     * Gets a tile set name in the form of a valid SQLite table name from the
     * map layers.
     *
     * @param mapContent Contains the request with the layer names
     * @return A valid SQLite table name
     */
    protected String getValidTableName(WMSMapContent mapContent) {
        List<MapLayerInfo> mapLayers = mapContent.getRequest().getLayers();
        Iterator<MapLayerInfo> it = mapLayers.iterator();

        // Concatenate layer name(s) ...
        String name = "";
        while (it.hasNext()) {
            name += it.next().getLayerInfo().getName() + "_";
        }
        // ... and remove the trailing underscore
        name = name.substring(0, name.length() - 1);

        // Names starting with numbers are not valid
        if (Character.isDigit(name.charAt(0))) {
            name = "num_" + name;
        }
        // Simplify the name. Quoting the name to make it valid SQL is not permitted 
        // as the GeoPackage module embeds the name-string into other identifiers
        // and thus it must be simple valid SQL free of quote characters.
        name = name.replaceAll("[^a-zA-Z0-9_]", "_");

        // Check for reserved names 
        if (SQLiteUtils.isKeyword(name)) {
            // Ensure the resulting name is not a keyword by appending some text
            name = name + "_tiles";
        } else if (name.startsWith("sqlite_") || name.startsWith("gpkg_")) {
            // Ensure there are no name collisions with gpkg or sqlite tables by prepending some text
            name = "my_" + name;
        }

        // Truncate excessively long names
        if (name.length() > TILESET_NAME_MAX_LEN) {
            name = name.substring(0, TILESET_NAME_MAX_LEN);
        }

        return name;
    }

    /**
     * Add tiles to an existing GeoPackage
     *
     * @param geopkg
     * @param map
     * @throws IOException
     */
    public void addTiles(GeoPackage geopkg, TileEntry e, GetMapRequest req, String name) throws IOException {
        addTiles(new GeopackageWrapper(geopkg, e), req, name);
    }

    /**
     * Writes out the map's image to a byte array that is compatible with
     * ImageIO.read
     *
     * @param map
     * @return
     * @throws IOException
     */
    @Override
    protected byte[] toBytes(WebMap map) throws IOException {
        ByteArrayOutputStream bout = new ByteArrayOutputStream();

        if (map instanceof RenderedImageMap) {
            RenderedImageMapResponse response;
            switch (map.getMimeType()) {
                case JPEG_PNG_MIME_TYPE:
                    JpegPngMapResponse mapResponse = new JpegPngMapResponse(wms, new JPEGMapResponse(wms), new PNGMapResponse(wms));
                    response = new MapResponseOutputStreamAdaptor(JPEG_PNG_MIME_TYPE, wms, mapResponse);
                    break;
                case JPEG_MIME_TYPE:
                    response = new MapResponseOutputStreamAdaptor(JPEG_MIME_TYPE, wms, new JPEGMapResponse(wms));
                    break;
                case PNG_MIME_TYPE:
                    response = new MapResponseOutputStreamAdaptor(PNG_MIME_TYPE, wms, new PNGMapResponse(wms));
                    break;
                default:
                    response = new MapResponseOutputStreamAdaptor(JPEG_MIME_TYPE, wms, new JPEGMapResponse(wms));
            }
            response.write(map, bout, null);
        } else if (map instanceof RawMap) {
            ((RawMap) map).writeTo(bout);
        }
        bout.flush();
        return bout.toByteArray();
    }

    /**
     * Special method to add tiles using Geopackage's own grid matrix system
     * rather than GWC gridsubsets
     *
     * @param tiles
     * @param mapLayers
     * @param map
     * @throws IOException
     * @throws ServiceException
     */
    public void addTiles(GeoPackage geopkg, TileEntry e, GetMapRequest request, List<TileMatrix> matrices, String name)
            throws IOException, ServiceException {

        List<MapLayerInfo> mapLayers = request.getLayers();

        SortedMap<Integer, TileMatrix> matrixSet = new TreeMap<Integer, TileMatrix>();
        for (TileMatrix matrix : matrices) {
            matrixSet.put(matrix.getZoomLevel(), matrix);
        }

        if (mapLayers.isEmpty()) {
            return;

        }

        // Get the RasterCleaner object
        RasterCleaner cleaner = GeoServerExtensions.bean(RasterCleaner.class
        );

        // figure out the actual bounds of the tiles to be renderered
        ReferencedEnvelope bbox = bounds(request);

        //set metadata
        e.setTableName(name);
        e.setBounds(bbox);
        e.setSrid(srid(request));
        e.getTileMatricies().addAll(matrices);
        LOGGER.fine("Creating tile entry" + e.getTableName());
        geopkg.create(e);

        GetMapRequest req = new GetMapRequest();
        OwsUtils
                .copy(request, req, GetMapRequest.class
                );
        req.setLayers(mapLayers);
        Map formatOpts = req.getFormatOptions();

        // HACK: force the GeoPackage to flip the y-axis row numbers
        formatOpts.put("flipy", "true");
        formatOpts.put("format", JPEG_PNG_MIME_TYPE);

        Integer minZoom = null;
        if (formatOpts.containsKey("min_zoom")) {
            minZoom = Integer.parseInt(formatOpts.get("min_zoom").toString());
        }

        Integer maxZoom = null;
        if (formatOpts.containsKey("max_zoom")) {
            maxZoom = Integer.parseInt(formatOpts.get("max_zoom").toString());
        } else if (formatOpts.containsKey("num_zooms")) {
            maxZoom = minZoom + Integer.parseInt(formatOpts.get("num_zooms").toString());
        }

        if (minZoom != null || maxZoom != null) {
            matrixSet = matrixSet.subMap(minZoom, maxZoom);
        }

        String imageFormat = formatOpts.containsKey("format") ? parseFormatFromOpts(formatOpts)
                : findBestFormat(request);

        CoordinateReferenceSystem crs = getCoordinateReferenceSystem(request);
        if (crs == null) {
            String srs = getSRS(request);
            try {
                crs = CRS.decode(srs);
            } catch (Exception ex) {
                throw new ServiceException(ex);
            }
        }
        double xSpan = crs.getCoordinateSystem().getAxis(0).getMaximumValue() - crs.getCoordinateSystem().getAxis(0).getMinimumValue();
        double ySpan = crs.getCoordinateSystem().getAxis(1).getMaximumValue() - crs.getCoordinateSystem().getAxis(1).getMinimumValue();
        double xOffset = crs.getCoordinateSystem().getAxis(0).getMinimumValue();
        double yOffset = crs.getCoordinateSystem().getAxis(1).getMinimumValue();

        req.setFormat(imageFormat);
        req.setCrs(crs);

        //column and row bounds
        Integer minColumn = null, maxColumn = null, minRow = null, maxRow = null;
        if (formatOpts.containsKey("min_column")) {
            minColumn = Integer.parseInt(formatOpts.get("min_column").toString());
        }
        if (formatOpts.containsKey("max_column")) {
            maxColumn = Integer.parseInt(formatOpts.get("max_column").toString());
        }
        if (formatOpts.containsKey("min_row")) {
            minRow = Integer.parseInt(formatOpts.get("min_row").toString());
        }
        if (formatOpts.containsKey("max_row")) {
            maxRow = Integer.parseInt(formatOpts.get("max_row").toString());
        }

        for (TileMatrix matrix : matrixSet.values()) {

            req.setWidth(matrix.getTileWidth());
            req.setHeight(matrix.getTileHeight());

            //long[] intersect = gridSubset.getCoverageIntersection(z, bbox);
            double resX = xSpan / matrix.getMatrixWidth();
            double resY = ySpan / matrix.getMatrixHeight();

            long minX = Math.round(Math.floor((bbox.getMinX() - xOffset) / resX));
            long minY = Math.round(Math.floor((bbox.getMinY() - yOffset) / resY));
            long maxX = Math.round(Math.ceil((bbox.getMaxX() - xOffset) / resX));
            long maxY = Math.round(Math.ceil((bbox.getMaxY() - yOffset) / resY));

            minX = minColumn == null ? minX : Math.max(minColumn, minX);
            maxX = maxColumn == null ? maxX : Math.min(maxColumn, maxX);
            minY = minRow == null ? minY : Math.max(minRow, minY);
            maxY = maxRow == null ? maxY : Math.min(maxRow, maxY);

            for (long x = minX; x < maxX; x++) {
                for (long y = minY; y < maxY; y++) {
                    req.setBbox(new Envelope(xOffset + x * resX, xOffset + (x + 1) * resX, yOffset + y * resY, yOffset + (y + 1) * resY));
                    WebMap result = webMapService.getMap(req);
                    Tile t = new Tile();
                    t.setZoom(matrix.getZoomLevel());
                    t.setColumn((int) x);
                    t.setRow((int) y);
                    t.setData(toBytes(result));
                    geopkg.add(e, t);
                    // Cleanup
                    cleaner.finished(null);
                }
            }
        }
    }
}
