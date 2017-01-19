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
package gov.nasa.worldwind.geopkg.mosaic;

import java.awt.BasicStroke;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.IOException;
import org.geotools.coverage.grid.GridCoverage2D;
import org.geotools.coverage.grid.GridGeometry2D;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.factory.Hints;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.geopkg.GeoPackage;
import org.geotools.geopkg.Tile;
import org.geotools.geopkg.TileEntry;
import org.geotools.geopkg.TileMatrix;
import org.geotools.geopkg.TileReader;
import org.geotools.geopkg.mosaic.GeoPackageReader;
import org.opengis.parameter.GeneralParameterValue;
import org.opengis.parameter.ParameterValue;
import org.opengis.referencing.ReferenceIdentifier;
import org.opengis.referencing.crs.CoordinateReferenceSystem;

/**
 * OGC GeoPackage Grid Reader (supports the GP mosaic datastore).
 *
 * @author Bruce Schubert
 */
public class OgcGeoPackageReader extends GeoPackageReader {

    public OgcGeoPackageReader(Object source, Hints hints) throws IOException {
        super(source, hints);
    }


    @Override
    public GridCoverage2D read(String coverageName, GeneralParameterValue[] parameters) throws IllegalArgumentException, IOException {
        TileEntry entry = tiles.get(coverageName);
        BufferedImage image = null;
        ReferencedEnvelope resultEnvelope = null;
        GeoPackage file = new GeoPackage(sourceFile);
        try {
            CoordinateReferenceSystem crs = getCoordinateReferenceSystem(coverageName);

            ReferencedEnvelope requestedEnvelope = null;
            Rectangle dim = null;

            if (parameters != null) {
                for (int i = 0; i < parameters.length; i++) {
                    final ParameterValue param = (ParameterValue) parameters[i];
                    final ReferenceIdentifier name = param.getDescriptor().getName();
                    if (name.equals(AbstractGridFormat.READ_GRIDGEOMETRY2D.getName())) {
                        final GridGeometry2D gg = (GridGeometry2D) param.getValue();
                        try {
                            requestedEnvelope = ReferencedEnvelope.create(gg.getEnvelope(), gg.getCoordinateReferenceSystem()).transform(crs, true);;
                        } catch (Exception e) {
                            requestedEnvelope = null;
                        }

                        dim = gg.getGridRange2D().getBounds();
                        continue;
                    }
                }
            }

            int leftTile, topTile, rightTile, bottomTile;

            //find the closest zoom based on horizontal resolution
            TileMatrix bestMatrix = null;
            if (requestedEnvelope != null && dim != null) {
                //requested res
                double horRes = requestedEnvelope.getSpan(0) / dim.getWidth(); //proportion of total width that is being requested
                double worldSpan = crs.getCoordinateSystem().getAxis(0).getMaximumValue() - crs.getCoordinateSystem().getAxis(0).getMinimumValue();

                //loop over matrices            
                double difference = Double.MAX_VALUE;
                for (TileMatrix matrix : entry.getTileMatricies()) {
                    double newRes = worldSpan / (matrix.getMatrixWidth() * matrix.getTileWidth());
                    double newDifference = Math.abs(horRes - newRes);
                    if (newDifference < difference) {
                        difference = newDifference;
                        bestMatrix = matrix;
                    }
                }
            }
            if (bestMatrix == null) {
                bestMatrix = entry.getTileMatricies().get(0);
            }

            //take available tiles from database
            leftTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), false, false);   // booleans: isMax, isRow
            rightTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), true, false);
            topTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), false, true);     // min tile_row
            bottomTile = file.getTileBound(entry, bestMatrix.getZoomLevel(), true, true);   // max tile_row

            double resX = (crs.getCoordinateSystem().getAxis(0).getMaximumValue() - crs.getCoordinateSystem().getAxis(0).getMinimumValue()) / bestMatrix.getMatrixWidth();
            double resY = (crs.getCoordinateSystem().getAxis(1).getMaximumValue() - crs.getCoordinateSystem().getAxis(1).getMinimumValue()) / bestMatrix.getMatrixHeight();
            double originX = crs.getCoordinateSystem().getAxis(0).getMinimumValue(); // left
            double originY = crs.getCoordinateSystem().getAxis(1).getMaximumValue(); // top

            if (requestedEnvelope != null) { // crop tiles to requested envelope                   
                leftTile = Math.max(leftTile, (int) Math.round(Math.floor((requestedEnvelope.getMinimum(0) - originX) / resX)));
                rightTile = Math.max(leftTile, (int) Math.min(rightTile, Math.round(Math.floor((requestedEnvelope.getMaximum(0) - originX) / resX))));

                topTile = Math.max(topTile, (int) Math.round(Math.floor((originY - requestedEnvelope.getMaximum(1)) / resY)));
                bottomTile = Math.max(topTile, (int) Math.min(bottomTile, Math.round(Math.ceil((originY - requestedEnvelope.getMinimum(1)) / resY))));
            }

            int width = (int) (rightTile - leftTile + 1) * DEFAULT_TILE_SIZE;
            int height = (int) (bottomTile - topTile + 1) * DEFAULT_TILE_SIZE;

            //recalculate the envelope we are actually returning
            resultEnvelope = new ReferencedEnvelope(originX + leftTile * resX, originX + (rightTile + 1) * resX, originY - topTile * resY, originY - (bottomTile + 1) * resY, crs);

            TileReader it;
            it = file.reader(entry, bestMatrix.getZoomLevel(), bestMatrix.getZoomLevel(), leftTile, rightTile, topTile, bottomTile);

            while (it.hasNext()) {
                Tile tile = it.next();

                BufferedImage tileImage = readImage(tile.getData());
                
                ////////////////////////////////////////////////////////////////
                // Uncomment block to draw a border around the tiles for debugging
//                {
//                    Graphics2D graphics = tileImage.createGraphics();
//                    float thickness = 2;
//                    graphics.setStroke(new BasicStroke(thickness));
//                    graphics.drawRect(0, 0, tileImage.getWidth(), tileImage.getHeight());
//                }
                ////////////////////////////////////////////////////////////////
                
                if (image == null) {
                    // Create a BufferedImage.TYPE_3BYTE_BGR image with a white background
                    image = getStartImage(width, height);
                }
                
                // Get the tile coordinates within the mosaic
                int posx = (int) (tile.getColumn() - leftTile) * DEFAULT_TILE_SIZE;
                int posy = (int) (tile.getRow() - topTile) * DEFAULT_TILE_SIZE;

                // Draw the tile in the mosaic. We draw versus coping data to 
                // accomdate different SampleModels between image tiles.
                Graphics2D g2 = image.createGraphics();
                g2.drawImage(tileImage, posx, posy, DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE, null);
            }

            it.close();

            if (image == null) { // no tiles ??
                image = getStartImage(width, height);
            }
        } finally {
            file.close();
        }
        return coverageFactory.create(entry.getTableName(), image, resultEnvelope);
    }

}
