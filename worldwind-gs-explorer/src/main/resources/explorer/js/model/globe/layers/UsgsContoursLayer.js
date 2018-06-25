/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * The USGS Contours layer.
 * 
 * See: https://services.nationalmap.gov/arcgis/services/Contours/MapServer/WMSServer?request=GetCapabilities&service=WMS
 * 
 * @returns {UsgsContoursLayer}
 */

define([
    'model/globe/layers/EnhancedWmsLayer',
    'worldwind'],
    function (EnhancedWmsLayer) {
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
                levelZeroDelta: new WorldWind.Location(180, 180),
                numLevels: 19,
                format: "image/png",
                size: 256,
                coordinateSystem: "EPSG:4326", // optional
                styleNames: "" // (optional): {String} A comma separated list of the styles to include in this layer.</li>
            };

            EnhancedWmsLayer.call(this, cfg);

            this.urlBuilder.transparent = true;
        };

        UsgsContoursLayer.prototype = Object.create(EnhancedWmsLayer.prototype);

        return UsgsContoursLayer;
    }
);