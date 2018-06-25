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
package org.geotools.geopkg;

import org.geotools.geopkg.TileMatrix;
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
     * Returns the minimum zoom level found in the raster data table.
     *
     * @return the minimum zoom level, or -1 if not found
     */
    public int getMinZoomLevel() {
        return minZoom;
    }

    void setMinZoomLevel(int minZoom) {
        this.minZoom = minZoom;
    }

    /**
     * Returns the TileMatrix corresponding to the zoom level. Zoom levels range
     * from zero to the highest resolution zoom level in the GeoPackage. The
     * existence of a TileMatix for a zoom level does not mean there are tiles
     * at that zoom level.
     *
     * @param zoomLevel
     * @return a TileMatrix for the given zoom level or null if not found
     * @throws IllegalArgumentException if the zoom level greater than the
     * tileset's max zoom level
     */
    public TileMatrix getTileMatrix(int zoomLevel) {
        if (zoomLevel < minZoom || zoomLevel > maxZoom) {
            throw new IllegalArgumentException(
                    String.format("The specified zoom level (%d) is out of range (min: %d, max: %dd).",
                            zoomLevel, minZoom, maxZoom));
        }
        // The tile matrice can be out of sync with raster data, for example,
        // for a raster gpkg with a single zoom level, the tile matrix set 
        // could contain a complete from zero to max zoom, or just the single
        // zoom level.
        for (TileMatrix matrix : tileMatricies) {
            if (matrix.zoomLevel== zoomLevel) {
                return matrix;
            }
        }
        return null;
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

    /**
     * Returns the CRS corresponding to this entry's SRID.
     *
     * The CRS should have long/lat ordering.
     * 
     * @return the CRS decoded from the "EPSG:{SRID}" string
     */
    public CoordinateReferenceSystem getCrs() {
        try {
            // Deferred loading of CRS
            if (crs == null) {
                crs = CRS.decode("EPSG:" + getSrid(), true);
            }
            return crs;
        } catch (FactoryException e) {
            // TODO: log error and throw exception
            return null;
        }
    }

}
