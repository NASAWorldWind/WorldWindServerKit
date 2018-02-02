/*
 *    GeoTools - The Open Source Java GIS Toolkit
 *    http://geotools.org
 *
 *    (C) 2002-2010, Open Source Geospatial Foundation (OSGeo)
 *
 *    This library is free software; you can redistribute it and/or
 *    modify it under the terms of the GNU Lesser General Public
 *    License as published by the Free Software Foundation;
 *    version 2.1 of the License.
 *
 *    This library is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *    Lesser General Public License for more details.
 */
package gov.nasa.worldwind.geopkg;

import java.util.ArrayList;
import java.util.List;

import com.vividsolutions.jts.geom.Envelope;
import java.util.logging.Level;
import org.geotools.referencing.CRS;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CoordinateReferenceSystem;

/**
 * Tiles Entry inside a GeoPackage. Corresponds to the "geopackage_contents"
 * table.
 *
 *
 * @author Justin Deoliveira
 * @author Niels Charlier
 *
 */
public class TileEntry extends Entry {

    List<TileMatrix> tileMatricies = new ArrayList();

    Envelope tileMatrixSetBounds;
    int minZoom = -1;
    int maxZoom = -1;
    CoordinateReferenceSystem crs = null;

    public TileEntry() {
        setDataType(DataType.Tile);
    }

    public List<TileMatrix> getTileMatricies() {
        return tileMatricies;
    }

    void setTileMatricies(List<TileMatrix> tileMatricies) {
        this.tileMatricies = tileMatricies;
    }

    void init(TileEntry e) {
        super.init(e);
        setTileMatricies(e.getTileMatricies());
        this.tileMatrixSetBounds = e.tileMatrixSetBounds == null ? null : new Envelope(e.tileMatrixSetBounds);
        this.maxZoom = e.maxZoom;
        this.minZoom = e.minZoom;
    }

    /**
     * Returns the tile matrix set bounds. The bounds are expressed in the same
     * CRS as the entry, but they might differ in extent (if null, then the tile
     * matrix bounds are supposed to be the same as the entry)
     *
     * @return
     */
    public Envelope getTileMatrixSetBounds() {
        return tileMatrixSetBounds != null ? tileMatrixSetBounds : bounds;
    }

    public void setTileMatrixSetBounds(Envelope tileMatrixSetBounds) {
        this.tileMatrixSetBounds = tileMatrixSetBounds;
    }

    
    //
    // TODO: These derived properties should be placed in a new TilePyramid class.
    // TODO: TilePyramid could be a wrapper around TileEntry or derived from TileEntry
    //
    
    
    /**
     * Returns the minimum zoom level found it the raster data table.
     *
     * @return the minimum zoom level, or -1 if not found
     */
    public int getMinZoomLevel() {
        return minZoom;
    }

    void setMinZoomLevel(int minZoom) {
        this.minZoom = minZoom;
    }

    public TileMatrix getTileMatrix(int zoomLevel) {
        return this.tileMatricies.get(zoomLevel);
    }

    /**
     * Returns the maximum zoom level found it the raster data table.
     *
     * @return the maximum zoom level, or -1 if not found
     */
    public int getMaxZoomLevel() {
        return maxZoom;
    }

    void setMaxZoomLevel(int maxZoom) {
        this.maxZoom = maxZoom;
    }

    
    public CoordinateReferenceSystem getCrs() {
        try {
            // Deferred loading of CRS
            if (crs == null) {
                crs = CRS.decode("EPSG:" + getSrid(), true);
            }
            return crs;
        } catch (FactoryException e) {
            // TODO: log error
            return null;
        }
    }

}
