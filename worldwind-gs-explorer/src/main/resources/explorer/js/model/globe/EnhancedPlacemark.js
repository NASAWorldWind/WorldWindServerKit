/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WebGLRenderingContext, WorldWind */

define(['worldwind'],
    function (ww) {
        "use strict";

        var EnhancedPlacemark = function (position, eyeDistanceScaling) {

            WorldWind.Placemark.call(this, position, eyeDistanceScaling);

            this.imageRotation = 0;
            this.imageTilt = 0;

        };
        EnhancedPlacemark.prototype = Object.create(WorldWind.Placemark.prototype);

        /**
         * Copies the contents of a specified placemark to this placemark.
         * @param {EnhancedPlacemark} that The placemark to copy.
         */
        EnhancedPlacemark.prototype.copy = function (that) {

            // Delegate to the super function
            WorldWind.Placemark.prototype.copy.call(this, that);

            // Add imageRotation and imageTilt properties
            this.imageRotation = that.imageRotation;
            this.imageTilt = that.imageTilt;

            return this;
        };

        /**
         * Creates a new placemark that is a copy of this placemark.
         * @returns {EnhancedPlacemark} The new placemark.
         */
        EnhancedPlacemark.prototype.clone = function () {
            var clone = new EnhancedPlacemark(this.position);

            clone.copy(this);
            clone.pickDelegate = this.pickDelegate || this;

            return clone;
        };


        ////////////////////////////////////////////
        // BDS: Modified. Added imageRotation
        ///////////////////////////////////////////
        EnhancedPlacemark.prototype.doDrawOrderedPlacemark = function (dc) {
            var gl = dc.currentGlContext,
                program = dc.currentProgram,
                depthTest = true,
                textureBound;

            if (dc.pickingMode) {
                this.pickColor = dc.uniquePickColor();
            }

            if (this.eyeDistanceScaling && (this.eyeDistance > this.eyeDistanceScalingLabelThreshold)) {
                // Target visibility is set to 0 to cause the label to be faded in or out. Nothing else
                // here uses target visibility.
                this.targetVisibility = 0;
            }

            // Compute the effective visibility. Use the current value if picking.
            if (!dc.pickingMode && this.mustDrawLabel()) {
                if (this.currentVisibility != this.targetVisibility) {
                    var visibilityDelta = (dc.timestamp - dc.previousTimestamp) / dc.fadeTime;
                    if (this.currentVisibility < this.targetVisibility) {
                        this.currentVisibility = Math.min(1, this.currentVisibility + visibilityDelta);
                    } else {
                        this.currentVisibility = Math.max(0, this.currentVisibility - visibilityDelta);
                    }
                    dc.redrawRequested = true;
                }
            }

            program.loadOpacity(gl, dc.pickingMode ? 1 : this.layer.opacity);

            // Draw the leader line first so that the image and label have visual priority.
            if (this.mustDrawLeaderLine(dc)) {
                if (!this.leaderLinePoints) {
                    this.leaderLinePoints = new WorldWind.Float32Array(6);
                }

                this.leaderLinePoints[0] = this.groundPoint[0]; // computed during makeOrderedRenderable
                this.leaderLinePoints[1] = this.groundPoint[1];
                this.leaderLinePoints[2] = this.groundPoint[2];
                this.leaderLinePoints[3] = this.placePoint[0]; // computed during makeOrderedRenderable
                this.leaderLinePoints[4] = this.placePoint[1];
                this.leaderLinePoints[5] = this.placePoint[2];

                if (!this.leaderLineCacheKey) {
                    this.leaderLineCacheKey = dc.gpuResourceCache.generateCacheKey();
                }

                var leaderLineVboId = dc.gpuResourceCache.resourceForKey(this.leaderLineCacheKey);
                if (!leaderLineVboId) {
                    leaderLineVboId = gl.createBuffer();
                    dc.gpuResourceCache.putResource(this.leaderLineCacheKey, leaderLineVboId,
                        this.leaderLinePoints.length * 4);
                }

                program.loadTextureEnabled(gl, false);
                program.loadColor(gl, dc.pickingMode ? this.pickColor :
                    this.activeAttributes.leaderLineAttributes.outlineColor);

                WorldWind.Placemark.matrix.copy(dc.navigatorState.modelviewProjection);
                program.loadModelviewProjection(gl, WorldWind.Placemark.matrix);

                if (!this.activeAttributes.leaderLineAttributes.depthTest) {
                    gl.disable(WebGLRenderingContext.DEPTH_TEST);
                }

                gl.lineWidth(this.activeAttributes.leaderLineAttributes.outlineWidth);

                gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, leaderLineVboId);
                gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, this.leaderLinePoints, WebGLRenderingContext.STATIC_DRAW);
                dc.frameStatistics.incrementVboLoadCount(1);
                gl.vertexAttribPointer(program.vertexPointLocation, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                gl.drawArrays(WebGLRenderingContext.LINES, 0, 2);
            }

            // Turn off depth testing for the placemark image if requested. The placemark label and leader line have
            // their own depth-test controls.
            if (!this.activeAttributes.depthTest) {
                depthTest = false;
                gl.disable(WebGLRenderingContext.DEPTH_TEST);
            }

            // Suppress frame buffer writes for the placemark image and its label.
            // tag, 6/17/15: It's not clear why this call was here. It was carried over from WWJ.
            //gl.depthMask(false);

            gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, dc.unitQuadBuffer3());
            gl.vertexAttribPointer(program.vertexPointLocation, 3, WebGLRenderingContext.FLOAT, false, 0, 0);

            // Compute and specify the MVP matrix.
            WorldWind.Placemark.matrix.copy(dc.screenProjection);
            WorldWind.Placemark.matrix.multiplyMatrix(this.imageTransform);

            ///////////////////////////////////////////////////
            // BDS: Added this block (template from ScreenImage)
            ///////////////////////////////////////////////////
            if (this.imageRotation !== 0 || this.imageTilt !== 0) {
                WorldWind.Placemark.matrix.multiplyByTranslation(0.5, 0.5, -0.5);
                WorldWind.Placemark.matrix.multiplyByRotation(1, 0, 0, this.imageTilt);
                WorldWind.Placemark.matrix.multiplyByRotation(0, 0, 1, this.imageRotation);
                WorldWind.Placemark.matrix.multiplyByTranslation(-0.5, -0.5, 0);
            }
            ///////////////////////////////////////////////////
            // BDS: End modification 
            ///////////////////////////////////////////////////

            program.loadModelviewProjection(gl, WorldWind.Placemark.matrix);

            // Enable texture for both normal display and for picking. If picking is enabled in the shader (set in
            // beginDrawing() above) then the texture's alpha component is still needed in order to modulate the
            // pick color to mask off transparent pixels.
            program.loadTextureEnabled(gl, true);

            if (dc.pickingMode) {
                program.loadColor(gl, this.pickColor);
            } else {
                program.loadColor(gl, this.activeAttributes.imageColor);
            }

            this.texCoordMatrix.setToIdentity();
            if (this.activeTexture) {
                this.texCoordMatrix.multiplyByTextureTransform(this.activeTexture);
            }
            program.loadTextureMatrix(gl, this.texCoordMatrix);

            if (this.activeTexture) {
                textureBound = this.activeTexture.bind(dc); // returns false if active texture is null or cannot be bound
                program.loadTextureEnabled(gl, textureBound);
            } else {
                program.loadTextureEnabled(gl, false);
            }

            // Draw the placemark's image quad.
            gl.drawArrays(WebGLRenderingContext.TRIANGLE_STRIP, 0, 4);

            if (this.mustDrawLabel() && this.currentVisibility > 0) {
                program.loadOpacity(gl, dc.pickingMode ? 1 : this.layer.opacity * this.currentVisibility);

                WorldWind.Placemark.matrix.copy(dc.screenProjection);
                WorldWind.Placemark.matrix.multiplyMatrix(this.labelTransform);
                program.loadModelviewProjection(gl, WorldWind.Placemark.matrix);

                if (!dc.pickingMode && this.labelTexture) {
                    this.texCoordMatrix.setToIdentity();
                    this.texCoordMatrix.multiplyByTextureTransform(this.labelTexture);

                    program.loadTextureMatrix(gl, this.texCoordMatrix);
                    program.loadColor(gl, this.activeAttributes.labelAttributes.color);

                    textureBound = this.labelTexture.bind(dc);
                    program.loadTextureEnabled(gl, textureBound);
                } else {
                    program.loadTextureEnabled(gl, false);
                    program.loadColor(gl, this.pickColor);
                }

                if (this.activeAttributes.labelAttributes.depthTest) {
                    if (!depthTest) {
                        depthTest = true;
                        gl.enable(WebGLRenderingContext.DEPTH_TEST);
                    }
                } else {
                    depthTest = false;
                    gl.disable(WebGLRenderingContext.DEPTH_TEST);
                }

                gl.drawArrays(WebGLRenderingContext.TRIANGLE_STRIP, 0, 4);
            }

            if (!depthTest) {
                gl.enable(WebGLRenderingContext.DEPTH_TEST);
            }

            // tag, 6/17/15: See note on depthMask above in this function.
            //gl.depthMask(true);
        };


        return EnhancedPlacemark;
    });