/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind*/


define(['worldwind'], function () {
    "use strict";

    var WorldWindFixes = {};

    WorldWindFixes.TILE_CACHE_CAPACITY = 4e6;
    WorldWindFixes.TILE_CACHE_LOW_WATER = 3.5e6;
    WorldWindFixes.NETWORK_RETRIEVAL_QUEUE_SIZE = 8;
    WorldWindFixes.MEMORY_CACHE_VOLATILE_BIAS = 60e3;   // in milliseconds

    /**
     * Apply fixes to the WorldWind library's class prototypes.
     */
    WorldWindFixes.applyLibraryFixes = function () {
        // Augment the 0.9.0 version WorldWind with bug fixes and customizations
        if (WorldWind.VERSION === "0.9.0") {

            /**
             * Text.makeOrderedRenderable.
             * 
             * Adds the 'volatile' param to dc.gpuResourceCache.putResource
             */
            WorldWind.Text.prototype.makeOrderedRenderable = function (dc) {
                var w, h, s, offset;
                this.determineActiveAttributes(dc);
                if (!this.activeAttributes) {
                    return null;
                }
                //// Compute the text's screen point and distance to the eye point.
                if (!this.computeScreenPointAndEyeDistance(dc)) {
                    return null;
                }
                var labelFont = this.activeAttributes.font,
                    textureKey = this.text + labelFont.toString();
                this.activeTexture = dc.gpuResourceCache.resourceForKey(textureKey);
                if (!this.activeTexture) {
                    this.activeTexture = dc.textSupport.createTexture(dc, this.text, labelFont, true);
                    dc.gpuResourceCache.putResource(textureKey, this.activeTexture, this.activeTexture.size, true /*volatile*/);
                }
                w = this.activeTexture.imageWidth;
                h = this.activeTexture.imageHeight;
                s = this.activeAttributes.scale;
                offset = this.activeAttributes.offset.offsetForSize(w, h);
                this.imageTransform.setTranslation(
                    this.screenPoint[0] - offset[0] * s,
                    this.screenPoint[1] - offset[1] * s,
                    this.screenPoint[2]);
                this.imageTransform.setScale(w * s, h * s, 1);
                this.imageBounds = WorldWind.WWMath.boundingRectForUnitQuad(this.imageTransform);
                return this;
            };

            /**
             * GpuResourceCache.putResource
             * 
             * Adds the optional 'isVolatile' param to putResource and passes the truthy variable to putEntry.
             */
            WorldWind.GpuResourceCache.prototype.putResource = function (key, resource, size, isVolatile) {
                if (!key) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "GpuResourceCache", "putResource", "missingKey."));
                }
                if (!resource) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "GpuResourceCache", "putResource", "missingResource."));
                }
                if (!size || size < 1) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "GpuResourceCache", "putResource",
                            "The specified resource size is undefined or less than 1."));
                }
                var entry = {
                    resource: resource
                };
                this.entries.putEntry(key instanceof WorldWind.ImageSource ? key.key : key, entry, size, isVolatile);
            };
            


            /**
             * MemoryCache.putEntry.
             * 
             * Adds the optional isVolatile param Adds the 'isVolatile' field to
             * the cacheEntry. Applies the volatile bias to the lastUsed field.
             */
            WorldWind.MemoryCache.prototype.putEntry = function (key, entry, size, isVolatile) {
                if (!key) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "MemoryCache", "putEntry", "missingKey."));
                }
                if (!entry) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "MemoryCache", "putEntry", "missingEntry."));
                }
                if (size < 1) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "MemoryCache", "putEntry",
                            "The specified entry size is less than 1."));
                }
                var existing = this.entries[key],
                    cacheEntry;
                if (existing) {
//                    console.log('putEntry > update: ' + key)
                    this.removeEntry(key);
                }

                if (this.usedCapacity + size > this._capacity) {
                    this.makeSpace(size);
                }
                this.usedCapacity += size;
                this.freeCapacity = this._capacity - this.usedCapacity;
                // BDS: added isVolatile property
                cacheEntry = {
                    key: key,
                    entry: entry,
                    size: size,
                    lastUsed: isVolatile ? Date.now() - WorldWindFixes.MEMORY_CACHE_VOLATILE_BIAS : Date.now(), // milliseconds
                    isVolatile: isVolatile ? true : false,
                    retrievedCount: 0
                };
                this.entries[key] = cacheEntry;
