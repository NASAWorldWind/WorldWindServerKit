/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */

/* global WorldWind */

/**
 * This module is a copy of the WorldWind.AtmosphereProgram, modified to add support for transparency.
 * Search for occurancies of "opacity" to locate the addtions/modifications.
 * 
 * @exports EnhancedAtmosphereProgram
 */
define(['worldwind'],
    function () {
        "use strict";

        /**
         * Constructs a new program.
         * Initializes, compiles and links this GLSL program with the source code for its vertex and fragment shaders.
         * <p>
         * This method creates WebGL shaders for the program's shader sources and attaches them to a new GLSL program.
         * This method then compiles the shaders and then links the program if compilation is successful.
         *
         * @alias EnhancedAtmosphereProgram
         * @constructor
         * @augments AtmosphereProgram
         * @classdesc EnhancedAtmosphereProgram is a GLSL program that draws the atmosphere.
         * @param {WebGLRenderingContext} gl The current WebGL context.
         * @throws {ArgumentError} If the shaders cannot be compiled, or linking of
         * the compiled shaders into a program fails.
         */
        var EnhancedAtmosphereProgram = function (gl, vertexShaderSource, fragmentShaderSource, attribute) {

            // Call to the superclass, which performs shader program compiling and linking.
            WorldWind.AtmosphereProgram.call(this, gl, vertexShaderSource, fragmentShaderSource, attribute);

            /**
             * The WebGL location for this program's 'opacity' uniform.
             * @type {WebGLUniformLocation}
             * @readonly
             */
            this.opacityLocation = this.uniformLocation(gl, "opacity");

        };

        /**
         * A string that uniquely identifies this program.
         * @type {string}
         * @readonly
         */
        EnhancedAtmosphereProgram.key = "EnhancedGpuAtmosphereProgram";

        // Inherit from AtmoshpereProgram.
        EnhancedAtmosphereProgram.prototype = Object.create(WorldWind.AtmosphereProgram.prototype);

        /**
         * Loads the specified opacity as the value of this program's 'opacity' uniform variable.
         * @param {WebGLRenderingContext} gl The current WebGL context.
         * @param {Number} opacity The opacity value.
         */
        EnhancedAtmosphereProgram.prototype.loadOpacity = function (gl, opacity) {
            if (opacity === undefined) {
                throw new WorldWind.ArgumentError(
                    WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "EnhancedAtmosphereProgram", "loadOpacity",
                        "missingOpacity"));
            }
            gl.uniform1f(this.opacityLocation, opacity);
        };

        return EnhancedAtmosphereProgram;
    });