/* 
 * Copyright (c) 2018 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WebGLRenderingContext, WorldWind */

define(['worldwind'],
    function (ww) {
        "use strict";

        /**
         * 
         * @param {Position} position
         * @param {String} text
         * @param {Boolean} eyeDistanceScaling
         * @returns {EnhancedGeographicTextL#10.EnhancedGeographicText}
         */
        var EnhancedGeographicText = function (position, text, eyeDistanceScaling) {

            WorldWind.GeographicText.call(this, position, text);
            //
            // Set properties in super
            //
            
            // Eye distance scaling/label is mutually exclusive of decluttering.
            if (eyeDistanceScaling) {
                // Set the declutterGroup to zero to disable decluttering in favor of eye distance scaling
                this.declutterGroup = 0;
            }
            this.eyeDistanceScaling = eyeDistanceScaling;

            //
            // Add properties 
            //
            
            this.eyeDistanceScalingThreshold = 1e6;

            this.eyeDistanceScalingLabelThreshold = 1.5 * this.eyeDistanceScalingThreshold;

        };
        EnhancedGeographicText.prototype = Object.create(WorldWind.GeographicText.prototype);

        /**
         * Creates a new text object that is a copy of this geographic text.
         * @returns {EnhancedGeographicText} The new geographic text.
         */
        EnhancedGeographicText.prototype.clone = function () {
            var clone = new EnhancedGeographicText(this.position, this.text, this.eyeDistanceScaling);

            clone.copy(this);
            
            clone.eyeDistanceScalingThreshold = this.eyeDistanceScalingThreshold;

            clone.eyeDistanceScalingLabelThreshold = this.eyeDistanceScalingLabelThreshold;

            return clone;
        };

        
        EnhancedGeographicText.prototype.render = function (dc) {
            
            if (this.eyeDistanceScaling && (this.eyeDistance > this.eyeDistanceScalingLabelThreshold)) {
                // Target visibility is set to 0 to cause the label to be faded in or out. Nothing else
                // here uses target visibility.
                this.targetVisibility = 0;
            } else {
                this.targetVisibility = 1;
            }

            WorldWind.GeographicText.prototype.render.call(this, dc);
            
        };

        return EnhancedGeographicText;
    });