//                console.log('putEntry( ' + (this.usedCapacity / this._capacity * 100).toFixed(0) + '% )');
            };

            /**
             * MemoryCache.entryForKey
             * 
             * Applies bias to volatile entries
             */
            WorldWind.MemoryCache.prototype.entryForKey = function (key) {
                if (!key)
                    return null;
                var cacheEntry = this.entries[key];
                if (!cacheEntry)
                    return null;
                cacheEntry.lastUsed = cacheEntry.isVolatile ? Date.now() - WorldWindFixes.MEMORY_CACHE_VOLATILE_BIAS : Date.now();   // milliseconds
                cacheEntry.retrievedCount++;
                return cacheEntry.entry;
            };

            /**
             * TiledImageLayer.retrieveTileImage
             * 
             * Adds test for this.currentRetrievals.length > threshold
             */
            WorldWind.TiledImageLayer.prototype.retrieveTileImage = function (dc, tile, suppressRedraw) {
                if (this.currentRetrievals.indexOf(tile.imagePath) < 0) {
                    if (this.currentRetrievals.length > WorldWindFixes.NETWORK_RETRIEVAL_QUEUE_SIZE) {
                        return;
                    }

                    if (this.absentResourceList.isResourceAbsent(tile.imagePath)) {
                        return;
                    }

                    var url = this.resourceUrlForTile(tile, this.retrievalImageFormat),
                        image = new Image(),
                        imagePath = tile.imagePath,
                        cache = dc.gpuResourceCache,
                        canvas = dc.currentGlContext.canvas,
                        layer = this;
                    if (!url) {
                        this.currentTilesInvalid = true;
                        return;
                    }

                    image.onload = function () {
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_INFO, "Image retrieval succeeded: " + url);
                        var texture = layer.createTexture(dc, tile, image);
                        layer.removeFromCurrentRetrievals(imagePath);
                        if (texture) {
                            cache.putResource(imagePath, texture, texture.size);
                            layer.currentTilesInvalid = true;
                            layer.absentResourceList.unmarkResourceAbsent(imagePath);
                            if (!suppressRedraw) {
                                // Send an event to request a redraw.
                                var e = document.createEvent('Event');
                                e.initEvent(WorldWind.REDRAW_EVENT_TYPE, true, true);
                                canvas.dispatchEvent(e);
                            }
                        }
                    };
                    image.onerror = function () {
                        layer.removeFromCurrentRetrievals(imagePath);
                        layer.absentResourceList.markResourceAbsent(imagePath);
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "Image retrieval failed: " + url);
                    };
                    this.currentRetrievals.push(imagePath);
                    image.crossOrigin = this.crossOrigin;
                    image.src = url;
                }
            };

            /**
             * WmtsLayer.retrieveTileImage
             * 
             * Adds test for this.currentRetrievals.length > threshold
             */
            WorldWind.WmtsLayer.prototype.retrieveTileImage = function (dc, tile) {
                if (this.currentRetrievals.indexOf(tile.imagePath) < 0) {
                    if (this.currentRetrievals.length > WorldWindFixes.NETWORK_RETRIEVAL_QUEUE_SIZE) {
                        return;
                    }

                    if (this.absentResourceList.isResourceAbsent(tile.imagePath)) {
                        return;
                    }

                    var url = this.resourceUrlForTile(tile, this.imageFormat),
                        image = new Image(),
                        imagePath = tile.imagePath,
                        cache = dc.gpuResourceCache,
                        canvas = dc.currentGlContext.canvas,
                        layer = this;
                    if (!url) {
                        this.currentTilesInvalid = true;
                        return;
                    }

                    image.onload = function () {
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_INFO, "Image retrieval succeeded: " + url);
                        var texture = layer.createTexture(dc, tile, image);
                        layer.removeFromCurrentRetrievals(imagePath);
                        if (texture) {
                            cache.putResource(imagePath, texture, texture.size);
                            layer.currentTilesInvalid = true;
                            layer.absentResourceList.unmarkResourceAbsent(imagePath);
                            // Send an event to request a redraw.
                            var e = document.createEvent('Event');
                            e.initEvent(WorldWind.REDRAW_EVENT_TYPE, true, true);
                            canvas.dispatchEvent(e);
                        }
                    };
                    image.onerror = function () {
                        layer.removeFromCurrentRetrievals(imagePath);
                        layer.absentResourceList.markResourceAbsent(imagePath);
                        WorldWind.Logger.log(WorldWind.Logger.LEVEL_WARNING, "Image retrieval failed: " + url);
                    };
                    this.currentRetrievals.push(imagePath);
                    image.crossOrigin = 'anonymous';
                    image.src = url;
                }
            };

            /**
             * SurfaceShapeTile.hasTexture
             * 
             * Uses containsResource insteadof resourceForKey.
             */
            WorldWind.SurfaceShapeTile.prototype.hasTexture = function (dc) {
                if (dc.pickingMode) {
                    return false;
                }
                if (!this.gpuCacheKey) {
                    this.gpuCacheKey = this.getCacheKey();
                }
                var gpuResourceCache = dc.gpuResourceCache;
                return gpuResourceCache.containsResource(this.gpuCacheKey);
            };

            /**
             * SurfaceShapeTile.updateTexture
             * 
             * Uses isVolatile argument (true) in putResource.
             */
            WorldWind.SurfaceShapeTile.prototype.updateTexture = function (dc) {
                var gl = dc.currentGlContext,
                    canvas = WorldWind.SurfaceShapeTile.canvas,
                    ctx2D = WorldWind.SurfaceShapeTile.ctx2D;

                canvas.width = this.tileWidth;
                canvas.height = this.tileHeight;

                // Mapping from lat/lon to x/y:
                //  lon = minlon => x = 0
                //  lon = maxLon => x = 256
                //  lat = minLat => y = 256
                //  lat = maxLat => y = 0
                //  (assuming texture size is 256)
                // So:
                //  x = 256 / sector.dlon * (lon - minLon)
                //  y = -256 / sector.dlat * (lat - maxLat)
                var xScale = this.tileWidth / this.sector.deltaLongitude(),
                    yScale = -this.tileHeight / this.sector.deltaLatitude(),
                    xOffset = -this.sector.minLongitude * xScale,
                    yOffset = -this.sector.maxLatitude * yScale;

                // Reset the surface shape state keys
                this.asRenderedSurfaceShapeStateKeys = [];

                for (var idx = 0, len = this.surfaceShapes.length; idx < len; idx += 1) {
                    var shape = this.surfaceShapes[idx];
                    this.asRenderedSurfaceShapeStateKeys.push(this.surfaceShapeStateKeys[idx]);

                    shape.renderToTexture(dc, ctx2D, xScale, yScale, xOffset, yOffset);
                }

                this.gpuCacheKey = this.getCacheKey();

                var gpuResourceCache = dc.gpuResourceCache;
                var texture = new WorldWind.Texture(gl, canvas);
                gpuResourceCache.putResource(this.gpuCacheKey, texture, texture.size, true /*isVolatile*/);

                return texture;
            };
            
            
            /**
             * WmsUrlBuilder.urlForTile
             * 
             * Fixes replace " " with %20 with a global replace.
             */
            WorldWind.WmsUrlBuilder.prototype.urlForTile = function (tile, imageFormat) {
                if (!tile) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "WmsUrlBuilder", "urlForTile", "missingTile"));
                }

                if (!imageFormat) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "WmsUrlBuilder", "urlForTile",
                            "The image format is null or undefined."));
                }

                var sector = tile.sector;

                var sb = WorldWind.WmsUrlBuilder.fixGetMapString(this.serviceAddress);

                if (sb.search(/service=wms/i) < 0) {
                    sb = sb + "service=WMS";
                }

                sb = sb + "&request=GetMap";
                sb = sb + "&version=" + this.wmsVersion;
                sb = sb + "&transparent=" + (this.transparent ? "TRUE" : "FALSE");
                sb = sb + "&layers=" + this.layerNames;
                sb = sb + "&styles=" + this.styleNames;
                sb = sb + "&format=" + imageFormat;
                sb = sb + "&width=" + tile.tileWidth;
                sb = sb + "&height=" + tile.tileHeight;

                if (this.timeString) {
                    sb = sb + "&time=" + this.timeString;
                }

                if (this.isWms130OrGreater) {
                    sb = sb + "&crs=" + this.crs;
                    sb = sb + "&bbox=";
                    if (this.crs === "CRS:84") {
                        sb = sb + sector.minLongitude + "," + sector.minLatitude + ",";
                        sb = sb + sector.maxLongitude + "," + sector.maxLatitude;
                    } else {
                        sb = sb + sector.minLatitude + "," + sector.minLongitude + ",";
                        sb = sb + sector.maxLatitude + "," + sector.maxLongitude;
                    }
                } else {
                    sb = sb + "&srs=" + this.crs;
                    sb = sb + "&bbox=";
                    sb = sb + sector.minLongitude + "," + sector.minLatitude + ",";
                    sb = sb + sector.maxLongitude + "," + sector.maxLatitude;
                }

                // Global replace space
                sb = sb.replace(/\s/g, "%20");

                return sb;
            };


            /**
             * WcsTileUrlBuilder.urlForTile
             * 
             * Fixes replace " " with %20 with a global replace.
             */
            WorldWind.WcsTileUrlBuilder.prototype.urlForTile = function (tile, coverageFormat) {

                if (!tile) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "WcsUrlBuilder", "urlForTile", "missingTile"));
                }

                if (!coverageFormat) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "WcsUrlBuilder", "urlForTile",
                            "The coverage format is null or undefined."));
                }

                var sector = tile.sector;

                var sb = WorldWind.WcsTileUrlBuilder.fixGetCoverageString(this.serviceAddress);

                if (sb.search(/service=wcs/i) < 0) {
                    sb = sb + "service=WCS";
                }

                sb = sb + "&request=GetCoverage";
                sb = sb + "&version=" + this.wcsVersion;
                sb = sb + "&coverage=" + this.coverageName;
                sb = sb + "&format=" + coverageFormat;
                sb = sb + "&width=" + tile.tileWidth;
                sb = sb + "&height=" + tile.tileHeight;

                sb = sb + "&crs=" + this.crs;
                sb = sb + "&bbox=";
                sb = sb + sector.minLongitude + "," + sector.minLatitude + ",";
                sb = sb + sector.maxLongitude + "," + sector.maxLatitude;

                // Global replace space
                sb = sb.replace(/\s/g, "%20");

                return sb;
            };

            /**
             * LevelRowColumnUrlBuilder.urlForTile
             * 
             * Fixes replace " " with %20 with a global replace.
             */
            WorldWind.LevelRowColumnUrlBuilder.prototype.urlForTile = function (tile, imageFormat) {
                if (!tile) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "WmsUrlBuilder", "urlForTile", "missingTile"));
                }

                if (!imageFormat) {
                    throw new ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "WmsUrlBuilder", "urlForTile",
                            "The image format is null or undefined."));
                }

                var sb = this.serverAddress;

                if (this.pathToData) {
                    sb = sb + "/" + this.pathToData;
                }

                sb = sb + "/" + tile.level.levelNumber.toString();
                sb = sb + "/" + tile.row.toString();
                sb = sb + "/" + tile.row.toString() + "_" + tile.column.toString();
                sb = sb + "." + WorldWind.WWUtil.suffixForMimeType(imageFormat);

                // Global replace space
                sb = sb.replace(/\s/g, "%20");
                return sb;
            };
            
            
            /**
             * NominatimGeocoder.lookup
             * 
             * Fixes replace " " with %20 via a global replace.
             */
            WorldWind.NominatimGeocoder.prototype.lookup = function (queryString, callback, accessKey) {
                var url = this.service + queryString.replace(/\s/g, "%20") + "?format=json",
                    xhr = new XMLHttpRequest(),
                    thisGeocoder = this;

                url += "&key=" + (accessKey || "lUvVRchXGGDh5Xwk3oidrXeIDAAevOUS");

                xhr.open("GET", url, true);

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        var results = JSON.parse(xhr.responseText);

                        callback(thisGeocoder, results);
                    }
                };

                xhr.send(null);
            };

        } // end if 0.9.0
    };

    /**
     * Applies fixes to the WorldWindow instance.
     * 
     * @param {WorldWind.WorldWindow} wwd
     */
    WorldWindFixes.applyWorldWindowFixes = function (wwd) {
        // Increase size to prevent thrashing tile cache at oblique view from the surface
        wwd.drawContext.surfaceShapeTileBuilder.tileCache.capacity = WorldWindFixes.TILE_CACHE_CAPACITY;
        wwd.drawContext.surfaceShapeTileBuilder.tileCache.lowWater = WorldWindFixes.TILE_CACHE_LOW_WATER;
    };

    return WorldWindFixes;
});