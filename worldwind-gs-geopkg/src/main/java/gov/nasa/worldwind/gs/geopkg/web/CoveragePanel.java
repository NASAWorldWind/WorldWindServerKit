/* (c) 2014 - 2016 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2013 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package gov.nasa.worldwind.gs.geopkg.web;

import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.form.FormComponentPanel;
import org.apache.wicket.markup.html.form.TextField;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;
import org.apache.wicket.model.PropertyModel;
import org.apache.wicket.model.ResourceModel;

import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geopkg.wps.GeoPackageProcessRequest.TilesLayer.TilesCoverage;
import org.apache.wicket.Component;
import org.apache.wicket.util.visit.IVisit;
import org.geoserver.catalog.Catalog;
import org.geoserver.catalog.CoverageInfo;
import org.geoserver.web.wicket.DecimalTextField;
import org.geotools.renderer.lite.RendererUtilities;
import org.geowebcache.grid.BoundingBox;
import org.geowebcache.grid.GridSet;
import org.geoserver.catalog.LayerInfo;
import org.geoserver.catalog.PublishedType;
import org.geotools.factory.GeoTools;
import org.geowebcache.grid.Grid;

import org.geowebcache.grid.GridSubset;
import org.geowebcache.grid.GridSetFactory;
import org.geowebcache.grid.SRS;
import org.geotools.coverage.grid.io.GridCoverage2DReader;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geowebcache.grid.GridSubsetFactory;
import org.opengis.coverage.grid.GridEnvelope;

/**
 * A form component for a {@link Envelope} object.
 *
 * @author Justin Deoliveira, OpenGeo
 * @author Andrea Aime, OpenGeo
 */
public class CoveragePanel extends FormComponentPanel<TilesCoverage> {

    private static final long serialVersionUID = 1L;

    protected Label minZoomLabel, maxZoomLabel, minColumnLabel, maxColumnLabel, minRowLabel, maxRowLabel;

    protected Integer minZoom, maxZoom, minColumn, maxColumn, minRow, maxRow;

    protected DecimalTextField minZoomInput, maxZoomInput, minColumnInput, maxColumnInput, minRowInput, maxRowInput;


    public CoveragePanel(String id) {
        super(id);
        initComponents();
    }

    public CoveragePanel(String id, TilesCoverage c) {
        this(id, new Model<TilesCoverage>(c));
    }

    public CoveragePanel(String id, IModel<TilesCoverage> model) {
        super(id, model);
        initComponents();
    }

    void initComponents() {
        updateFields();

        add(minZoomLabel = new Label("minZoomL", new ResourceModel("minZoom")));
        add(maxZoomLabel = new Label("maxZoomL", new ResourceModel("maxZoom")));
        add(minColumnLabel = new Label("minColumnL", new ResourceModel("minColumn")));
        add(maxColumnLabel = new Label("maxColumnL", new ResourceModel("maxColumn")));
        add(minRowLabel = new Label("minRowL", new ResourceModel("minRow")));
        add(maxRowLabel = new Label("maxRowL", new ResourceModel("maxRow")));

        add(minZoomInput = new DecimalTextField("minZoom", new PropertyModel<>(this, "minZoom")));
        add(maxZoomInput = new DecimalTextField("maxZoom", new PropertyModel<>(this, "maxZoom")));
        add(minColumnInput = new DecimalTextField("minColumn", new PropertyModel<>(this, "minColumn")));
        add(maxColumnInput = new DecimalTextField("maxColumn", new PropertyModel<>(this, "maxColumn")));
        add(minRowInput = new DecimalTextField("minRow", new PropertyModel<>(this, "minRow")));
        add(maxRowInput = new DecimalTextField("maxRow", new PropertyModel<>(this, "maxRow")));

        // Hide the rows and columns until we have a solution to compute them.
        minColumnLabel.setVisible(false);
        maxColumnLabel.setVisible(false);
        minRowLabel.setVisible(false);
        maxRowLabel.setVisible(false);
        minColumnInput.setVisible(false);
        maxColumnInput.setVisible(false);
        minRowInput.setVisible(false);
        maxRowInput.setVisible(false);

    }

    @Override
    protected void onBeforeRender() {
        updateFields();
        super.onBeforeRender();
    }

