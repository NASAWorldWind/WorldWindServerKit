/* 
 * The MIT License.
 * Copyright (c) 2015, 2016 Bruce Schubert
 */

/*global define, WorldWind*/

define(['model/globe/EnhancedPlacemark',
        'model/util/WmtUtil',
        'model/Constants',
        'worldwind'],
    function (EnhancedPlacemark,
              util,
              constants,
              ww) {
        "use strict";

        /**
         * @constructor
         * @param {type} latitude
         * @param {type} longitude
         * @param {type} windSpdKts
         * @param {type} windDirDeg
         * @param {type} eyeDistanceScaling
         * @returns {WindBarbPlacemark_L38.WindBarbPlacemark}
         */
        var WindBarbPlacemark = function (latitude, longitude, windSpdKts, windDirDeg, eyeDistanceScalingThreshold) {

            //EnhancedPlacemark.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), eyeDistanceScaling);
            WorldWind.Placemark.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), true);

            this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            this.eyeDistanceScalingThreshold = eyeDistanceScalingThreshold;

            this.attributes = new WorldWind.PlacemarkAttributes(null);
            this.attributes.depthTest = true;
            this.attributes.imageScale = 0.3;
            this.attributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5, // Width centered
                WorldWind.OFFSET_FRACTION, 0.5);// Height centered
            this.highlightAttributes = new WorldWind.PlacemarkAttributes(this.attributes);

            this.imageRotation = 0;
            this.imageTilt = 0;

            this.updateWindBarbImage(windSpdKts, windDirDeg);
        };
        // Inherit the Placemark methods (Note: calls the Placemark constructor a 2nd time).
        WindBarbPlacemark.prototype = Object.create(EnhancedPlacemark.prototype);
        //WindBarbPlacemark.prototype = Object.create(WorldWind.Placemark.prototype);

        /**
         *
         * @param {type} windSpdKts
         * @param {type} windDirDeg
         * @returns {undefined}
         */
        WindBarbPlacemark.prototype.updateWindBarbImage = function (windSpdKts, windDirDeg) {
            var img = new Image(),
                imgName,
                knots,
                self = this;

            // Draw the image in the canvas after loading
            img.onload = function () {
                var canvas = document.createElement("canvas"),
                    context = canvas.getContext("2d"),
                    size = Math.max(img.width, img.height) * 2,
                    center = size / 2,
                    ccwRadians = (-windDirDeg + 90) * (Math.PI / 180);

                // Create a square canvase
                canvas.width = size;
                canvas.height = size;

//                // Draw the image at the center of the canvas
                self.rotateAbout(context, ccwRadians, center, center);

                // Execute drawImage after delay for ID 11 compatitiblity
                setTimeout(function () {
                    context.drawImage(img, center, center);
                    // Assign the loaded image to the placemark
                    self.attributes.imageSource = new WorldWind.ImageSource(canvas);
                    self.highlightAttributes.imageSource = new WorldWind.ImageSource(canvas);
                }, 0);
            };
            if (windSpdKts === undefined || isNaN(windSpdKts)) {
                this.enabled = false;
                return;
            }
            // Wind speed rounded to 5 kts
            knots = Math.round(windSpdKts / 5) * 5;
            if (knots === 0) {
                this.enabled = false;
                return;
            }
            // Set the image -- which fires the onload event
            imgName = 'wind_spd-' + util.pad(knots, 2) + 'kts.svg';
            img.src = constants.IMAGE_PATH + 'weather/' + imgName;

            this.enabled = true;
        };

        /**
         * Rotates theta radians counterclockwise around the point (x,y). This can also be accomplished with a
         * translate,rotate,translate sequence.
         * Copied from the book "JavaScript: The Definitive Reference"
         * @param {Context} c
         * @param {Number} theta Radians
         * @param {Number} x
         * @param {Number} y
         */
        WindBarbPlacemark.prototype.rotateAbout = function (c, theta, x, y) {
            var ct = Math.cos(theta), st = Math.sin(theta);
            c.transform(ct, -st, st, ct, -x * ct - y * st + x, x * st - y * ct + y);
        };

        return WindBarbPlacemark;
    }
);

