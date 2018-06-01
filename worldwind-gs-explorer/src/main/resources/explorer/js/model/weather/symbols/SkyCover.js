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

        var SkyCoverPlacemark = function (latitude, longitude, skyCoverPct, eyeDistanceScalingThreshold) {
            WorldWind.Placemark.call(this, new WorldWind.Position(latitude, longitude, constants.MAP_SYMBOL_ALTITUDE_WEATHER), true); // eye distance scaling enabled

            this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            this.eyeDistanceScalingThreshold = eyeDistanceScalingThreshold;

            this.attributes = new WorldWind.PlacemarkAttributes(null);
            this.attributes.depthTest = false;
            this.attributes.imageScale = 0.5;
            this.attributes.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5,
                WorldWind.OFFSET_FRACTION, 0.5);
            this.attributes.labelAttributes.offset = new WorldWind.Offset(
                WorldWind.OFFSET_FRACTION, 0.5,     // Centered
                WorldWind.OFFSET_FRACTION, 2.2);    // Below RH
            this.attributes.drawLeaderLine = true;
            this.attributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;
            this.attributes.leaderLineAttributes.outlineWidth = 2;
            this.attributes.labelAttributes.color = WorldWind.Color.WHITE;
            this.attributes.labelAttributes.depthTest = false;
            this.highlightAttributes = new WorldWind.PlacemarkAttributes(this.attributes);
            //this.highlightAttributes.imageScale = placemarkAttr.imageScale * 1.2;
            this.eyeDistanceScalingThreshold = eyeDistanceScalingThreshold;

            this.updateSkyCoverImage(skyCoverPct);

        };
        // Inherit Placemark parent methods
        SkyCoverPlacemark.prototype = Object.create(WorldWind.Placemark.prototype);


        SkyCoverPlacemark.prototype.updateSkyCoverImage = function (skyCoverPct) {
            var img = new Image(),
                imgName,
                self = this;

            // Draw the image in the canvas after loading
            img.onload = function () {
                var canvas = document.createElement("canvas"),
                    context = canvas.getContext("2d");

                canvas.width = img.width;
                canvas.height = img.height;

                // Execute drawImage after delay for IE 11 compatitiblity (else SecurityError thrown)
                setTimeout(function () {
                    context.drawImage(img, 0, 0, img.width, img.height);
                    // Assign the loaded image to the placemark
                    self.attributes.imageSource = new WorldWind.ImageSource(canvas);
                    self.highlightAttributes.imageSource = new WorldWind.ImageSource(canvas);
                }, 0);
            };
            //img.crossOrigin = "Anonymous";    // Is this reqd for IE11 compatibility?
            if (skyCoverPct === undefined) {
                imgName = 'sky_cover-missing.svg';
            }
            else if (!isNaN(skyCoverPct)) {
                imgName = 'sky_cover-' + Math.round(8 * (skyCoverPct / 100)) + '.8.svg';
            }
            else {
                imgName = 'sky_cover-obscured.svg';
            }
            // Fire the onload event
            img.src = constants.IMAGE_PATH + 'weather/' + imgName;
        };

        return SkyCoverPlacemark;
    }
);

