/*
 * Copyright (C) 2017 NASA WorldWind
 */

package gov.nasa.worldwind.gs.wms;

import com.vividsolutions.jts.geom.Envelope;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.geoserver.ows.Dispatcher;
import org.geoserver.ows.KvpRequestReader;
import org.geoserver.wms.*;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.map.Layer;
import org.geotools.referencing.CRS;
import org.geotools.renderer.lite.RendererUtilities;
import org.geotools.styling.FeatureTypeStyle;
import org.geotools.styling.Rule;
import org.geotools.styling.Style;
import org.geotools.util.logging.Logging;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.operation.TransformException;

/**
 * This GetMapCallback is responsible for simplifying a complex a map request.
 */
public class DelegatingGetMapCallback implements GetMapCallback {

    static final Logger logger = Logging.getLogger("org.geoserver.wms");

    private final Map<String, String> proxyToDelegateLayerMap;
    private final Map<String, GetMapRequest> proxyToCachedRequestMap;
    public DelegatingGetMapCallback(Map<String, String> proxyToDelegateLayerMap) {
        // TODO test for null params and throw exeception
        this.proxyToDelegateLayerMap = proxyToDelegateLayerMap;
        this.proxyToCachedRequestMap = new HashMap<>();
    }

    /**
     * Marks the beginning of a GetMap request internal processing
     *
     * @param request Request to be examined and modified
     * @return Modified request
     */
    @Override
    public GetMapRequest initRequest(GetMapRequest request) {
        logger.log(Level.INFO, " ** GetMapCallback.initRequest: {0}", request.toString());

        //
        // Caching logic
        //

        // Examine request KVP for the callback's layer name
        Map<String, String> rawKvp = request.getRawKvp();
        if (rawKvp == null) {
            logger.warning("Request KVP was null");
            return request;
        }

        // Get the layer parameter as specified by the client in the GetMap request
        final String originalRequestedLayerName = rawKvp.get("LAYERS");

        // Check to the see if the name matches this callback's layerName property
        if (originalRequestedLayerName == null || !this.proxyToDelegateLayerMap.containsKey(originalRequestedLayerName)) {
            logger.info("Layer name either null or was not an included proxy layer. Done with this request");
            return request;
        }

        // Grab the name of the delegate layer
        logger.log(Level.INFO, "{0} is a proxy layer, will try to redirect request", originalRequestedLayerName);
        final String delegateLayerName = this.proxyToDelegateLayerMap.get(originalRequestedLayerName);
        if (delegateLayerName == null) {
            logger.log(Level.INFO, "No delegate layer registered for proxy layer {0}", originalRequestedLayerName);
            return request;
        }

        logger.log(Level.INFO, "{0}->{1}", new Object[]{originalRequestedLayerName, delegateLayerName});
        // Change the "LAYERS" key/value pair and resubmit to the reader
        rawKvp.put("LAYERS", delegateLayerName);
        // Check if there is a cached request for this layer

        // TODO Fix race condition that would effect first batch of request, use readwrite lock

        GetMapRequest cachedRequest = this.proxyToCachedRequestMap.get(originalRequestedLayerName);
        if (cachedRequest == null) {
            logger.log(Level.INFO, "Layer not cached. Creating request for {0}", delegateLayerName);
            KvpRequestReader kvpReader = Dispatcher.findKvpRequestReader(request.getClass());
            try {
                cachedRequest = (GetMapRequest) kvpReader.createRequest();
                kvpReader.read(cachedRequest, rawKvp, rawKvp);
                this.proxyToCachedRequestMap.put(originalRequestedLayerName, cachedRequest);
            } catch (Exception ex) {
                logger.log(Level.SEVERE,"Could not create new request, meaning we cannot procede with culling logic", ex);
                cachedRequest = null;
                // reset request parameter
                rawKvp.put("LAYERS", originalRequestedLayerName);
                return request;
            }
        } else {
            logger.info("Layer already cached, continuing");
        }


        if (cachedRequest != null) {
            request.setLayers(cachedRequest.getLayers());
            request.setStyles(cachedRequest.getStyles());
        } else {
            logger.warning("cachedRequest should not be null here, we can't continue");
            // reset request parameter
            rawKvp.put("LAYERS", originalRequestedLayerName);
            return request;
        }

        //
        // Culling logic
        //
        List<MapLayerInfo> layers = request.getLayers();
        List<Style> styles = request.getStyles();
        List<MapLayerInfo> filteredLayers = new ArrayList<>();
        List<Style> filteredStyles = new ArrayList<>();
        ReferencedEnvelope requestBounds;
        double requestMapScaleDenominator;

        logger.info("Starting Culling Logic");
        try {
            final String srs4326 = WMS.toInternalSRS("EPSG:4326", WMS.version(request.getVersion()));
            CoordinateReferenceSystem crs4326 = CRS.decode("EPSG:4326");

            CoordinateReferenceSystem crs = request.getCrs();
            Envelope bbox = request.getBbox();
            if (request.getSRS().equals(srs4326)) {
                if (request.getVersion().equals("1.3.0")) {
                    // NOTE: In WMS 1.3.0, the specification of "EPSG:4326" has the axis swapped
                    requestBounds = new ReferencedEnvelope(bbox.getMinY(), bbox.getMaxY(), bbox.getMinX(), bbox.getMaxX(), crs4326);
                } else {
                    requestBounds = new ReferencedEnvelope(bbox, crs4326);
                }
            } else {
                // Transform to EPSG:4326
                requestBounds = new ReferencedEnvelope(bbox, crs).transform(crs4326, true);
            }
            // Compute the map scale to be used in rules
            requestMapScaleDenominator = RendererUtilities.calculateScale(requestBounds,
                    request.getWidth(), request.getHeight(), null);

        } catch (FactoryException | TransformException ex) {
            Logger.getLogger(DelegatingGetMapCallback.class.getName()).log(Level.SEVERE, null, ex);
            return request;
        }

        logger.log(Level.INFO, "------------- Layers size: {0}", layers.size());

        logger.info("------- Layers within bounds and scale extents:");
        for (int i = 0; i < layers.size(); i++) {
            MapLayerInfo currentLayer = layers.get(i);
            try {
                // Only include layers that intersect the request bounds
                if (currentLayer.getLatLongBoundingBox().intersects((Envelope) requestBounds)) {

                    // Only include layers are not excluded by a min/max scale rule
                    boolean excluded = false;
                    Style currentStyle = styles.get(i);

                    for (FeatureTypeStyle featureTypeStyle : currentStyle.featureTypeStyles()) {
                        for (Rule rule : featureTypeStyle.rules()) {
                            // If not defined in a rule, the getMinScaleDenominator defaults to zero
                            // and the getMaxScaleDenominator defaults to max double
                            if (rule.getMaxScaleDenominator() <= requestMapScaleDenominator
                                    || rule.getMinScaleDenominator() > requestMapScaleDenominator) {
                                excluded = true;
                                break;
                            }
                        }
                    }
                    if (!excluded) {
                        logger.log(Level.INFO, "******** {0}", currentLayer.getName());
                        filteredLayers.add(currentLayer);
                        filteredStyles.add(currentStyle);
                    }
                }

            } catch (IOException ex) {
                logger.log(Level.SEVERE, null, ex);
            }
        }

        // Clear hidden layers from the list (assumes a sorted layer list)
        // Starting from the highest resolution, traverse the list until
        // we have a layer that occludes all others before it.
        for (int i = filteredLayers.size() - 1; i > -1; i--) {
            MapLayerInfo layer = filteredLayers.get(i);
            try {
                // If a layer is completely completely covers the request bounds,
                // remove the layers before it except n layers immediately preceeding it.
                if (layer.getLatLongBoundingBox().covers(requestBounds)) {
                    int n = 1; // num preceeding layers to keep
                    int last = Math.max(0, i - n);
                    // This does actually clear the elements from the list
                    // Operations on a sublist effect the original list
                    filteredLayers.subList(0, last).clear();
                    filteredStyles.subList(0, last).clear();
                    break;
                }

            } catch (IOException ex) {
                System.out.println(ex.getMessage());
                logger.log(Level.SEVERE, null, ex);
            }
        }
        // Replace the request layers with the filtered layers and corresponding styles
        if (filteredLayers.size() > 0) {
            logger.log(Level.INFO, "============= filteredLayers size: {0}", filteredLayers.size());
            request.setLayers(filteredLayers);
            request.setStyles(filteredStyles);
        }

        logger.info("Finished Culling logic");
        return request;
    }

