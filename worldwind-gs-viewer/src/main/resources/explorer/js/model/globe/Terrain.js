/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

define([
    'model/util/Log',
    'model/util/WmtUtil',
    'worldwind'],
    function (
        Log,
        WmtUtil,
        ww) {
        "use strict";

        /**
         * Constructs a terrain from a specified latitude and longitude in degrees and elevation in meters, 
         * and aspect and slope in degrees.
         * @alias Terrain
         * @constructor
         * @classdesc Represents a latitude, longitude, elevation triple, with latitude, longitude, 
         * aspect and slope in degrees and elevation in meters.
         * @param {Number} latitude The latitude in degrees.
         * @param {Number} longitude The longitude in degrees.
         * @param {Number} elevation The elevation in meters.
         * @param {Number} aspect The aspect in degrees.
         * @param {Number} slope The elevation in degrees.
         */
        var Terrain = function (latitude, longitude, elevation, aspect, slope) {
            /**
             * The latitude in degrees.
             * @type {Number}
             */
            this.latitude = latitude;
            /**
             * The longitude in degrees.
             * @type {Number}
             */
            this.longitude = longitude;
            /**
             * The elevation in meters.
             * @type {Number}
             */
            this.elevation = elevation;
            /**
             * The elevation in degrees.
             * @type {Number}
             */
            this.aspect = aspect;
            /**
             * The slope in degrees.
             * @type {Number}
             */
            this.slope = slope;
        };

        /**
         * A Terrain with latitude, longitude, elevation, aspect and slope all 0.
         * @constant
         * @type {Terrain}
         */
        Terrain.ZERO = new Terrain(0, 0, 0, 0, 0);
        /**
         * A Terrain with latitude, longitude, elevation, aspect and slope all Number.NaN.
         * @constant
         * @type {Terrain}
         */
        Terrain.INVALID = new Terrain(Number.NaN, Number.NaN, Number.NaN, Number.NaN, Number.NaN);

        /**
         * Returns the computed linear distance between this terrain and another terrain object.
         * @param {Terrain} terrain The other terrain.
         * @returns {Number} Linear distance in meters.
         */
        Terrain.prototype.distanceBetween = function (terrain) {
            return WmtUtil.distanceBetweenLatLons(this.latitude, this.longitude, terrain.latitude, terrain.longitude);
        };
        /**
         * Sets this position to the latitude, longitude and elevation of a specified position.
         * @param {Position} terrain The terrain to copy.
         * @returns {Position} This position, set to the values of the specified position.
         * @throws {ArgumentError} If the specified position is null or undefined.
         */
        Terrain.prototype.copy = function (terrain) {
            if (!terrain) {
                throw new WorldWind.ArgumentError(
                    Log.error("Terrain", "copy", "missingTerrain"));
            }

            this.latitude = terrain.latitude;
            this.longitude = terrain.longitude;
            this.elevation = terrain.elevation;
            this.aspect = terrain.aspect;
            this.slope = terrain.slope;

            return this;
        };

        /**
         * Indicates whether this terrrain has the same values as a specified terran.
         * @param {Terrain} terrain The terrain to compare with this one.
         * @returns {Boolean} true if this terrain is equal to the specified one, otherwise false.
         */
        Terrain.prototype.equals = function (terrain) {
            return terrain
                && terrain.latitude === this.latitude
                && terrain.longitude === this.longitude
                && terrain.elevation === this.elevation
                && terrain.aspect === this.aspect
                && terrain.slope === this.slope;
        };


        /**
         * Returns a string representation of this terrain.
         * @returns {String}
         */
        Terrain.prototype.toString = function () {
            return "(" + this.latitude.toString() + "\u00b0, "
                + this.longitude.toString() + "\u00b0, "
                + this.elevation.toString() + "m, "
                + this.aspect.toString() + "\u00b0, "
                + this.slope.toString() + "\u00b0)";
        };

        return Terrain;
    }
);
