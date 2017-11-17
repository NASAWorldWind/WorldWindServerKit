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
package gov.nasa.worldwind.gs.wms;

import com.vividsolutions.jts.geom.Envelope;
import java.awt.Color;
import java.awt.geom.Point2D;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.geoserver.ows.Dispatcher;
import org.geoserver.ows.KvpRequestReader;
import org.geoserver.wms.GetMapCallback;
import org.geoserver.wms.GetMapRequest;
import org.geoserver.wms.MapLayerInfo;
import org.geoserver.wms.WMS;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.WebMap;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.geometry.jts.ReferencedEnvelope;
import org.geotools.map.Layer;
import org.geotools.referencing.CRS;
import org.geotools.renderer.lite.RendererUtilities;
import org.geotools.styling.FeatureTypeStyle;
import org.geotools.styling.Rule;
import org.geotools.styling.Style;
import org.opengis.coverage.grid.Format;
import org.opengis.parameter.ParameterValueGroup;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.operation.TransformException;

/**
 * This GetMapCallback is responsible for simplifying a map request by caching
 * the layer list and styles from a complex layer group defined by the
 * delegateLayerName. GetMap requests are made using the registered layer name,
 * but the delegate is actually used for the rendering.
 *
 * The use of the cached request avoids the setup/teardown of a complex
 * collection of layers for each request in a tiled map system.
 *
 * @author Bruce Schubert
 */
public class DelegatingGetMapCallback implements GetMapCallback {

    static final Logger logger = org.geotools.util.logging.Logging.getLogger("org.geoserver.wms");

    private final String layerName;
    private final String delegateLayerName;

    private GetMapRequest cachedRequest = null;

    /**
     * This constructor should be registered as a spring bean in
     * applicationContext.xml.
     *
     * @param layerName The layer name used in GetMap requests
     * @param delegateLayerName The name of the layer that will implement the
     * GetMap request
     */
    public DelegatingGetMapCallback(String layerName, String delegateLayerName) {
        if (layerName == null || layerName.isEmpty()) {
            throw new IllegalArgumentException(
                    this.getClass().getSimpleName() + " layerName cannot be null or empty");
        }
        if (delegateLayerName == null || delegateLayerName.isEmpty()) {
            throw new IllegalArgumentException(
                    this.getClass().getSimpleName() + " delegateLayerName cannot be null or empty");
        }
        this.layerName = layerName;
        this.delegateLayerName = delegateLayerName;
    }

