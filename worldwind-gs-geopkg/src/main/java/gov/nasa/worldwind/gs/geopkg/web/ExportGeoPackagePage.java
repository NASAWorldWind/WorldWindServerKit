/*
 * Copyright (C) 2017 NASA World Wind
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */
package gov.nasa.worldwind.gs.geopkg.web;

import org.geotools.geopkg.wps.GeoPackageProcessRequestTransformer;
import com.vividsolutions.jts.geom.Envelope;
import org.geotools.geopkg.wps.GeoPackageProcessRequest;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import javax.xml.transform.TransformerException;
import org.apache.wicket.Page;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.ajax.form.OnChangeAjaxBehavior;
import org.apache.wicket.ajax.markup.html.form.AjaxSubmitLink;
import org.apache.wicket.extensions.ajax.markup.html.modal.ModalWindow;
import org.apache.wicket.markup.html.form.CheckBox;
import org.apache.wicket.markup.html.form.ChoiceRenderer;
import org.apache.wicket.markup.html.form.DropDownChoice;
import org.apache.wicket.markup.html.form.Form;
import org.apache.wicket.markup.html.form.TextField;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.LoadableDetachableModel;
import org.apache.wicket.model.Model;
import org.apache.wicket.model.PropertyModel;
import org.geoserver.catalog.Catalog;

import org.geoserver.catalog.LayerInfo;
import org.geoserver.ows.URLMangler;
import org.geoserver.ows.util.ResponseUtils;
import org.geoserver.web.GeoServerSecuredPage;

import com.google.common.collect.Lists;
import org.geotools.geopkg.wps.GeoPackageProcessRequest.TilesLayer.TilesCoverage;
import java.util.Arrays;
import java.util.Comparator;
import javax.xml.namespace.QName;
import org.apache.wicket.markup.html.form.FormComponent;
import org.geoserver.web.wicket.ColorPickerField;

/**
 *
 * @author Bruce Schubert
 */
public class ExportGeoPackagePage extends GeoServerSecuredPage {

    //choices in dropdown box
    private static final List<String> FORMATS = Arrays.asList(new String[]{
        "image/vnd.jpeg-png", "image/jpeg", "image/png"});

    // The default model object for this page
    private GeoPackageProcessRequest processRequest;
    private GeoPackageProcessRequest.TilesLayer tilesLayer;

    DropDownChoice<LayerInfo> layerChoice;
    TextField<String> styles;
    TextField<String> tilesetName;
    TextField<String> filename;
    final BBoxPanel latLonPanel;
    final CoveragePanel coveragePanel;

    /**
     * Default constructor
     */
    public ExportGeoPackagePage() {
        // Create the GeoPackageProcessRequest
        createDefaultModel();

        // Create the form
        Form form = new Form("form");
        add(form);

        layerChoice = initLayersDropDown("layer", form);

        styles = new TextField<>("styles", new Model("raster")); // HACH until a style selection is implemented
        form.add(styles);

        // Setup the tileset tilesetName field so that it can be updated by the layer choice
        tilesetName = new TextField<>("name", new PropertyModel(tilesLayer, "name"));
        tilesetName.setRequired(true);
        tilesetName.setOutputMarkupId(true);
        form.add(tilesetName);

        // Setup the geopackage filename field so that it can be updated by the layer choice
        filename = new TextField<>("filename", new PropertyModel(processRequest, "name"));
        filename.setRequired(true);
        filename.setOutputMarkupId(true);
        form.add(filename);

        form.add(new TextField<>("identifier", new PropertyModel<>(tilesLayer, "identifier")));
        form.add(new TextField<>("desc", new PropertyModel<>(tilesLayer, "description")));

        DropDownChoice<String> formats = new DropDownChoice<String>("mimeType", 
                new PropertyModel<>(tilesLayer, "format"), FORMATS);
        form.add(formats);
        
//        form.add(new ColorPickerField("bkgdColor", new PropertyModel<>(tilesLayer, "bgColor")));
        TextField<Object> color = new TextField<>("bkgdColor", new PropertyModel<>(tilesLayer, "bgColor"));
        color.setEnabled(false);  // Problematic -- disabled until solved.
        form.add(color);
        
        form.add(new CheckBox("transparent", new PropertyModel<>(tilesLayer, "transparent")));

        // lat/lon bbox
        latLonPanel = new BBoxPanel("latLonBoundingBox", tilesLayer.getBbox());
        latLonPanel.setOutputMarkupId(true);
        latLonPanel.setRequired(true);
        form.add(latLonPanel);

        coveragePanel = new CoveragePanel("tilesCoverage", tilesLayer.getCoverage());
        coveragePanel.setOutputMarkupId(true);
//        coveragePanel.setRequired(true);
        form.add(coveragePanel);

        initLatLonBoundsLink("computeLatLon", form, layerChoice, latLonPanel);

        ModalWindow responseWindow = initResponseWindow("responseWindow");
        add(responseWindow);

        ModalWindow xmlWindow = initXmlWindow("xmlWindow", responseWindow);
        add(xmlWindow);

        initExecuteButton("executeProcess", form, responseWindow);

        initXmlButton("executeXML", form, xmlWindow);

    }

