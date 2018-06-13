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

import java.io.Serializable;
import java.util.Objects;

/**
 * A TileMatrix inside a Geopackage. Corresponds to the gpkg_tile_matrix table.
 *
 * @author Justin Deoliveira
 * @author Niels Charlier
 *
 */
public class TileMatrix implements Serializable {

    private static final long serialVersionUID = 1L;

    Integer zoomLevel;
    Integer matrixWidth, matrixHeight;
    Integer tileWidth, tileHeight;
    Double xPixelSize;
    Double yPixelSize;
    
    Integer minCol;
    Integer maxCol;
    Integer minRow;
    Integer maxRow;

    public TileMatrix() {
    }

    public TileMatrix(Integer zoomLevel, Integer matrixWidth, Integer matrixHeight,
            Integer tileWidth, Integer tileHeight, Double xPixelSize, Double yPixelSize) {
        super();
        this.zoomLevel = zoomLevel;
        this.matrixWidth = matrixWidth;
        this.matrixHeight = matrixHeight;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.xPixelSize = xPixelSize;
        this.yPixelSize = yPixelSize;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 31 * hash + Objects.hashCode(this.zoomLevel);
        hash = 31 * hash + Objects.hashCode(this.matrixWidth);
        hash = 31 * hash + Objects.hashCode(this.matrixHeight);
        hash = 31 * hash + Objects.hashCode(this.tileWidth);
        hash = 31 * hash + Objects.hashCode(this.tileHeight);
        hash = 31 * hash + Objects.hashCode(this.xPixelSize);
        hash = 31 * hash + Objects.hashCode(this.yPixelSize);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final TileMatrix other = (TileMatrix) obj;
        if (!Objects.equals(this.zoomLevel, other.zoomLevel)) {
            return false;
        }
        if (!Objects.equals(this.matrixWidth, other.matrixWidth)) {
            return false;
        }
        if (!Objects.equals(this.matrixHeight, other.matrixHeight)) {
            return false;
        }
        if (!Objects.equals(this.tileWidth, other.tileWidth)) {
            return false;
        }
        if (!Objects.equals(this.tileHeight, other.tileHeight)) {
            return false;
        }
        if (!Objects.equals(this.xPixelSize, other.xPixelSize)) {
            return false;
        }
        if (!Objects.equals(this.yPixelSize, other.yPixelSize)) {
            return false;
        }
        return true;
    }

    /**
     * Returns the zoom level for this matrix.
     * @return zoom level
     */
    public Integer getZoomLevel() {
        return zoomLevel;
    }

    public void setZoomLevel(Integer zoomLevel) {
        this.zoomLevel = zoomLevel;
    }

    /**
     * Returns the number of columns in the matrix.
     * @return number of columns
     */
    public Integer getMatrixWidth() {
        return matrixWidth;
    }

    public void setMatrixWidth(Integer matrixWidth) {
        this.matrixWidth = matrixWidth;
    }
    
    /**
     * Returns the number of rows in the matrix.
     * @return number of rows
     */
    public Integer getMatrixHeight() {
        return matrixHeight;
    }

    public void setMatrixHeight(Integer matrixHeight) {
        this.matrixHeight = matrixHeight;
    }

    /**
     * Returns the width of a tile in pixels.
     * @return number of pixels
     */
    public Integer getTileWidth() {
        return tileWidth;
    }

    public void setTileWidth(Integer tileWidth) {
        this.tileWidth = tileWidth;
    }

    /**
     * Returns the height of a tile in pixels.
     * @return number of pixels
     */
    public Integer getTileHeight() {
        return tileHeight;
    }

    public void setTileHeight(Integer tileHeight) {
        this.tileHeight = tileHeight;
    }

    /**
     * Returns the width of a pixel in the coverage's coordinate system units.
     * @return the width of a pixel
     */
    public Double getXPixelSize() {
        return xPixelSize;
    }

    public void setXPixelSize(Double xPixelSize) {
        this.xPixelSize = xPixelSize;
    }

    /**
     * Returns the height of a pixel in the coverage's coordinate system units.
     * @return the height of a pixel
     */
    public Double getYPixelSize() {
        return yPixelSize;
    }

    public void setYPixelSize(Double yPixelSize) {
        this.yPixelSize = yPixelSize;
    }

    // Read only properties
    
    public Integer getMinCol() {
        return minCol;
    }

    public Integer getMaxCol() {
        return maxCol;
    }

    public Integer getMinRow() {
        return minRow;
    }

    public Integer getMaxRow() {
        return maxRow;
    }    
    
    public Integer getNumRows() {
        return maxRow - minRow + 1;
    }    
    
    public Integer getNumCols() {
        return maxCol - minCol + 1;
    }    
    
    public Integer getWidth() {
        if (minCol != null && maxCol != null) {
            return (maxCol - minCol + 1) * tileWidth;
        }
        return 0;
    }
    public Integer getHeight() {
        if (minRow != null && maxRow != null) {
            return (maxRow - minRow + 1) * tileHeight;
        }
        return 0;
    }
}
