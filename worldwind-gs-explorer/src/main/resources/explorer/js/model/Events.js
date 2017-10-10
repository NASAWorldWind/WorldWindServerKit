/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */
define([],
    function () {
        "use strict";
        var Events = {
            EVENT_MARKER_ADDED: "markerAdded",
            EVENT_MARKER_CHANGED: "markerChanged",
            EVENT_MARKER_REMOVED: "markerRemoved",
            /**
             * Publish/subscibe event name for notification of mouse position on the globe.
             * @constant
             */
            EVENT_MOUSE_MOVED: "mouseMoved",
            EVENT_OBJECT_OPENED: "objectOpened",
            EVENT_OBJECT_CHANGED: "objectChanged",
            EVENT_OBJECT_MOVE_STARTED: "objectMoveStarted",
            EVENT_OBJECT_MOVED: "objectMoved",
            EVENT_OBJECT_MOVE_FINISHED: "objectMoveFinished",
            EVENT_OBJECT_REMOVED: "objectRemoved",
            EVENT_OBJECT_SELECTED: "objectSelected",
            EVENT_PLACE_CHANGED: "placeChanged",
            /**
             * Publish/subscibe event name for notifcation of changes in the sunlight.
             * @constant
             */
            EVENT_SUNLIGHT_CHANGED: "sunlightChanged",
            EVENT_SURFACEFUEL_CHANGED: "surfaceFuelChanged",
            EVENT_SURFACEFIRE_CHANGED: "surfaceFireChanged",
            EVENT_TERRAIN_CHANGED: "terrainChanged",
            /**
             * Publish/subscibe event name for notifcation of changes in the application time.
             * @constant
             */
            EVENT_TIME_CHANGED: "timeChanged",
            /**
             * Publish/subscribe event name for notification of changes in the globe viewpoint.
             * @constant
             */
            EVENT_VIEWPOINT_CHANGED: "viewpointChanged"
        };

        return Events;
    }
);