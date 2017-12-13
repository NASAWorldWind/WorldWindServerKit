/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The EnhancedAtmosphereLayer observes the Globe's sunlight member.
 *
 * @exports EnhancedAtmosphereLayer
 * @author Bruce Schubert
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        /**
         * Constructs an atmosphere layer.
         * @param {Globe}  globe
         * @param {String}  url
         * @constructor
         */
        var EnhancedAtmosphereLayer = function (globe, url) {
            var self = this;
            WorldWind.AtmosphereLayer.call(this, url);

            this.displayName = "Atmosphere & Day/Night";

            // Update the light location based on the Globe's current sunlight member
            globe.sunlight.subscribe(function (sunlight) {
                self.lightLocation = new WorldWind.Position(sunlight.subsolarLatitude, sunlight.subsolarLongitude, 1.5e11); // 1 au: 149,597,870,700 meters
            });
        };
        // Inherit the AtmosphereLayer methods
        EnhancedAtmosphereLayer.prototype = Object.create(WorldWind.AtmosphereLayer.prototype);

        return EnhancedAtmosphereLayer;
    }
);