    private void createDefaultModel() {
        // Create the tiles component and initialize the default values
        tilesLayer = new GeoPackageProcessRequest.TilesLayer();
        tilesLayer.setStyles(Arrays.asList("raster"));
        try {
            tilesLayer.setSrs(new URI("EPSG:4326"));
        } catch (URISyntaxException ex) {
            Logger.getLogger(ExportGeoPackagePage.class.getName()).log(Level.SEVERE, null, ex);
        }
        tilesLayer.setBbox(new Envelope());
        tilesLayer.setCoverage(new TilesCoverage());
//        tilesLayer.setStyles(Arrays.asList("raster"));

        // Create the process request and initialize
        processRequest = new GeoPackageProcessRequest();
        processRequest.addLayer(tilesLayer);

        setDefaultModel(new Model(processRequest));
    }

    private DropDownChoice<LayerInfo> initLayersDropDown(final String id, Form form) {
        // Create model with a collection of layers
        IModel<List<LayerInfo>> layerChoices = new LoadableDetachableModel<List<LayerInfo>>() {
            private static final long serialVersionUID = 1L;

            @Override
            protected List<LayerInfo> load() {
                Catalog catalog = getCatalog();
                List<LayerInfo> layerList = catalog.getLayers();
                if (layerList == null) {
                    return Lists.newArrayList();
                }
//                Filter filter = Predicates.equal("layer.type", PublishedType.RASTER);
//                Integer limit = 100;
//                CloseableIterator<LayerInfo> iter = catalog.list(LayerInfo.class, filter, null, limit, null);
//                List<LayerInfo> resources = Lists.newArrayList(iter);

                // Sort layers by workspace and tilesetName
                Collections.sort(layerList, new Comparator<LayerInfo>() {
                    @Override
                    public int compare(LayerInfo o1, LayerInfo o2) {
                        String ws1 = o1.getResource().getStore().getWorkspace().getName();
                        String ws2 = o2.getResource().getStore().getWorkspace().getName();
                        int result = ws1.compareToIgnoreCase(ws2);
                        if (result == 0) {
                            return o1.getName().compareTo(o2.getName());
                        }
                        return result;
                    }
                });
                return layerList;

            }
        };

        // Create the DropDown with a renderer that the displays workspace and tilesetName
        DropDownChoice<LayerInfo> layerChoice = new DropDownChoice<>(
                id,
                new Model<>(),
                layerChoices,
                new LayerChoiceRenderer());

        layerChoice.setNullValid(false); // Shows "Choose One" when null
        layerChoice.setRequired(true);
        layerChoice.setOutputMarkupId(true);
        form.add(layerChoice);

        // Add a listener to update model elements dependent on the selected layer
        layerChoice.add(new OnChangeAjaxBehavior() {
            private static final long serialVersionUID = 1L;

            @Override
            protected void onUpdate(AjaxRequestTarget target) {
                Model<LayerInfo> layerModel = (Model<LayerInfo>) layerChoice.getDefaultModel();
                LayerInfo layer = layerModel.getObject();
                if (layer != null) {
                    tilesetName.setModelObject(layer.getName());
                    target.add(tilesetName);

//                    processRequest.setName(layer.getName());
//                    filename.setModel(new PropertyModel<>(processRequest, "name"));
                    filename.setModelObject(layer.getName());
                    target.add(filename);

                    latLonPanel.setModelObject(layer.getResource().getLatLonBoundingBox());
                    target.add(latLonPanel);

                    int[] minMax = coveragePanel.findMinMaxZoom(layer, layer.getResource().getLatLonBoundingBox());
                    TilesCoverage c = new TilesCoverage();
                    c.setMinZoom(minMax[0]);
                    c.setMaxZoom(minMax[1]);
                    coveragePanel.setModelObject(c);
                    target.add(coveragePanel);
                }
            }
        });

        return layerChoice;
    }

    private static class LayerChoiceRenderer extends ChoiceRenderer<LayerInfo> {

        private static final long serialVersionUID = 1L;

        @Override
        public Object getDisplayValue(LayerInfo layer) {
            String workspace = layer.getResource().getStore().getWorkspace().getName();
            return workspace + ":" + layer.getName();
        }

        @Override
        public String getIdValue(LayerInfo layer, int index) {
            return layer.getId();
        }
    }

