/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define */

/**
 * The USGS Imagery Topo Base Map layer.
 * 
 * See: https://basemap.nationalmap.gov/arcgis/services/USGSImageryTopo/MapServer/WMSServer?request=GetCapabilities&service=WMS
 * 
 * @returns {UsgsImageryTopoBaseMapLayer}
 */

define([
    'model/Explorer',
    'worldwind'],
    function (
        wmt,
        ww) {
        "use strict";

        /**
         * Constructs a USGS Imagery Topo map layer.
         * @constructor
         * @augments WmsLayer
         */
        var UsgsImageryTopoBaseMapLayer = function () {
            var cfg = {
                title: "USGS Imagery Topo Basemap",
                version: "1.3.0",
                service: "https://basemap.nationalmap.gov/arcgis/services/USGSImageryTopo/MapServer/WmsServer?",
                layerNames: "0",
                sector: new WorldWind.Sector(-90.0, 90.0, -180, 180),
                levelZeroDelta: new WorldWind.Location(36, 36),
                numLevels: 12,
                format: "image/png",
                size: 512,
                coordinateSystem: "EPSG:4326", // optional
                styleNames: "" // (optional): {String} A comma separated list of the styles to include in this layer.</li>
            };

            WorldWind.WmsLayer.call(this, cfg);

            // Make this layer opaque
            this.opacity = 1.0;

            // Requesting tiles with transparency (the nominal case) causes the layer's labels to bleed 
            // the underlying background layer which makes for a rather ugly map.
            this.urlBuilder.transparent = false;
        };

        UsgsImageryTopoBaseMapLayer.prototype = Object.create(WorldWind.WmsLayer.prototype);

        return UsgsImageryTopoBaseMapLayer;
    }
);