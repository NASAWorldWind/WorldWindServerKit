/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

define(['knockout'],
    function (ko) {
        "use strict";
        /**
         * The SelectController operates on picked objects containing the Selectable,
         * Movable, Openable and/or ContextSensitive capabilites.
         * @constructor
         * @param {WorldWindow} worldWindow
         * @returns {SelectController}
         */
        var SelectController = function (worldWindow) {
            var self = this;

            this.wwd = worldWindow;
            // Flag to signal that dragging/moving has been initiated.
            // When dragging, the mouse event is consumed, i.e., not propagated.
            this.isDragging = false;
            // Flag to signal if a touch tap has occurred.
            // Used to determine single or double tap.
            this.tapped = false;
            // The time in ms to wait for a double tap
            this.DOUBLE_TAP_INTERVAL = 250;
            // The currently selected item.
            this.lastSelectedItem = ko.observable(null);
            // The top item in the pick list
            this.pickedItem = null;
            // Caches the clicked item for dblclick to process 
            this.clickedItem = null;
            // The list of highlighted items
            this.highlightedItems = [];

            // Register listeners on the event target.
            function eventListener(event) {
                self.handlePick(event);
            }

            // Mirror WorldWind's behavior and use the PointerEvent interface if it's available.
            if (window.PointerEvent) {
                // If the WorldWind LookAtNavigator is using these events, then we must also in order
                // to consume these events to prevent pan/drag operations when dragging objects.
                this.wwd.addEventListener("pointerdown", eventListener);
                this.wwd.addEventListener("pointermove", eventListener);
                this.wwd.addEventListener("pointerup", eventListener);
                this.wwd.addEventListener("pointerout", eventListener);
            }
            // Listen for mouse
            this.wwd.addEventListener("mousedown", eventListener);  // Listen for mouse down to select an item
            this.wwd.addEventListener("mousemove", eventListener);  // Listen for mouse moves and tap gestures to move an item
            this.wwd.addEventListener("mouseup", eventListener);    // Listen for mouse up to release an item
            this.wwd.addEventListener("mouseout", eventListener);
            // Listen for touch
            this.wwd.addEventListener("touchstart", eventListener);
            this.wwd.addEventListener("touchmove", eventListener);
            this.wwd.addEventListener("touchend", eventListener);
            // Listen for mouse clicks
            this.wwd.addEventListener("click", eventListener);          // Listen for single clicks to select an item
            this.wwd.addEventListener("dblclick", eventListener);       // Listen for double clicks to open an item
            this.wwd.addEventListener("contextmenu", eventListener);    // Listen for right clicks to open menu

        };

        /**
         * Performs the pick apply the appropriate action on the selected item.
         * @param {Event or TapRecognizer} o The input argument is either an Event or a TapRecognizer. Both have the
         *  same properties for determining the mouse or tap location.
         */
        SelectController.prototype.handlePick = function (o) {
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var eventType,
                x, y,
                h, len,
                redrawRequired,
                pickList,
                button = o.button,
                isTouchDevice = false;

            // De-highlight any previously highlighted shapes.
            len = this.highlightedItems.length;
            redrawRequired = len > 0;
            for (h = 0; h < len; h++) {
                this.highlightedItems[h].highlighted = false;
            }
            this.highlightedItems = [];


            // Alias PointerEvent event types to mouse and touch event types
            if (o.type === "pointerdown" && o.pointerType === "mouse") {
                eventType = "mousedown";
            } else if (o.type === "pointermove" && o.pointerType === "mouse") {
                eventType = "mousemove";
            } else if (o.type === "pointerout" && o.pointerType === "mouse") {
                eventType = "mouseout";
            } else if (o.type === "pointerup" && o.pointerType === "mouse") {
                eventType = "mouseup";
            } else if (o.type === "pointerdown" && o.pointerType === "touch") {
                eventType = "touchstart";
            } else if (o.type === "pointermove" && o.pointerType === "touch") {
                eventType = "touchmove";
            } else if (o.type === "pointercancel" && o.pointerType === "touch") {
                eventType = "touchcancel";
            } else if (o.type === "pointerup" && o.pointerType === "touch") {
                eventType = "touchend";
            } else {
                eventType = o.type;
            }

            // Get our X,Y values from the event; 
            // determine if this is a touch device.
            if (eventType.substring(0, 5) === 'touch') {
                isTouchDevice = true;
                // Use the first touches entry
                // Note: x, y remain undefined for touchend
                if (o.touches && o.touches.length > 0) {
                    x = o.touches[0].clientX;
                    y = o.touches[0].clientY;
                } else {
                    x = o.clientX;
                    y = o.clientY;
                }
            } else {  // Mouse events...
                // Prevent handling of simulated mouse events on touch devices.
                if (isTouchDevice) {
                    return;
                }
                x = o.clientX;
                y = o.clientY;
            }


            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            pickList = this.wwd.pick(this.wwd.canvasCoordinates(x, y));

            switch (eventType) {
                case "mousedown":
                case "touchstart":
                    this.handleMouseDown(pickList, x, y);
                    break;
                case "mousemove":
                case "touchmove":
                    this.handleMouseMove(pickList, x, y, eventType, button);
                    break;
                case "mouseup":
                case "mouseout":
                case "touchend":
                case "touchcancel":
                    this.handleMouseUp(eventType);
                    break;
                case "click":
                    this.handleClick();
                    break;
                case "dblclick":
                    this.handleDoubleClick();
                    break;
                case "contextmenu":
                    this.handleContextMenu();
                    break;
            }
            // Prevent pan/drag operations on the globe when we're dragging an object.
            if (this.isDragging) {
                o.preventDefault();
            }
            // Update the window if we changed anything.
            if (redrawRequired) {
                this.wwd.redraw(); // redraw to make the highlighting changes take effect on the screen
            }
        };

        SelectController.prototype.handleMouseDown = function (pickList, x, y) {

            if (pickList.hasNonTerrainObjects()) {
                // Establish the picked item - may be used by
                // mouse, select, and open actions
                this.pickedItem = pickList.topPickedObject();
                if (this.pickedItem) {
                    // Capture the initial mouse/touch points for comparison in subsequent mousemove/touchmove
                    // events to determine if whether to initiate dragging of the picked item.
                    this.startX = x;
                    this.startY = y;
                }
            } else {
                this.pickedItem = null;
            }
        };

        SelectController.prototype.handleMouseMove = function (pickList, x, y, eventType, button) {
            var p, len,
                terrainObject;

            // Highlight the picked items by simply setting their highlight flag to true.
            len = pickList.objects.length;
            if (len > 0 && button === -1) {
                for (p = 0; p < len; p++) {
                    if (!pickList.objects[p].isTerrain) {
                        // Set the highlighted flag
                        pickList.objects[p].userObject.highlighted = true;
                        // Keep track of highlighted items in order to de-highlight them later.
                        this.highlightedItems.push(pickList.objects[p].userObject);
                    }
                }
            }
            // Move the selected item if left-button down or touch device
            if (this.pickedItem && (button === 0 || eventType === "touchmove")) {
                if (this.isMovable(this.pickedItem.userObject)) {
                    // To prevent confusion with clicks and taps,
                    // start dragging only if the mouse or touch
                    // point has moved a few pixels.
                    if (!this.isDragging &&
                        (Math.abs(this.startX - x) > 2 || Math.abs(this.startY - y) > 2)) {
                        this.isDragging = true;
                        this.startMove(this.pickedItem.userObject);
                    }
                    // Perform the actual move of the picked object
                    if (this.isDragging) {
                        // Get the new terrain coords at the pick point
                        terrainObject = pickList.terrainObject();
                        if (terrainObject) {
                            this.doMove(this.pickedItem.userObject, terrainObject);
                        }
                    }
                }
            }
        };

        SelectController.prototype.handleMouseUp = function (eventType) {
            var self = this;

            if (this.pickedItem) {
                // The end of a touch can signal either the end of a
                // drag/move operation or a tap/double-tap.
                // If our isDragging flag is set, then it"s a given
                // that the touch/mouse event signals a move finished.
                if (this.isDragging) {
                    this.finishMove(this.pickedItem.userObject);
                    this.pickedItem = null;
                } else if (eventType === "touchend") {
                    // Determine if touch event is a single tap or a double tap:
                    // Capture the first tap, and if another tap doesn"t come in
                    // within the alloted time, then perform single tap action.
                    if (!this.tapped) {
                        // Wait for another tap, if if doesn"t happen,
                        // then perform the select action
                        this.clickedItem = this.pickedItem;
                        this.tapped = setTimeout(function () {
                            self.tapped = null;
                            self.doSelect(self.clickedItem.userObject);
                        }, this.DOUBLE_TAP_INTERVAL);
                    } else {
                        // A double tap has occured. Clear the pending
                        // single tap action and perform the open action
                        clearTimeout(this.tapped);
                        this.tapped = null;
                        this.doOpen(this.pickedItem.userObject);
                    }
                    this.pickedItem = null;
                }
            }
            this.isDragging = false;
        };

        SelectController.prototype.handleClick = function () {
            // Remember the clicked item for dblclick processing
            this.clickedItem = this.pickedItem;
            if (this.clickedItem) {
                this.doClick(this.clickedItem.userObject);
                this.doSelect(this.clickedItem.userObject);
            }
            // Release the picked item so mousemove doesn"t act on it
            this.pickedItem = null;
        };

        SelectController.prototype.handleDoubleClick = function () {
            if (this.clickedItem) {
                this.doOpen(this.clickedItem.userObject);
            }
            // Release the picked item so mousemove doesn"t act on it
            this.pickedItem = null;
        };

        SelectController.prototype.handleContextMenu = function () {
            this.isDragging = false;
            if (this.pickedItem) {
                this.doContextSensitive(this.pickedItem.userObject);
                // Release the picked item so mousemove doesn't act on it
                this.pickedItem = null;
            }
        };


        SelectController.prototype.doContextSensitive = function (userObject) {
            if (ko.isObservable(userObject.isContextSensitive) && userObject.isContextSensitive()) {
                if (userObject.showContextMenu) {
                    userObject.showContextMenu();
                } else {
                    // Otherwise, build a context menu from standard capabilities
                    //              $('#globeContextMenu-popup').puimenu('show');
                }
            }
        };

        SelectController.prototype.isMovable = function (userObject) {
            if (ko.isObservable(userObject.isMovable)) {
                return userObject.isMovable();
            } else {
                return userObject.isMovable;
            }
        };

        SelectController.prototype.startMove = function (userObject) {
            if (userObject.moveStarted) {
                // Fires EVENT_OBJECT_MOVE_STARTED
                userObject.moveStarted();
            }
        };

        SelectController.prototype.doMove = function (userObject, terrainObject) {
            if (userObject.moveToLatLon) {
                // Fires EVENT_OBJECT_MOVED
                userObject.moveToLatLon(
                    terrainObject.position.latitude,
                    terrainObject.position.longitude);
            }
// Uncomment to allow ordinary renderables to be moved.                        
//                            // Or, move the object (a Renderable) if it has a position object
//                            else if (this.pickedItem.userObject.position) {
//                                this.pickedItem.userObject.position =
//                                    new WorldWind.Position(
//                                        terrainObject.position.latitude,
//                                        terrainObject.position.longitude,
//                                        this.pickedItem.userObject.position.elevation);
//                                redrawRequired = true;
//                            }
        };

        SelectController.prototype.finishMove = function (userObject) {
            // Test for a "Movable" capability    
            if (userObject.moveFinished) {
                // Fires EVENT_OBJECT_MOVE_FINISHED
                userObject.moveFinished();
            }
        };
               
        SelectController.prototype.doClick = function (userObject) {
            if (ko.isObservable(userObject.isClickable) && userObject.isClickable()) {
                if (userObject.click) {
                    userObject.click();
                }
            }
        };
        
        SelectController.prototype.doSelect = function (userObject) {
            if (ko.isObservable(userObject.isSelectable) && userObject.isSelectable()) {
                if (this.lastSelectedItem() === userObject) {
                    return;
                }
                if (this.lastSelectedItem() !== null) {
                    this.lastSelectedItem().select({selected: false});
                    this.lastSelectedItem(null);
                }
                if (userObject.select) {
                    userObject.select({selected: true});
                    this.lastSelectedItem(userObject);
                }
            }
        };

        SelectController.prototype.doDeselect = function (userObject) {
            if (this.lastSelectedItem() === userObject) {
                this.lastSelectedItem().select({selected: false});
                this.lastSelectedItem(null);
            }
        };

        SelectController.prototype.doOpen = function (userObject) {
            if (ko.isObservable(userObject.isOpenable) && userObject.isOpenable()) {
                if (userObject.open) {
                    userObject.open();
                }
            }
        };

        return SelectController;
    }
);