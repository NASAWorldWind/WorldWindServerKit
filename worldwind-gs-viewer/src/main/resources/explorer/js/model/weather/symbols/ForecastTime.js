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
         * Creates a GeographicText component used to display the forecast time in a Weather Map Symbol.
         * @param {Number} latitude
         * @param {Number} longitude
         * @param {String} timeString
         * @returns {ForecastTime}
         */
        var ForecastTime = function (latitude, longitude, timeString) {
            WorldWind.GeographicText.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), timeString);

            this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            this.alwaysOnTop = false;
            this.attributes = new WorldWind.TextAttributes(null);
            this.attributes.scale = 1.0;
            this.attributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5, // Center
                WorldWind.OFFSET_FRACTION, 3.0);   // Below Place label
            this.attributes.color = WorldWind.Color.WHITE;
            this.attributes.depthTest = false;
        };
        // Inherit Placemark parent methods
        ForecastTime.prototype = Object.create(WorldWind.GeographicText.prototype);

        /**
         * Creates a clone of this object.
         * @returns {ForecastTime}
         */
        ForecastTime.prototype.clone = function () {
            var clone = new ForecastTime(this.position.latitude, this.position.longitude, this.text);
            clone.copy(this);
            clone.pickDelegate = this.pickDelegate ? this.pickDelegate : this;
            clone.attributes = new WorldWind.TextAttributes(this.attributes);
            return clone;
        };

        return ForecastTime;
    }
);

