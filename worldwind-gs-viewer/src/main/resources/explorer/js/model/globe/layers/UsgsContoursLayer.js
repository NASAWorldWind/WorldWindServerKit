/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define */

/**
 * The USGS Contours layer.
 * 
 * See: https://services.nationalmap.gov/arcgis/services/Contours/MapServer/WMSServer?request=GetCapabilities&service=WMS
 * 
 * @returns {UsgsContoursLayer}
 */

define([
    'model/Explorer',
    'worldwind'],
    function (
        wmt,
        ww) {
        "use strict";

        /**
         * Constructs a USGS Contours map layer.
         * @constructor
         * @augments WmsLayer
         */
        var UsgsContoursLayer = function () {
            var cfg = {
                title: "USGS Contour Lines",
                version: "1.3.0",
                service: "https://services.nationalmap.gov/arcgis/services/Contours/MapServer/WMSServer?",
                layerNames: "1,2,4,5,7,8", // lines and labels: large scale, 50' and 100' respectively
                sector: new WorldWind.Sector(18.915561901, 64.8750000000001, -160.544024274, -66.9502505149999),
                levelZeroDelta: new WorldWind.Location(36, 36),
                numLevels: 19,
                format: "image/png",
                size: 512,
                coordinateSystem: "EPSG:4326", // optional
                styleNames: "" // (optional): {String} A comma separated list of the styles to include in this layer.</li>
            };

            WorldWind.WmsLayer.call(this, cfg);

            this.urlBuilder.transparent = true;
        };

        UsgsContoursLayer.prototype = Object.create(WorldWind.WmsLayer.prototype);

        return UsgsContoursLayer;
    }
);