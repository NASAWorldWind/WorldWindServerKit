/* 
 * Copyright (c) 2017 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * The EnhancedWmsLayer provides vendor parameters to the GeoServer WMS GetMap 
 * requests.
 *
 * @exports EnhancedWmsLayer
 * @author Bruce Schubert
 */
define(['worldwind'],
        function (ww) {
            "use strict";

            var EnhancedWmsLayer = function (config, timeString) {
                WorldWind.WmsLayer.call(this, config, timeString);

                // Extract the bbox out of the WMS layer configuration
                this.bbox = config.sector;

                // Override the default WmsLayer 36x36 level set with one that
                // matches the GeoServer EPSG:4326 Gridset
                this.levels = new WorldWind.LevelSet(WorldWind.Sector.FULL_SPHERE,
                        new WorldWind.Location(90, 90),
                        22,
                        256,
                        256);

                // "tiled=true" is a hint for the GeoServer WMS to use the GeoWebCache
                this.vendorParms = '&tiled=true';

            };

            // Inherit the WmsLayer methods
            EnhancedWmsLayer.prototype = Object.create(WorldWind.WmsLayer.prototype);

            /**
             * Returns the URL string for the resource. Overrides the TiledImageLayer
             * resourceUrlForTile method by appending the vendor paramerters to the URL.
             * @param {ImageTile} tile The tile whose image is returned
             * @param {String} imageFormat The mime type of the image format desired.
             * @returns {String} The URL string, or null if the string can not be formed.
             */
            EnhancedWmsLayer.prototype.resourceUrlForTile = function (tile, imageFormat) {
                var url = WorldWind.TiledImageLayer.prototype.resourceUrlForTile.call(this, tile, imageFormat);
                if (url) {
                    url = url + this.vendorParms;
                }
                return url;
            };

            return EnhancedWmsLayer;
        }
);