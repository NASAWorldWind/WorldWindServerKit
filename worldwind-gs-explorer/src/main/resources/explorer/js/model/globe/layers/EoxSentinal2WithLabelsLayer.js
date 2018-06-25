/* 
 * Copyright (c) 2018 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * Sentinel-2 cloudless - https://s2maps.eu by EOX IT Services GmbH (Contains 
 * modified Copernicus Sentinel data 2016 & 2017)
 * 
 * See: http://maps.eox.at/
 * See: https://tiles.maps.eox.at/wms?service=WMS&request=GetCapabilities
 * 
 * @returns {EoxSentinal2WithLabelsLayer}
 */
define([
    'model/globe/layers/EnhancedWmsLayer',
    'worldwind'],
    function (EnhancedWmsLayer) {
        "use strict";
        /**
         * Constructs an imagery layer from Copernicus Sentinel data with overlay from OpenSteetMap.
         * @constructor
         * @augments WmsLayer
         */
        var EoxSentinal2WithLabelsLayer = function () {
            var cfg = {
                title: "Sentinel-2 cloudless with labels by EOX",
                version: "1.3.0",
                service: "https://tiles.maps.eox.at/wms",
                layerNames: "s2cloudless,overlay",
                sector: new WorldWind.Sector(-90.0, 90.0, -180, 180),
                levelZeroDelta: new WorldWind.Location(180, 180),
                numLevels: 16,
                format: "image/png",
                size: 256,
                coordinateSystem: "EPSG:4326", // optional
                styleNames: "" // (optional): {String} A comma separated list of the styles to include in this layer.</li>
            };

            EnhancedWmsLayer.call(this, cfg);

            // Make this layer opaque
            this.opacity = 1.0;

            this.urlBuilder.transparent = false;
        };

        EoxSentinal2WithLabelsLayer.prototype = Object.create(EnhancedWmsLayer.prototype);

        EoxSentinal2WithLabelsLayer.prototype.doRender = function (dc) {
            WorldWind.WmsLayer.prototype.doRender.call(this, dc);
            if (this.inCurrentFrame) {
                dc.screenCreditController.addStringCredit("OpenStreetMap and Sentinel-2 cloudless by EOX IT Services GmbH", WorldWind.Color.LIGHT_GRAY);
            }
        };

        return EoxSentinal2WithLabelsLayer;
    }
);