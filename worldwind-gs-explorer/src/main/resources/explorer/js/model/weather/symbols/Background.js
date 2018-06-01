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

            var BackgroundPlacemark = function (latitude, longitude, eyeDistanceScalingThreshold) {
                WorldWind.Placemark.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), true);

                this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                this.eyeDistanceScalingThreshold = eyeDistanceScalingThreshold;

                this.attributes = new WorldWind.PlacemarkAttributes(null);
                this.attributes.depthTest = false;
                this.attributes.imageScale = 0.5;

                this.attributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 0.5);
                this.attributes.imageSource = constants.IMAGE_PATH + 'weather/background.png';
                this.highlightAttributes = new WorldWind.PlacemarkAttributes(this.attributes);
                this.highlightAttributes.imageSource = this.attributes.imageSource;
                this.highlightAttributes.imageScale = 1.5;

            };
            // Inherit Placemark parent methods
            BackgroundPlacemark.prototype = Object.create(WorldWind.Placemark.prototype);


            return BackgroundPlacemark;
        }
);

