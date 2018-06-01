/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The EnhancedStarFieldLayer observes the Globe's dateTime member.
 *
 * @exports EnhancedStarFieldLayer
 * @author Bruce Schubert
 */
define([
    'model/Constants',
    'worldwind'],
    function (constants) {
        "use strict";
        /**
         * Constructs a starfield layer.
         * @param {Globe}  globe
         * @param {String}  url optional url for the stars data
         * @constructor
         */
        var EnhancedStarFieldLayer = function (globe, url) {
            var self = this;
            WorldWind.StarFieldLayer.call(this, url);

            this.displayName = constants.LAYER_NAME_STARS;
            
            this.sunEnabled = false;

            // Update the star and sun location based on the Globe's current time
            globe.dateTime.subscribe(function (newDateTime) {
                if (self.sunEnabled) {
                    self.time = newDateTime; 
                } else {
                    self.time = null;
                }
            });
        };
        // Inherit the AtmosphereLayer methods
        EnhancedStarFieldLayer.prototype = Object.create(WorldWind.StarFieldLayer.prototype);

        return EnhancedStarFieldLayer;
    }
);