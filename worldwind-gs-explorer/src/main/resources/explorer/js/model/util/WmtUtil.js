/* 
 * Copyright (c) 2015, Bruce Schubert <bruce@emxsys.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     - Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     - Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     - Neither the name of Bruce Schubert, Emxsys nor the names of its 
 *       contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*global define, WorldWind*/

/**
 * Common utiltities module for WMT.
 * @author Bruce Schubert
 * @module {util/WmtUtil}
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        var WmtUtil = {
            DEG_TO_RAD: Math.PI / 180,
            HOURS_TO_MILLISECS: 1000 * 60 * 60,
            METERS_TO_FEET: 3.28084,
            METERS_TO_MILES: 0.000621371,
            /**
             * Distance in meters on surface of globe to angular distance.
             */
            METERS_TO_RADIANS: 1 / WorldWind.EARTH_RADIUS,
            MILLISECS_TO_MINUTES: 1 / (1000 * 60),
            MILLISECS_TO_HOURS: 1 / (1000 * 60 * 60),
            EPSILON_TOLERANCE: 0.0000001,
            /**
             * Gets the current domain from the active browser window.
             * @returns {String} E.g., returns http://emxsys.com from http://emxsys.com/documentation/index.html
             */
            currentDomain: function () {
                return window.location.protocol + "//" + window.location.host;
            },
            /**
             * Gets the computed linear distance in meters between two lat/lons.
             * @param {Number} lat1 First latitude in degrees.
             * @param {Number} lon1 First longitude in degrees.
             * @param {Mumber} lat2 Second latitude in degrees.
             * @param {Number} lon2 Second longitude in degrees.
             * @returns {Number} Distance in meters between the two coordinates.
             */
            distanceBetweenLatLons: function (lat1, lon1, lat2, lon2) {
                var angleRad = WorldWind.Location.linearDistance(
                    new WorldWind.Location(lat1, lon1),
                    new WorldWind.Location(lat2, lon2));
                return angleRad * WorldWind.EARTH_RADIUS;
            },
            /**
             * Linear interpolation.
             * @param {type} value
             * @param {type} value1
             * @param {type} value2
             * @param {type} range1
             * @param {type} range2
             * @returns A number along the range number line
             */
            linearInterpolation: function (value, value1, value2, range1, range2) {
                // Avoid divide by zero
                if (value === value1) {
                    return range1; 
                }
                var amount = (value - value1) / (value2 - value1);
//                return ((1 - amount) * range1) + (amount * range2);
                return  range1 + amount * (range2 - range1);
            },
            /**
             * Generates a GUID-like string.
             * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
             * @returns {String} Generated GUID.
             */
            guid: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
//                function s4() {
//                    return Math.floor((1 + Math.random()) * 0x10000)
//                        .toString(16)
//                        .substring(1);
//                }
//                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
//                    s4() + '-' + s4() + s4() + s4();
            },
            /**
             * Gets the number of minutes between two times.
             * @param {Date} time1
             * @param {Date} time2
             * @returns {Number} Minutes (floating point).
             */
            minutesBetween: function (time1, time2) {
                return Math.abs(time1.getTime() - time2.getTime()) * this.MILLISECS_TO_MINUTES;
            },
            /**
             * Compare two doubles with a given epsilon (tolerance)
             * 
             * @param {Number} a lhs value to be compared.
             * @param {Number} b rhs value to be compared.
             * @param {Number} epsilon Optional. Default is WmtUtil.EPSILON_TOLERANCE
             * @returns {Boolean} True if the difference between a and b is less than the given epsilon.
             */
            nearlyEquals2: function (a, b, epsilon) {
                if (a === b) {
                    return true;
                }
                return (Math.abs(a - b) < Math.abs(epsilon || this.EPSILON_TOLERANCE));
            },
            /**
             * Compare two doubles using a computed epsilon based on a default tolerance.
             * The epsilon will be 0.00001% (tolerance) of the largest value (a or b).
             * @param {Number} a lhs value to be compared
             * @param {Number} b rhs value to be compared
             * @return {Boolean} True if the difference between a and b is less than the computed epsilon.
             */
            nearlyEquals: function (a, b) {
                if (a === b) {
                    return true;
                }
                // If the difference is less than epsilon, treat as equal
                var epsilon = this.EPSILON_TOLERANCE * Math.max(Math.abs(a), Math.abs(b));
                return Math.abs(a - b) < epsilon;
            },
            /**
             * Pads a number with leading zeros.
             * @param {Number} num
             * @param {Number} size
             * @returns {String}
             */
            pad: function (num, size) {
                var s = "0000000000" + Math.abs(num);
                return  (num < 0 ? '-' : '') + s.substr(s.length - size);
            }
        };
        return WmtUtil;
    }
);

