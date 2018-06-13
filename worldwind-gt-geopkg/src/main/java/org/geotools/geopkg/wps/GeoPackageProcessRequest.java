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
package org.geotools.geopkg.wps;

import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geopkg.TileMatrix;
import java.awt.Color;
import java.io.Serializable;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import javax.xml.namespace.QName;
import org.opengis.filter.Filter;

/**
 * GeoPackage Process Request. Object representation of the XML submitted to the
 * GeoPackage process.
 *
 * @author Niels Charlier
 */
public class GeoPackageProcessRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    protected String name;
    protected List<Layer> layers = new ArrayList<Layer>();
    protected URL path = null;
    protected boolean remove = true;

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 17 * hash + Objects.hashCode(this.name);
        hash = 17 * hash + Objects.hashCode(this.layers);
        hash = 17 * hash + Objects.hashCode(this.path);
        hash = 17 * hash + (this.remove ? 1 : 0);
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
        final GeoPackageProcessRequest other = (GeoPackageProcessRequest) obj;
        if (this.remove != other.remove) {
            return false;
        }
        if (!Objects.equals(this.name, other.name)) {
            return false;
        }
        if (!Objects.equals(this.layers, other.layers)) {
            return false;
        }
        if (!Objects.equals(this.path, other.path)) {
            return false;
        }
        return true;
    }

    public void addLayer(Layer layer) {
        layers.add(layer);
    }

    public Layer getLayer(int i) {
        return layers.get(i);
    }

    public int getLayerCount() {
        return layers.size();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public URL getPath() {
        return path;
    }

    public void setPath(URL path) {
        this.path = path;
    }

    public Boolean getRemove() {
        return remove;
    }

    public void setRemove(Boolean remove) {
        this.remove = remove;
    }

    /**
     *
     */
    public static abstract class Layer implements Serializable {

        private static final long serialVersionUID = 1L;

        protected String name = null;
        protected String identifier = null;
        protected String description = null;
        protected URI srs = null;
        protected Envelope bbox = null;

        @Override
        public int hashCode() {
            int hash = 7;
            hash = 79 * hash + Objects.hashCode(this.name);
            hash = 79 * hash + Objects.hashCode(this.identifier);
            hash = 79 * hash + Objects.hashCode(this.description);
            hash = 79 * hash + Objects.hashCode(this.srs);
            hash = 79 * hash + Objects.hashCode(this.bbox);
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
            return equalFields(obj);
        }
        /**
         * Allows equality test of members by subclasses.
         */
        protected boolean equalFields(Object obj) {
            final Layer other = (Layer) obj;
            if (!Objects.equals(this.name, other.name)) {
                return false;
            }
            if (!Objects.equals(this.identifier, other.identifier)) {
                return false;
            }
            if (!Objects.equals(this.description, other.description)) {
                return false;
            }
            if (!Objects.equals(this.srs, other.srs)) {
                return false;
            }
            if (!Objects.equals(this.bbox, other.bbox)) {
                return false;
            }
            return true;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getIdentifier() {
            return identifier;
        }

        public void setIdentifier(String identifier) {
            this.identifier = identifier;
        }

        public URI getSrs() {
            return srs;
        }

        public void setSrs(URI srs) {
            this.srs = srs;
        }

        public Envelope getBbox() {
            return bbox;
        }

        public void setBbox(Envelope bbox) {
            this.bbox = bbox;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public abstract LayerType getType();

    }

    public static class FeaturesLayer extends Layer implements Serializable {

        private static final long serialVersionUID = 1L;

        protected QName featureType = null;
        protected Set<QName> propertyNames = null;
        protected Filter filter = null;
        protected boolean indexed = false;

        @Override
        public int hashCode() {
            int hash = super.hashCode();
            hash = 59 * hash + Objects.hashCode(this.featureType);
            hash = 59 * hash + Objects.hashCode(this.propertyNames);
            hash = 59 * hash + Objects.hashCode(this.filter);
            hash = 59 * hash + (this.indexed ? 1 : 0);
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
            final FeaturesLayer other = (FeaturesLayer) obj;
            if (!super.equalFields(other)) {
                return false;
            }
            if (this.indexed != other.indexed) {
                return false;
            }
            if (!Objects.equals(this.featureType, other.featureType)) {
                return false;
            }
            if (!Objects.equals(this.propertyNames, other.propertyNames)) {
                return false;
            }
            if (!Objects.equals(this.filter, other.filter)) {
                return false;
            }
            return true;
        }

        @Override
        public LayerType getType() {
            return LayerType.FEATURES;
        }

        public QName getFeatureType() {
            return featureType;
        }

        public void setFeatureType(QName featureType) {
            this.featureType = featureType;
        }

        public Set<QName> getPropertyNames() {
            return propertyNames;
        }

        public void setPropertyNames(Set<QName> propertyNames) {
            this.propertyNames = propertyNames;
        }

        public Filter getFilter() {
            return filter;
        }

        public void setFilter(Filter filter) {
            this.filter = filter;
        }

        public boolean isIndexed() {
            return indexed;
        }

        public void setIndexed(boolean indexed) {
            this.indexed = indexed;
        }
    }

    public static class TilesLayer extends Layer implements Serializable {

        private static final long serialVersionUID = 1L;

        public static class TilesCoverage implements Serializable {

            private static final long serialVersionUID = 1L;

            protected Integer minZoom = null;
            protected Integer maxZoom = null;
            protected Integer minColumn = null;
            protected Integer maxColumn = null;
            protected Integer minRow = null;
            protected Integer maxRow = null;

            @Override
            public int hashCode() {
                int hash = 7;
                hash = 67 * hash + Objects.hashCode(this.minZoom);
                hash = 67 * hash + Objects.hashCode(this.maxZoom);
                hash = 67 * hash + Objects.hashCode(this.minColumn);
                hash = 67 * hash + Objects.hashCode(this.maxColumn);
                hash = 67 * hash + Objects.hashCode(this.minRow);
                hash = 67 * hash + Objects.hashCode(this.maxRow);
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
                final TilesCoverage other = (TilesCoverage) obj;

                if (!Objects.equals(this.minZoom, other.minZoom)) {
                    return false;
                }
                if (!Objects.equals(this.maxZoom, other.maxZoom)) {
                    return false;
                }
                if (!Objects.equals(this.minColumn, other.minColumn)) {
                    return false;
                }
                if (!Objects.equals(this.maxColumn, other.maxColumn)) {
                    return false;
                }
                if (!Objects.equals(this.minRow, other.minRow)) {
                    return false;
                }
                if (!Objects.equals(this.maxRow, other.maxRow)) {
                    return false;
                }
                return true;
            }

            public Integer getMinZoom() {
                return minZoom;
            }

            public void setMinZoom(Integer minZoom) {
                this.minZoom = minZoom;
            }

            public Integer getMaxZoom() {
                return maxZoom;
            }

            public void setMaxZoom(Integer maxZoom) {
                this.maxZoom = maxZoom;
            }

            public Integer getMinColumn() {
                return minColumn;
            }

            public void setMinColumn(Integer minColumn) {
                this.minColumn = minColumn;
            }

            public Integer getMaxColumn() {
                return maxColumn;
            }

            public void setMaxColumn(Integer maxColumn) {
                this.maxColumn = maxColumn;
            }

            public Integer getMinRow() {
                return minRow;
            }

            public void setMinRow(Integer minRow) {
                this.minRow = minRow;
            }

            public Integer getMaxRow() {
                return maxRow;
            }

            public void setMaxRow(Integer maxRow) {
                this.maxRow = maxRow;
            }
        }

        protected List<QName> layers = null;
        protected String format = null;
        protected Color bgColor = null;
        protected boolean transparent = false;
        protected List<String> styles = null;
        protected URI sld = null;
        protected String sldBody = null;
        protected String gridSetName = null;
        protected List<TileMatrix> grids = null;
        protected TilesCoverage coverage = null;

        @Override
        public int hashCode() {
            int hash = super.hashCode();
            hash = 97 * hash + Objects.hashCode(this.layers);
            hash = 97 * hash + Objects.hashCode(this.format);
            hash = 97 * hash + Objects.hashCode(this.bgColor);
            hash = 97 * hash + (this.transparent ? 1 : 0);
            hash = 97 * hash + Objects.hashCode(this.styles);
            hash = 97 * hash + Objects.hashCode(this.sld);
            hash = 97 * hash + Objects.hashCode(this.sldBody);
            hash = 97 * hash + Objects.hashCode(this.gridSetName);
            hash = 97 * hash + Objects.hashCode(this.grids);
            hash = 97 * hash + Objects.hashCode(this.coverage);
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
            final TilesLayer other = (TilesLayer) obj;
            if (!super.equalFields(other)) {
                return false;
            }
            if (this.transparent != other.transparent) {
                return false;
            }
            if (!Objects.equals(this.format, other.format)) {
                return false;
            }
            if (!Objects.equals(this.sldBody, other.sldBody)) {
                return false;
            }
            if (!Objects.equals(this.gridSetName, other.gridSetName)) {
                return false;
            }
            if (!Objects.equals(this.layers, other.layers)) {
                return false;
            }
            if (!Objects.equals(this.bgColor, other.bgColor)) {
                return false;
            }
            if (!Objects.equals(this.styles, other.styles)) {
                return false;
            }
            if (!Objects.equals(this.sld, other.sld)) {
                return false;
            }
            if (!Objects.equals(this.grids, other.grids)) {
                return false;
            }
            if (!Objects.equals(this.coverage, other.coverage)) {
                return false;
            }
            return true;
        }

        @Override
        public LayerType getType() {
            return LayerType.TILES;
        }

        public String getFormat() {
            return format;
        }

        public void setFormat(String format) {
            this.format = format;
        }

        public Color getBgColor() {
            return bgColor;
        }

        public void setBgColor(Color bgColor) {
            this.bgColor = bgColor;
        }

        public boolean isTransparent() {
            return transparent;
        }

        public void setTransparent(boolean transparent) {
            this.transparent = transparent;
        }

        public List<String> getStyles() {
            return styles;
        }

        public void setStyles(List<String> styles) {
            this.styles = styles;
        }

        public URI getSld() {
            return sld;
        }

        public void setSld(URI sld) {
            this.sld = sld;
        }

        public String getSldBody() {
            return sldBody;
        }

        public void setSldBody(String sldBody) {
            this.sldBody = sldBody;
        }

        public String getGridSetName() {
            return gridSetName;
        }

        public void setGridSetName(String gridSetName) {
            this.gridSetName = gridSetName;
        }

        public List<TileMatrix> getGrids() {
            return grids;
        }

        public void setGrids(List<TileMatrix> grids) {
            this.grids = grids;
        }

        public TilesCoverage getCoverage() {
            return coverage;
        }

        public void setCoverage(TilesCoverage coverage) {
            this.coverage = coverage;
        }

        public List<QName> getLayers() {
            return layers;
        }

        public void setLayers(List<QName> layers) {
            this.layers = layers;
        }

    }

    public enum LayerType {
        FEATURES, TILES
    }
}
