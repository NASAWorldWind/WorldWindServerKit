/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

/**
 * Renders orosshairs centered on the WorldWindow.
 * Based on Compass.js 2939 2015-03-30 16:50:49Z by tgaskins.
 * @param WorldWind 
 * @exports Crosshairs
 * @author Bruce Schubert
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        /**
         * Constructs crosshairs.
         * @constructor
         * @augments ScreenImage
         * @classdesc Displays a crosshairs image centered in the World Window. 
         * @param {String} imagePath The URL of the image to display. If null or undefined, a default crosshairs image is used.
         */
        var Crosshairs = function (imagePath) {

            var sOffset = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0.5, WorldWind.OFFSET_FRACTION, 0.5),
                iPath = imagePath + "32x32-crosshair-outline.png";

            WorldWind.ScreenImage.call(this, sOffset, iPath);

            // Must set the default image offset and scale after calling the constructor above.
            // Align the center of the image with the center of the screen
            this.imageOffset = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0.5, WorldWind.OFFSET_FRACTION, 0.5);               
            // Scale the default image.
            this.imageScale = 1.2;
        };

        Crosshairs.prototype = Object.create(WorldWind.ScreenImage.prototype);

        return Crosshairs;
    }
);