/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.geotools.geopkg.mosaic;

import org.geotools.geopkg.TileEntry;
import it.geosolutions.imageio.maskband.DatasetLayout;
import java.io.File;

/**
 *
 * @author Bruce Schubert
 */
public class GeoPackageDatasetLayout implements DatasetLayout {

    private final TileEntry tileset;

    public GeoPackageDatasetLayout(TileEntry tileset) {
        this.tileset = tileset;
    }

    @Override
    public int getNumInternalOverviews() {
        return tileset.getMaxZoomLevel() - tileset.getMinZoomLevel();
    }

    @Override
    public int getNumExternalOverviews() {
        return 0;
    }

    @Override
    public int getNumExternalMaskOverviews() {
        return 0;
    }

    @Override
    public int getNumInternalMasks() {
        return 0;
    }

    @Override
    public int getNumExternalMasks() {
        return 0;
    }

    @Override
    public int getInternalOverviewImageIndex(int overviewIndex) {
        if (overviewIndex > getNumInternalOverviews()) {
            return -1;
        }
        return overviewIndex;
    }

    @Override
    public int getInternalMaskImageIndex(int maskIndex) {
        return -1;
    }

    @Override
    public File getExternalMasks() {
        return null;
    }

    @Override
    public File getExternalOverviews() {
        return null;
    }

    @Override
    public File getExternalMaskOverviews() {
        return null;
    }
    
}
