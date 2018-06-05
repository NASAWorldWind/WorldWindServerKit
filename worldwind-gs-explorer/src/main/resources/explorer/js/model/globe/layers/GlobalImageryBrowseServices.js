/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * The GlobalImageryBrowseServices (GIBS) products. 
 * 
 * @returns {GlobalImageryBrowseServices}
 */

define(['worldwind'], function () {
    "use strict";

    /**
     * Constructs a GlobalImageryBrowseServices product (layer) collection.
     * @constructor
     * @augments WmtsLayer
     */
    var GlobalImageryBrowseServices = function (globe) {

        this.layers = {};

        var request = new XMLHttpRequest(),
                url = 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/WMTSCapabilities.xml',
                wmtsCaps,
                layerCaps,
                i, max, layer,
                self = this;


        request.open("GET", url, true);
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var xmlDom = request.responseXML;

                if (!xmlDom && request.responseText.indexOf("<?xml") === 0) {
                    xmlDom = new window.DOMParser().parseFromString(request.responseText, "text/xml");
                }

                if (!xmlDom) {
                    alert(url + " retrieval failed.");
                    return;
                }

                wmtsCaps = new WorldWind.WmtsCapabilities(xmlDom);
                for (i = 0, max = wmtsCaps.contents.layer.length; i < max; i++) {
                    if (wmtsCaps.contents.layer[i].identifier === 'VIIRS_CityLights_2012') {
                        layerCaps = wmtsCaps.contents.layer[i];
                        layer = new WorldWind.WmtsLayer(layerCaps, null, null);
                        self.layers[layerCaps.title] = layer;

                        globe.layerManager.addBaseLayer(layer);

                        break;
                    }
                }

            } else if (request.readyState === 4) {
                if (request.statusText) {
                    alert(request.responseURL + " " + request.status + " (" + request.statusText + ")");
                } else {
                    alert("Failed to retrieve WMS capabilities from " + url + ".");
                }
            }
        };
        request.send(null);
    };

    return GlobalImageryBrowseServices;
}
);