    private AjaxSubmitLink initLatLonBoundsLink(final String id, final Form form,
            DropDownChoice<LayerInfo> layers, final BBoxPanel bboxPanel) {

        AjaxSubmitLink ajaxSubmitLink = new AjaxSubmitLink(id, form) {
            private static final long serialVersionUID = 1L;

            @Override
            public void onSubmit(final AjaxRequestTarget target, Form form) {
                // Perform manual processing otherwise the component contents won't be updated
                form.process(null);
                LayerInfo layer = (LayerInfo) layers.getDefaultModelObject();
                if (layer != null) {
                    bboxPanel.setModelObject(layer.getResource().getLatLonBoundingBox());
                }
                target.add(bboxPanel);

                if (layer != null) {
                    int[] minMax = coveragePanel.findMinMaxZoom(layer, layer.getResource().getLatLonBoundingBox());
                    TilesCoverage c = new TilesCoverage();
                    c.setMinZoom(minMax[0]);
                    c.setMaxZoom(minMax[1]);
                    coveragePanel.setModelObject(c);
                }
                target.add(coveragePanel);

            }

//            @Override
//            public boolean getDefaultFormProcessing() {
//                // Disable the default processing or the link won't trigger
//                // when any validation fails
//                return false;
//            }
        };
        form.add(ajaxSubmitLink);
        return ajaxSubmitLink;
    }

    /**
     * Sets up the output response popup window.
     */
    private ModalWindow initResponseWindow(final String id) {
        ModalWindow window = new ModalWindow(id);
        window.setPageCreator(new ModalWindow.PageCreator() {

            @SuppressWarnings("unchecked")
            public Page createPage() {
                ExecuteRequest request = new ExecuteRequest();
                HttpServletRequest http = (HttpServletRequest) ExportGeoPackagePage.this.getRequest().getContainerRequest();
                String url = ResponseUtils.buildURL(
                        ResponseUtils.baseURL(http),
                        "ows",
                        Collections.singletonMap("strict", "true"),
                        URLMangler.URLType.SERVICE);
                request.setRequestUrl(url);

                request.setRequestBody((String) window.getDefaultModelObject());
//                request.setUserName(builder.username);
//                request.setPassword(builder.password);
                return new ResponsePage(new Model(request));
            }
        });
        return window;
    }

    /**
     * Sets up the XML popup window.
     */
    private ModalWindow initXmlWindow(final String id, ModalWindow responseWindow) {
        final ModalWindow xmlWindow = new ModalWindow(id);
        xmlWindow.setPageCreator(new ModalWindow.PageCreator() {

            public Page createPage() {
                return new XmlPage(xmlWindow, responseWindow, getRequestXML());
            }
        });
        return xmlWindow;
    }

    private void initExecuteButton(String id, Form form, ModalWindow responseWindow) {
        // Setup the Execute button
        form.add(new AjaxSubmitLink(id) {

            @SuppressWarnings("unchecked")
            @Override
            protected void onSubmit(AjaxRequestTarget target, Form form) {
                responseWindow.setDefaultModel(new Model(getRequestXML()));
                responseWindow.show(target);
            }

            @Override
            protected void onError(AjaxRequestTarget target, Form form) {
                super.onError(target, form);
                target.add(getFeedbackPanel());
            }
        });
    }

    private void initXmlButton(String id, Form form, ModalWindow xmlWindow) {
        // Setup the Show XML button
        form.add(new AjaxSubmitLink(id) {

            @Override
            protected void onSubmit(AjaxRequestTarget target, Form form) {
                try {
                    getRequestXML();
                    xmlWindow.show(target);
                } catch (Exception e) {
                    error(e.getMessage());
                    target.add(getFeedbackPanel());
                }
            }

            @Override
            protected void onError(AjaxRequestTarget target, Form form) {
                target.add(getFeedbackPanel());
            }
        });
    }

    /**
     * Returns the WPS request XML based on the form's contents.
     *
     * @return WPS request XML
     */
    String getRequestXML() {
        // Update the request from the form before the transformation
        LayerInfo layer = layerChoice.getModelObject();
        Envelope bbox = latLonPanel.getModelObject();
        TilesCoverage coverage = coveragePanel.getModelObject();
        String stylesList = styles.getModelObject();
        if (stylesList != null) {
            List<String> list = Arrays.asList(stylesList.split(","));
            tilesLayer.setStyles(list);
        }
        tilesLayer.setLayers(Arrays.asList(new QName(layer.prefixedName())));
        tilesLayer.setBbox(bbox);
        tilesLayer.setCoverage(coverage);

        // Setup a transformer to translate the GeoPackageProcessRequest into XML
        GeoPackageProcessRequestTransformer transformer = new GeoPackageProcessRequestTransformer();
        transformer.setIndentation(2);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        // Perform the transform
        try {
            transformer.transform(processRequest, out);
        } catch (TransformerException e) {
            LOGGER.log(Level.SEVERE, "Error generating xml request", e);
            error(e);
        }
        return out.toString();
    }

}
