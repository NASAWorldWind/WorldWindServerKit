/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $ */

/**
 * The SkyBackgroundLayer renders a background for the globe that varies
 * between sky blue and dark blue based on altitude.
 * 
 * @param {WorldWind} WorldWind
 * @returns {SkyBackgroundLayer}
 * 
 * @author Bruce Schubert
 */
define([
    'model/Constants',
    'worldwind'],
    function (
        constants) {
        "use strict";
        /**
         * @constructor
         * @param {Globe} globe
         * @returns {SkyBackgroundLayer}
         */
        var SkyBackgroundLayer = function (globe) {
           
            // Inherits from the basic Layer 
            WorldWind.Layer.call(this, constants.LAYER_NAME_SKY);
            
            this.pickEnabled = false;
            
            // Store the WorldWindow canvas for doRender 
            this.globeCanvas = $(globe.wwd.canvas);
            
            this.MIN_ALT = 100000;
            this.MAX_ALT = 1500000;
            this.SKY_LIGHTNESS_FAR = 25;    // Dark Blue
            this.SKY_LIGHTNESS_NEAR = 70;   // Sky Blue
            this.SKY_HUE = 205;             // Sky Blue
            this.SKY_SATURATION = 47;       // Sky Blue
            
        };
        SkyBackgroundLayer.prototype = Object.create(WorldWind.Layer.prototype);

        /**
         * Sets the background color of the canvas based on the eye position.
         * @param {DrawContext} dc
         */
        SkyBackgroundLayer.prototype.doRender = function (dc) {
            var eyePosition = dc.eyePosition;
            if (!eyePosition) {
                return;
            }
            this.globeCanvas.css('background-color', this.getCSSHSL(this.skyColor(eyePosition.altitude)));
        };

        /**
         * Gets the sky color base on the altitude.
         * @param {Number} altitude Eye position altitude in meters.
         * @returns {Object} HSV Sky color.
         */
        SkyBackgroundLayer.prototype.skyColor = function (altitude) {
            var range = this.MAX_ALT - this.MIN_ALT,
                value = Math.min(Math.max(altitude, this.MIN_ALT), this.MAX_ALT),
                lightness = this.interpolate(this.SKY_LIGHTNESS_NEAR, this.SKY_LIGHTNESS_FAR, range, value);
            
            return {h: this.SKY_HUE, s: this.SKY_SATURATION, l: lightness};
        };


        /**
         * Returns an interpolated value between start and end, based on a count between a number of steps.
         * @param {Number} start Value at lower end of range (steps)
         * @param {Number} end value at upper end of range
         * @param {Number} steps Range 
         * @param {Number} count Value
         * @returns {Number}
         */
        SkyBackgroundLayer.prototype.interpolate = function (start, end, steps, count) {
            var s = start,
                e = end,
                final = s + (((e - s) / steps) * count);
            return Math.floor(final);
        };

        /**
         * Gets a CSS hsl string from a HSL color
         * @param {Object} hsl HSL color object
         * @returns {String} CSS HSL string
         */
        SkyBackgroundLayer.prototype.getCSSHSL = function (hsl) {
            // return the CSS HSL colour value
            return 'hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)';
        };

        return SkyBackgroundLayer;
    }
);
