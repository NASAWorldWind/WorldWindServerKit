/* 
 * The MIT License.
 * Copyright (c) 2015, 2016 Bruce Schubert
 */

/*global define, WorldWind*/

define(['model/Constants',
        'worldwind'],
    function (constants,
              ww) {
        "use strict";

        /**
         * Creates a GeographicText component used to display the air temperature in a Weather Map Symbol.
         * @param {Number} latitude
         * @param {Number} longitude
         * @param {String} airTempF
         * @returns {AirTemperature}
         */
        var AirTemperature = function (latitude, longitude, airTempF) {
            WorldWind.GeographicText.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), airTempF);

            this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            this.alwaysOnTop = false;
            this.attributes = new WorldWind.TextAttributes(null);
            this.attributes.scale = 1.0;
            this.attributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 1.3,     // Left
                WorldWind.OFFSET_FRACTION, -0.3);   // Upper
            this.attributes.color = WorldWind.Color.YELLOW;
            this.attributes.depthTest = false;
        };
        // Inherit Placemark parent methods
        AirTemperature.prototype = Object.create(WorldWind.GeographicText.prototype);

        /**
         * Creates a clone of this object.
         * @returns {AirTemperature}
         */
        AirTemperature.prototype.clone = function () {
            var clone = new AirTemperature(this.position.latitude, this.position.longitude, this.text);
            clone.copy(this);
            clone.pickDelegate = this.pickDelegate ? this.pickDelegate : this;
            clone.attributes = new WorldWind.TextAttributes(this.attributes);
            return clone;
        };

        return AirTemperature;
    }
);

