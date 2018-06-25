/* 
 * Copyright (c) 2018 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * An OpenStreetMap layer created from OpenData by EOX IT Services GmbH
 * 
 * See: http://maps.eox.at/
 * See: https://tiles.maps.eox.at/wms?service=WMS&request=GetCapabilities
 * 
 * @returns {EoxOpenStreetMapLayer}
 */
define([
    'model/globe/layers/EnhancedWmsLayer',
    'worldwind'],
    function (EnhancedWmsLayer) {
    "use strict";
    /**
     * Constructs a OpenStreetMap layer by EOX.
     * @constructor
     * @augments WmsLayer
     */
    var EoxOpenStreetMapLayer = function () {
        var cfg = {
            title: "OpenStreetMap by EOX",
            version: "1.3.0",
            service: "https://tiles.maps.eox.at/wms",
            layerNames: "osm",
            sector: new WorldWind.Sector(-90.0, 90.0, -180, 180),
            levelZeroDelta: new WorldWind.Location(180, 180),
            numLevels: 16,
            format: "image/png",
            size: 256,
            coordinateSystem: "EPSG:4326", // optional
            styleNames: "" // (optional): {String} A comma separated list of the styles to include in this layer.</li>
        };

        EnhancedWmsLayer.call(this, cfg);

        // Make this slightly translucent
        this.opacity = 0.8;

        // Requesting tiles with transparency (the nominal case) causes the layer's labels to bleed 
        // the underlying background layer which makes for a rather ugly map.
        this.urlBuilder.transparent = false;
    };

    EoxOpenStreetMapLayer.prototype = Object.create(EnhancedWmsLayer.prototype);

    EoxOpenStreetMapLayer.prototype.doRender = function (dc) {
        WorldWind.WmsLayer.prototype.doRender.call(this, dc);
        if (this.inCurrentFrame) {
            dc.screenCreditController.addStringCredit("OpenStreetMap { Data © OpenStreetMap contributers, Rendering © MapServer and EOX }", WorldWind.Color.DARK_GRAY);
        }
    };

    return EoxOpenStreetMapLayer;
}
);