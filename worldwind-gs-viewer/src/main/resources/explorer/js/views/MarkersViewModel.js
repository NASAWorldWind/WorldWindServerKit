/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'model/Constants'],
        function (ko, constants) {
            "use strict";
            /**
             *
             * @param {Globe} globe
             * @param {MarkerManager} markerManager
             * @constructor
             */
            function MarkersViewModel(globe, markerManager) {
                var self = this,
                        wwd = globe.wwd;

                self.markersLayer = globe.findLayer(constants.LAYER_NAME_MARKERS);
                self.markers = markerManager.markers;   // observable array

                /** "Goto" function centers the globe on a selected marker */
                self.gotoMarker = function (marker) {
                    globe.goto(marker.latitude(), marker.longitude());
                };

                /** "Edit" function invokes a modal dialog to edit the marker attributes */
                self.editMarker = function (marker) {
                    if (marker.isOpenable()) {
                        globe.selectController.doSelect(marker);
                        marker.open();
                    }
                };
                
                /** "Remove" function removes a marker from the globe */
                self.removeMarker = function (marker) {
                    if (marker.isRemovable()) {
                        marker.remove();
                    }
                };

            }

            return MarkersViewModel;
        }
);