    /**
     * Marks the beginning of a GetMap request internal processing
     *
     * @param request Request to be examined and modified
     * @return Modified request
     */
    @Override
    public GetMapRequest initRequest(GetMapRequest request) {
        System.out.println(" ** GetMapCallback.initRequest: " + request.toString());

        // Get the key/value map of the GetMap request's params
        Map<String, String> rawKvp = request.getRawKvp();

        // Not all requests have this, e.g., unit tests
        if (rawKvp == null) {
            return request;
        }

        // Get the layer parameter used in the GetMap request
        String layerParam = (String) rawKvp.get("LAYERS");

        // Check to the see if this callback should handle the request.
        // It should handle requests for the registered layer (to be delegated) 
        // as well as requests from GWC for metatiles( with delegate already assigned).
        // TODO: Is the layerParam case sensitive?  May need case-insensitive compare
        if (layerParam == null || (!layerParam.equals(layerName) && !layerParam.equals(delegateLayerName))) {
            return request;
        }

        //
        // Caching logic
        //
        
        // Altering the request by changing the "LAYERS" param to the delegate 
        rawKvp.put("LAYERS", delegateLayerName);

        // Build a cached request from the delegate. We're only interested
        // in the layers and styles
        if (cachedRequest == null) {
            createCachedRequest(rawKvp);
        }
        // Replace the layers in this request with the cached values from the delegate
        // leaving the other parameters untouched.
        if (cachedRequest != null) {
            request.setLayers(cachedRequest.getLayers());
            request.setStyles(cachedRequest.getStyles());
        }

        //
        // Culling logic
        //
        
        // Create a EPSG:4326 requestBounds that we can compare to 
        // each layer's latLongBoundingBox in the culling process.
        ReferencedEnvelope requestBounds = computeRequestBounds(request);

        // Compute the map scale to be used in style/rules culling process.
        double requestMapScaleDenominator = computeMapScaleDenominator(requestBounds, request);

        // Create a filtered collection of layers and styles
        ArrayList<MapLayerInfo> filteredLayers = new ArrayList<>();
        ArrayList<Style> filteredStyles = new ArrayList<>();
        
        // Sources for filtered collections
        List<MapLayerInfo> layers = request.getLayers();
        List<Style> styles = request.getStyles();

        System.out.println("------------- Layers size: " + layers.size());
        System.out.println("------- Layers within bounds and scale extents:");
        
        for (int i = 0; i < layers.size(); i++) {
            MapLayerInfo currentLayer = layers.get(i);
            try {
                // Only include layers that intersect the request's bounds
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
                        System.out.println("******** " + currentLayer.getName());
                        filteredLayers.add(currentLayer);
                        filteredStyles.add(currentStyle);
                        
//                        // HACK: start of an idea to force transparency
//                        Format format = currentLayer.getCoverageReader().getFormat();
//                        if (format instanceof AbstractGridFormat) {
//                            ParameterValueGroup readParameters = ((AbstractGridFormat) format).getReadParameters();
//                            ParameterValueGroup writeParameters = ((AbstractGridFormat) format).getWriteParameters();
//                        }
                    }
                }

            } catch (IOException ex) {
                System.out.println(ex.getMessage());
                Logger.getLogger(DelegatingGetMapCallback.class.getName()).log(Level.SEVERE, null, ex);
                return request;
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
                if (layer.getLatLongBoundingBox().covers((Envelope) requestBounds)) {
                    int n = 1; // num preceeding layers to keep
                    int last = Math.max(0, i - n);
                    filteredLayers.subList(0, last).clear();
                    filteredStyles.subList(0, last).clear();
                    break;
                }

            } catch (IOException ex) {
                System.out.println(ex.getMessage());
                Logger.getLogger(DelegatingGetMapCallback.class.getName()).log(Level.SEVERE, null, ex);
                return request;
            }
        }
        // Replace the request layers with the filtered layers and corresponding styles
        if (filteredLayers.size() > 0) {
            System.out.println("============= filteredLayers size: " + filteredLayers.size());
            request.setLayers(filteredLayers);
            request.setStyles(filteredStyles);
        }

        //
        // HACK: an idea to force the use of the integrated GWC
        //
        //request.setTiled(true);
        //request.setTilesOrigin(new Point2D.Double(-180,-90));
        
       
        return request;
    }

    private void createCachedRequest(Map<String, String> rawKvp) {
        // Use the default KvpRequestReader for GetMapRequests to traverse
        // the layer group's layers and build all the requisite data
        // e.g., layer info, styles, coverage readers, etc.        
        // The implementation class is probably a GetMapKvpRequestReader.
        KvpRequestReader kvpReader = Dispatcher.findKvpRequestReader(GetMapRequest.class);
        try {
            // Create a new request
            cachedRequest = (GetMapRequest) kvpReader.createRequest();

            // Reader takes a kvp map of String,Object and rawKvp map of String,String.
            // At this stage, we've lost the orginal kvp map, but upon examination of the
            // Dispatcher.preParseKVP() they "look" identical. Not sure what's going on there.
            // TODO: trace this code
            kvpReader.read(cachedRequest, rawKvp, rawKvp);
        } catch (Exception ex) {
            cachedRequest = null;
            
            String msg = this.getClass().getSimpleName() + " createCachedRequest failed.";
            logger.log(Level.SEVERE, msg, ex);
            throw new RuntimeException(msg, ex);
        }
    }

    private ReferencedEnvelope computeRequestBounds(GetMapRequest request) {
        try {
            ReferencedEnvelope requestBounds;

            // Define the request bounds' SRS and CRS. The SRS is used for
            // comparisons and uses the same encoding used by the KVP Reader.
            String targetSrs = WMS.toInternalSRS("EPSG:4326", WMS.version(request.getVersion()));
            CoordinateReferenceSystem targetCrs = CRS.decode("EPSG:4326");

            // Transform the request's bbox to a ReferencedEnvelope
            Envelope bbox = request.getBbox();
            if (request.getSRS().equals(targetSrs)) {
                if (request.getVersion().equals("1.3.0")) {
                    // NOTE: In WMS 1.3.0, the specification of "EPSG:4326" has the axis swapped                     
                    requestBounds = new ReferencedEnvelope(bbox.getMinY(), bbox.getMaxY(), bbox.getMinX(), bbox.getMaxX(), targetCrs);
                } else {
                    requestBounds = new ReferencedEnvelope(bbox, targetCrs);
                }
            } else {
                // Transform to EPSG:4326
                CoordinateReferenceSystem crs = request.getCrs();
                requestBounds = new ReferencedEnvelope(bbox, crs).transform(targetCrs, true);
            }
            return requestBounds;

        } catch (FactoryException | TransformException ex) {
            String msg = this.getClass().getSimpleName() + " computeRequestBounds failed.";
            logger.log(Level.SEVERE, msg, ex);
            throw new RuntimeException(msg, ex);
        }
    }

    private double computeMapScaleDenominator(ReferencedEnvelope requestBounds, GetMapRequest request) {
        try {
            return RendererUtilities.calculateScale(
                    requestBounds,
                    request.getWidth(),
                    request.getHeight(),
                    null);
        } catch (TransformException | FactoryException ex) {
            String msg = this.getClass().getSimpleName() + " computeMapScaleDenominator failed.";
            logger.log(Level.SEVERE, msg, ex);
            throw new RuntimeException(msg, ex);
        }
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
        logger.log(Level.FINE, "{0} initMapContent called", this.getClass().getSimpleName());
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
                
        logger.log(Level.FINE, "{0} beforeLayer added {1},{2}", 
                new Object[]{this.getClass().getSimpleName(), layer.getTitle(), layer.getStyle().getName()});
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
        logger.log(Level.FINE, "{0} beforeRendered called", this.getClass().getSimpleName());
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
        logger.log(Level.FINE, "{0} finished called", this.getClass().getSimpleName());
        return map;
    }

    /**
     * Called if the GetMap fails for any reason.
     *
     * @param t
     */
    @Override
    public void failed(Throwable t) {
        logger.log(Level.WARNING, "{0} failed!", this.getClass().getSimpleName());
        // nothing to do
    }

}
