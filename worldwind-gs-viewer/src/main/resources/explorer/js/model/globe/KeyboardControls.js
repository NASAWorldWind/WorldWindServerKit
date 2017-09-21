/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */


/**
 * The KeyboardControls module provides keyboard controls for the globe.
 * 
 * @param {Log} Log
 * @returns {KeyboardControls}
 * 
 * @@author Bruce Schubert
 */
define([
    'model/util/Log',
    'worldwind'],
    function (
        Log,
        ww) {
        "use strict";
        /**
         * Creates a KeyboardController that dispatches keystrokes from the 
         * WorldWind.WorldWindow to the Wmt.Controller.
         * @param {Globe} globe The keyboard event generator.
         * @returns {KeyboardControls}
         */
        var KeyboardControls = function (globe) {
            this.globe = globe;
            this.wwd = globe.wwd;

            // This event initialization is wrapped in a document ready function.
            // Note: the canvas must be focusable; this can be accomplished
            // by establishing the "tabindex" on the canvas element.
            var self = this;
            $(function () {
                var $canvas = $(globe.wwd.canvas);
                $canvas.keydown(function (event) {
                    self.handleKeyDown(event);
                });
                $canvas.keyup(function (event) {
                    self.handleKeyUp(event);
                });
            });
            /**
             * The incremental amount to increase or decrease the eye distance (for zoom) each cycle.
             * @type {Number}
             */
            this.zoomIncrement = 0.01;

            /**
             * The scale factor governing the pan speed. Increased values cause faster panning.
             * @type {Number}
             */
            this.panIncrement = 0.0000000005;

        };

        /**
         * Controls the globe with the keyboard.
         * @param {KeyboardEvent} event
         */
        KeyboardControls.prototype.handleKeyDown = function (event) {
            Log.info('KeyboardControls', 'handleKeyDown', event.keyCode + ' pressed.');
            Log.info('KeyboardControls', 'handleKeyDown', "Target: " + event.target);
            
            // TODO: find a way to make this code portable for different keyboard layouts
            if (event.keyCode === 187 || event.keyCode === 61) {        // + key || +/= key
                this.handleZoom("zoomIn");
            }
            else if (event.keyCode === 189 || event.keyCode === 173) {  // - key || _/- key
                this.handleZoom("zoomOut");
            }
            else if (event.keyCode === 37) {    // Left arrow
                this.handlePan("panLeft");
            }
            else if (event.keyCode === 38) {    // Up arrow
                this.handlePan("panUp");
            }
            else if (event.keyCode === 39) {    // Right arrow
                this.handlePan("panRight");
            }
            else if (event.keyCode === 40) {    // Down arrow
                this.handlePan("panDown");
            }
            else if (event.keyCode === 78) {    // N key
                this.resetHeading();
            }
            else if (event.keyCode === 82) {    // R key
                this.resetHeadingAndTilt();
            }
        };

        /**
         * Reset the view to North up.
         */
        KeyboardControls.prototype.resetHeading = function () {
            this.globe.resetHeading();
        };

        /**
         * Reset the view to North up and nadir.
         */
        KeyboardControls.prototype.resetHeadingAndTilt = function () {
            //this.ctrl.resetHeadingAndTilt();
        };

        /**
         * 
         * @param {KeyupEvent} event
         */
        KeyboardControls.prototype.handleKeyUp = function (event) {
            if (this.activeOperation) {
                this.activeOperation = null;
                event.preventDefault();
            }
        };

        /**
         * 
         * @param {type} operation
         */
        KeyboardControls.prototype.handleZoom = function (operation) {
            this.activeOperation = this.handleZoom;

            // This function is called by the timer to perform the operation.
            var self = this, // capture 'this' for use in the function
                setRange = function () {
                    if (self.activeOperation) {
                        if (operation === "zoomIn") {
                            self.wwd.navigator.range *= (1 - self.zoomIncrement);
                        } else if (operation === "zoomOut") {
                            self.wwd.navigator.range *= (1 + self.zoomIncrement);
                        }
                        self.wwd.redraw();
                        setTimeout(setRange, 50);
                    }
                };
            setTimeout(setRange, 50);
            event.preventDefault();

        };

        /**
         * 
         * @param {String} operation
         */
        KeyboardControls.prototype.handlePan = function (operation) {
            this.activeOperation = this.handlePan;

            // This function is called by the timer to perform the operation.
            var self = this, // capture 'this' for use in the function
                setLookAtLocation = function () {
                    if (self.activeOperation) {
                        var heading = self.wwd.navigator.heading,
                            distance = self.panIncrement * self.wwd.navigator.range;

                        switch (operation) {
                            case 'panUp' :
                                break;
                            case 'panDown' :
                                heading -= 180;
                                break;
                            case 'panLeft' :
                                heading -= 90;
                                break;
                            case 'panRight' :
                                heading += 90;
                                break;
                        }
                        // Update the navigator's lookAtLocation
                        WorldWind.Location.greatCircleLocation(
                            self.wwd.navigator.lookAtLocation,
                            heading,
                            distance,
                            self.wwd.navigator.lookAtLocation);
                        self.wwd.redraw();
                        setTimeout(setLookAtLocation, 50);
                    }
                };
            setTimeout(setLookAtLocation, 50);
            event.preventDefault();
        };


        return KeyboardControls;
    }
);