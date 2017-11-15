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
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.geoserver.ows.Dispatcher;
import org.geoserver.ows.KvpRequestReader;
import org.geoserver.wms.GetMapCallback;
import org.geoserver.wms.GetMapCallbackAdapter;
import org.geoserver.wms.GetMapRequest;
import org.geoserver.wms.MapLayerInfo;
import org.geoserver.wms.WMSMapContent;
import org.geoserver.wms.WebMap;
import org.geotools.map.Layer;
import org.geotools.styling.Style;

/**
 * This GetMapCallback is responsible for dynamically building a map request.
 *
 * @author Bruce Schubert
 */
public class ProxyGetMapCallback implements GetMapCallback {

    private final String proxyLayerName;
    private final String delegateLayerName;

    private GetMapRequest cachedRequest = null;

    public ProxyGetMapCallback(String proxyLayerName, String delegateLayerName) {
        // TODO test for null params and throw exeception
        this.proxyLayerName = proxyLayerName;
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

        // Examine request KVP for the proxy layer name
        Map<String, String> rawKvp = request.getRawKvp();
        String layerParam = (String) rawKvp.get("LAYERS");

        if (layerParam.equals(proxyLayerName)) {
            // Change the "LAYERS" key/value pair and resubmit to the reader
            rawKvp.put("LAYERS", delegateLayerName);
            if (cachedRequest == null) {
                KvpRequestReader kvpReader = Dispatcher.findKvpRequestReader(request.getClass());
                try {
                    cachedRequest = (GetMapRequest) kvpReader.createRequest();
                    kvpReader.read(cachedRequest, rawKvp, rawKvp);
                } catch (Exception ex) {
                    Logger.getLogger(ProxyGetMapCallback.class.getName()).log(Level.SEVERE, null, ex);
                    cachedRequest = null;
                }
            }
            if (cachedRequest != null) {
                request.setLayers(cachedRequest.getLayers());
                request.setStyles(cachedRequest.getStyles());
            }
        }
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
        System.out.println(" ** GetMapCallback.initMapContent: " + content.toString());
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
        System.out.println(" ** GetMapCallback.beforeLayer: " + layer.getTitle() + "," + layer.getStyle().getName());
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
        System.out.println(" ** GetMapCallback.beforeRender: " + mapContent.toString());
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
        System.out.println(" ** GetMapCallback.finished: " + map.toString());
        return map;
    }

    /**
     * Called if the GetMap fails for any reason.
     *
     * @param t
     */
    @Override
    public void failed(Throwable t) {
        System.out.println(" ** GetMapCallback.failed! " + t.toString());
        // nothing to do
    }

}
