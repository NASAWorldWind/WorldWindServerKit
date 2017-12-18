/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The TimeZoneLayer, derived from Open Natural Earth 10m time zones.
 *
 * See: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/timezones/
 *
 * @exports TimeZoneLayer
 * @author Bruce Schubert
 */
define(['model/Constants',
        'model/globe/layers/ShapefileLayer',
        'worldwind'],
    function (constants,
              ShapefileLayer,
              ww) {
        "use strict";
        /**
         * Constructs a time zone layer.
         * @constructor
         */
        var TimeZoneLayer = function () {
            var shapeConfigurationCallback = function (attributes, record) {
                var configuration = {};
                configuration.name = attributes.values.name || attributes.values.Name || attributes.values.NAME;
                configuration.attributes = new WorldWind.ShapeAttributes(null);
                // Fill the polygon with a random pastel color.
                configuration.attributes.interiorColor = new WorldWind.Color(
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    0.375 + 0.5 * Math.random(),
                    0.0);   // We must draw the interior to enable picking, but make it transparent

                // Disabled drawing the outlines to improve rendering/picking performance
                configuration.attributes.drawOutline = false;
                // Paint the outline in a darker variant of the interior color.
//                configuration.attributes.outlineColor = new WorldWind.Color(
//                    0.5 * configuration.attributes.interiorColor.red,
//                    0.5 * configuration.attributes.interiorColor.green,
//                    0.5 * configuration.attributes.interiorColor.blue,
//                    0.5);

                // Make the DBaseRecord and Layer available to picked objects
                configuration.userProperties = {record: attributes, layer: record.shapefile.layer};

                return configuration;
            };

            this._enabled = true;

            // The Open Natural Earth 10m time zones have been simplified to .05deg resolution
            // See: http://www.naturalearthdata.com/downloads/10m-cultural-vectors/timezones/
            ShapefileLayer.call(this,
                ww.WWUtil.currentUrlSansFilePart() + "/data/timezones/ne_05deg_time_zones.shp",
                constants.LAYER_NAME_TIME_ZONES, 
                shapeConfigurationCallback);
        };

        // Inherit the ShapefileLayer methods
        TimeZoneLayer.prototype = Object.create(ShapefileLayer.prototype);

        return TimeZoneLayer;
    }
);