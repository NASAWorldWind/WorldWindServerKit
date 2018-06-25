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
define([
    'model/Constants',
    'model/shaders/EnhancedGroundProgram',
    'worldwind'],
        function (constants,
                EnhancedGroundProgram) {
            "use strict";
            /**
             * Constructs an atmosphere layer.
             * @param {Globe}  globe
             * @param {String}  url
             * @constructor
             */
            var EnhancedAtmosphereLayer = function (globe, url) {
                var self = this;
                // Call to the superclass.
                WorldWind.AtmosphereLayer.call(this, url);

                /**
                 * The default name of this layer.
                 */
                this.displayName = constants.LAYER_NAME_ATMOSPHERE;

                /**
                 * The default opacity of the night image.
                 */
                this.opacity = 0.7;

                /**
                 * Flag to determine if nighttime should be rendered.
                 */
                this.nightEnabled = false;

                // Update the star and sun location based on the Globe's current time
                globe.dateTime.subscribe(function (newDateTime) {
                    if (self.nightEnabled) {
                        self.time = newDateTime;
                    } else {
                        // If night is disabled, then the default location of 
                        // sun will be the camera/eye point
                        self.time = null;
                    }
                });
            };

            // Inherit the AtmosphereLayer methods
            EnhancedAtmosphereLayer.prototype = Object.create(WorldWind.AtmosphereLayer.prototype);

            /**
             * Override drawGround to use an EnhancedGroundProgram shader that provides transparency
             * for the night layer.
             * @param {DrawContext} dc
             */
            EnhancedAtmosphereLayer.prototype.drawGround = function (dc) {
                var gl = dc.currentGlContext,
                        terrain = dc.terrain,
                        program,
                        textureBound;

                program = dc.findAndBindProgram(EnhancedGroundProgram);

                program.loadGlobeRadius(gl, dc.globe.equatorialRadius);

                program.loadEyePoint(gl, dc.navigatorState.eyePoint);

                program.loadLightDirection(gl, this._activeLightDirection);

                // BDS: opacity is a property of the custom EnhancedGroundProgram
                program.loadOpacity(gl, this.opacity);

                program.setScale(gl);

                // Use this layer's night image when the layer has time value defined
                if (this.nightImageSource && (this.time !== null)) {

                    this._activeTexture = dc.gpuResourceCache.resourceForKey(this.nightImageSource);

                    if (!this._activeTexture) {
                        this._activeTexture = dc.gpuResourceCache.retrieveTexture(gl, this.nightImageSource);
                    }

                    textureBound = this._activeTexture && this._activeTexture.bind(dc);
                }

                terrain.beginRendering(dc);

                for (var idx = 0, len = terrain.surfaceGeometry.length; idx < len; idx++) {
                    var currentTile = terrain.surfaceGeometry[idx];

                    // Use the vertex origin for the terrain tile.
                    var terrainOrigin = currentTile.referencePoint;
                    program.loadVertexOrigin(gl, terrainOrigin);

                    // Use a tex coord matrix that registers the night texture correctly on each terrain.
                    if (textureBound) {
                        this._texMatrix.setToUnitYFlip();
                        this._texMatrix.multiplyByTileTransform(currentTile.sector, this._fullSphereSector);
                        program.loadTexMatrix(gl, this._texMatrix);
                    }

                    terrain.beginRenderingTile(dc, currentTile);

                    // Draw the tile, multiplying the current fragment color by the program's secondary color.
                    program.loadFragMode(gl, program.FRAGMODE_GROUND_SECONDARY);
                    gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                    terrain.renderTile(dc, currentTile);

                    // Draw the terrain as triangles, adding the current fragment color to the program's primary color.
                    var fragMode = textureBound ?
                            program.FRAGMODE_GROUND_PRIMARY_TEX_BLEND : program.FRAGMODE_GROUND_PRIMARY;
                    program.loadFragMode(gl, fragMode);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    terrain.renderTile(dc, currentTile);

                    terrain.endRenderingTile(dc, currentTile);
                }

                // Restore the default WorldWind OpenGL state.
                terrain.endRendering(dc);
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

                // Clear references to Gpu resources.
                this._activeTexture = null;
            };

            return EnhancedAtmosphereLayer;
        }
);