    /**
     * Called when the WMSMapContent is created (at this point the WMSMapContent
     * is empty) On multidimensional requests against multi-frame output formats
     * (e.g. animated GIF) this method can be called multiple times, once per
     * generated frame
     *
     * @param content
     */
    @Override
    public void initMapContent(WMSMapContent content) {
        // nothing to do
        // TODO: can store info in meta data if needed
        // e.g.: content.getMetadata().put(... , ...)
        logger.log(Level.FINE, " ** GetMapCallback.initMapContent: {0}", content.toString());
    }

    /**
     * Called before a layer gets added to the map content, allows the layer to
     * be modified. If the returned value is null the layer will not be added to
     * the map content
     *
     * @param content
     * @param layer
     * @return
     */
    @Override
    public Layer beforeLayer(WMSMapContent content, Layer layer) {
        logger.log(Level.INFO, " ** GetMapCallback.beforeLayer: {0},{1}", new Object[]{layer.getTitle(), layer.getStyle().getName()});
        return layer;
    }

    /**
     * Inspects and eventually manipulates the WMSMapContent, returning a
     * WMSMapContent that will be used for map rendering. In case of multi-frame
     * output formats this method will be called once per frame.
     *
     * @param mapContent
     * @return
     */
    @Override
    public WMSMapContent beforeRender(WMSMapContent mapContent) {
        logger.log(Level.FINE, " ** GetMapCallback.beforeRender: {0}", mapContent.toString());
        return mapContent;
    }

    /**
     * Called once when the rendering is completed, allows the output WebMap to
     * be inspected, modified or replaced altogether
     *
     * @param map
     * @return
     */
    @Override
    public WebMap finished(WebMap map) {
        logger.log(Level.FINE, " ** GetMapCallback.finished: {0}", map.toString());
        return map;
    }

    /**
     * Called if the GetMap fails for any reason.
     *
     * @param t
     */
    @Override
    public void failed(Throwable t) {
        logger.log(Level.FINE, " ** GetMapCallback.failed! {0}", t.toString());
        // nothing to do
    }

}