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
define(['WorldWindFixes', 'worldwind'],
    function (WorldWindFixes) {
        "use strict";

        var EnhancedWmsLayer = function (config, timeString) {
            WorldWind.WmsLayer.call(this, config, timeString);

            // Extract the bbox out of the WMS layer configuration
            this.bbox = config.sector;

            // Override the default WmsLayer 36x36 level set with one that
            // matches the GeoServer EPSG:4326 Gridset            
            this.levels = new WorldWind.LevelSet(WorldWind.Sector.FULL_SPHERE,
                config.levelZeroDelta || new WorldWind.Location(180, 180),
                config.numLevels || 22,
                config.size || 256,
                config.size || 256);

            // "tiled=true" is a hint for the GeoServer WMS to use the GeoWebCache
            this.vendorParms = '&tiled=true&tilesorigin=-180,-90';

            // The WW tileCache is too small to accomodate large screen 
            // full of tiles at an oblique view from the surface.
            // Increase the size to prevent trashing of the tileCache.
            this.tileCache = new WorldWind.MemoryCache(
                WorldWindFixes.TILE_CACHE_CAPACITY,
                WorldWindFixes.TILE_CACHE_LOW_WATER);

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