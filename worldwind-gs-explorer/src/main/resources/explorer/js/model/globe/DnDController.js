/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $ */

define([
    'worldwind'],
    function (
        ww) {
        "use strict";
        /**
         * @constructor
         * @param {WorldWindow} worldWindow
         * @returns {DnDController}
         */
        var DnDController = function (worldWindow) {
            this.wwd = worldWindow;

            this.isArmed = false;

            var self = this,
                clickRecognizer;

            this.wwd.addEventListener("click", function (event) {
                self.handleDrop(event);
            });
            this.wwd.addEventListener("touchend", function (event) {
                self.handleDrop(event);
            });

            // Listen for tap gestures on mobile devices
//            clickRecognizer = new WorldWind.ClickRecognizer(this.wwd);
//            clickRecognizer.addGestureListener(function (event) {
//                self.handleDrop(event);
//            });

        };

        /**
         * Initiates the DnD operation.  The operation is completed by handleDrop.
         * 
         * @param {Object} dropObject The object who's latitude and longitude properties 
         * will be added or updated with the drop location.
         * @param {type} dropCallback The function what will be called after the drop with updated dropObject.
         */
        DnDController.prototype.armDrop = function (dropObject, dropCallback) {
            this.dropObject = dropObject;
            this.dropCallback = dropCallback;

            this.isArmed = true;
            $(this.wwd.canvas).css('cursor', 'crosshair'); // This should be a function of a Globe object
        };

        /**
         * Handles a mouse click event by dropping the object supplied to the "armDrop" at the terrain pick point.
         * The "drop" action is comprised of setting the latitude and longitude properties of the supplied object,
         * and then calling the supplied callback method, passing the updated drop object to the function.
         * @param {type} event
         */
        DnDController.prototype.handleDrop = function (event) {
            if (!this.isArmed) {
                return;
            }
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var type = event.type,
                x,
                y,
                pickList,
                terrainObject;

            switch (type) {
                case 'click':
                    x = event.clientX;
                    y = event.clientY;
                    break;
                case 'touchend':
                    if (!event.changedTouches[0]) {
                        return;
                    }
                    x = event.changedTouches[0].clientX;
                    y = event.changedTouches[0].clientY;
                    break;
            }
            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            pickList = this.wwd.pickTerrain(this.wwd.canvasCoordinates(x, y));
            terrainObject = pickList.terrainObject();
            if (terrainObject) {
                // Update the drop object with new position
                this.dropObject.latitude = terrainObject.position.latitude;
                this.dropObject.longitude = terrainObject.position.longitude;
                
                // Cleanup and consume this event
                $(this.wwd.canvas).css('cursor', 'pointer');
                this.isArmed = false;
                event.stopImmediatePropagation();
                
                // Transfer control to the callback function with the udpated drop object
                this.dropCallback(this.dropObject);
            }
        };

        return DnDController;
    }
);