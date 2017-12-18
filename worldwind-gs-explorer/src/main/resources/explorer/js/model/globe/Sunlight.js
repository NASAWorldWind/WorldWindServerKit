/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

define([
    'model/util/Log',
    'model/sun/SolarCalculator',
    'worldwind'],
        function (
                log,
                SolarCalculator,
                ww) {
            "use strict";

            var Sunlight = function (time, observerLatitiude, observerLongitude) {
                var sun = Sunlight.solarCalculator.calculate(
                        time, -(time.getTimezoneOffset() / 60),
                        observerLatitiude, observerLongitude);
                /**
                 * Sunrise time.
                 * @type {Date}
                 */
                this.sunriseTime = sun.sunrise;
                /**
                 * Sunset time.
                 * @type {Date}
                 */
                this.sunsetTime = sun.sunset;
                /**
                 * Azimuth angle, relative to north in degrees.
                 * @type {Number}
                 */
                this.azimuthAngle = sun.azimuth;
                this.localHourAngle = sun.hourAngle;
                this.sunriseHourAngle = sun.sunriseHourAngle;
                this.sunsetHourAngle = sun.sunsetHourAngle;
                this.subsolarLatitude = sun.subsolarLatitude;
                this.subsolarLongitude = sun.subsolarLongitude;
            };

            /**
             * Returns a string representation of this sunlight.
             * @returns {String}
             */
            Sunlight.prototype.toString = function () {
                return "(" + this.sunriseTime.toString() + ", "
                        + this.sunsetTime.toString() + " "
                        + this.azimuthAngle.toString() + "\u00b0, "
                        + this.localHourAngle.toString() + "\u00b0, "
                        + this.sunriseHourAngle.toString() + "\u00b0, "
                        + this.sunsetHourAngle.toString() + "\u00b0, "
                        + this.subsolarLatitude.toString() + "\u00b0, "
                        + this.subsolarLatitude.toString() + "\u00b0)";
            };

            /**
             * Static solar calculator.
             */
            Sunlight.solarCalculator = new SolarCalculator();

            return Sunlight;
        }
);