    private void updateFields() {
        TilesCoverage c = (TilesCoverage) getModelObject();
        if (c != null) {
            this.minZoom = c.getMinZoom();
            this.maxZoom = c.getMaxZoom();
            this.minColumn = c.getMinColumn();
            this.maxColumn = c.getMaxColumn();
            this.minRow = c.getMinRow();
            this.maxRow = c.getMaxRow();
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public void convertInput() {
        visitChildren(TextField.class, (component, visit) -> {
            ((TextField<String>) component).processInput();
        });

        TilesCoverage c = new TilesCoverage();
        c.setMinZoom(minZoom);
        c.setMaxZoom(maxZoom);
        c.setMinColumn(minColumn);
        c.setMaxColumn(maxColumn);
        c.setMinRow(minRow);
        c.setMaxRow(maxRow);

        setConvertedInput(c);
    }

    @SuppressWarnings("unchecked")
    @Override
    protected void onModelChanged() {
        // when the client programmatically changed the model, update the fields
        // so that the textfields will change too
        updateFields();
        visitChildren(TextField.class, (Component component, IVisit<Object> visit) -> {
            ((TextField<String>) component).clearInput();
        });
    }

//    public void updateMinMaxZoom(LayerInfo layer) {
//        int[] minMax = findMinMaxZoom(layer);
//        TilesCoverage c = new TilesCoverage();
//        c.setMinZoom(minMax[0]);
//        c.setMaxZoom(minMax[1]);
//    }
    

    public int[] findMinMaxZoom(LayerInfo layer, Envelope e) {
        BoundingBox bbox = new BoundingBox(e.getMinX(), e.getMinY(), e.getMaxX(), e.getMaxY());
        GridSet gridSet = GridSetFactory.createGridSet("EPSG:4326", SRS.getEPSG4326(),
                BoundingBox.WORLD4326, false, GridSetFactory.DEFAULT_LEVELS, null,
                GridSetFactory.DEFAULT_PIXEL_SIZE_METER, 256, 256, true/*yCoordinateFirst*/);
        GridSubset gridSubset = GridSubsetFactory.createGridSubSet(gridSet, bbox, 0, 22);

        int minZ = findClosestZoom(gridSet, layer);
        int maxZ = findMaxZoomAuto(gridSubset, minZ, layer);
        if (maxZ < minZ) {
            throw new RuntimeException(String.format("maxZoom (%d) can not be less than minZoom (%d)",
                    maxZ, minZ));
        }
        if (maxZ > gridSet.getNumLevels()) {
            maxZ = gridSet.getNumLevels();
        }
        return new int[]{minZ, maxZ};
    }

    protected int findClosestZoom(GridSet gridSet, LayerInfo layer) {
        double reqScale = RendererUtilities.calculateOGCScale(
                layer.getResource().getLatLonBoundingBox(), gridSet.getTileWidth(), null);

        int i = 0;
        double error = Math.abs(gridSet.getGrid(i).getScaleDenominator() - reqScale);
        while (i < gridSet.getNumLevels() - 1) {
            Grid g = gridSet.getGrid(i + 1);
            double e = Math.abs(g.getScaleDenominator() - reqScale);

            if (e > error) {
                break;
            } else {
                error = e;
            }
            i++;
        }

        return Math.max(i, 0);
    }

    protected int findMaxZoomAuto(GridSubset gridSubset, Integer minZoom, LayerInfo layer) {

        // Get the maximum scale for the highest resolution layer:
        // loop through the layer coverages associated with the request
        // and compute the scale for each.
        double reqScaleDenominator = Double.MAX_VALUE;
        try {
            if (layer.getType() == PublishedType.RASTER) {
                // Get the width of the underlying coverage
                Catalog catalog = layer.getResource().getCatalog();
                CoverageInfo coverage = catalog.getCoverageByName(layer.prefixedName());
                //GridCoverage2DReader coverageReader = (GridCoverage2DReader) layer.getCoverageReader();
                GridCoverage2DReader coverageReader = (GridCoverage2DReader) coverage.getGridCoverageReader(null, GeoTools.getDefaultHints());
                GridEnvelope originalGridRange = coverageReader.getOriginalGridRange();
                int imageWidth = originalGridRange.getSpan(0); // 0=cols, 1=rows
                // Compute the scale demonimator 
                ReferencedEnvelope bounds = layer.getResource().getLatLonBoundingBox();
                double scale = RendererUtilities.calculateOGCScale(bounds, imageWidth, null);
                // Select the largest scale (the smallest denominator)
                reqScaleDenominator = Math.min(scale, reqScaleDenominator);
            }
        } catch (Exception e) {
//                LOGGER.warning(
//                        format("Exception caught computing the scale for layer %s: %s",
//                                layer.getName(), e.toString()));
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
        return findMaxZoomConstrained(gridSubset, minZoom, layer);
    }

    protected Integer findMaxZoomConstrained(GridSubset gridSubset, Integer minZoom, LayerInfo layer) {
        Envelope e = layer.getResource().getLatLonBoundingBox();
        BoundingBox bbox = new BoundingBox(e.getMinX(), e.getMinY(), e.getMaxX(), e.getMaxY());

        int zoom = minZoom;
        int ntiles = 0;

        while (ntiles < 256 && zoom < gridSubset.getGridSet().getNumLevels()) {
            long[] intersect = gridSubset.getCoverageIntersection(zoom, bbox);
            ntiles += (intersect[2] - intersect[0] + 1) * (intersect[3] - intersect[1] + 1);
            zoom++;
        }
        return zoom;
    }
}
