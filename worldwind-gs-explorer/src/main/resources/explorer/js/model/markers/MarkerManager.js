/*
 * The MIT License
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout',
    'model/Constants',
    'model/markers/BasicMarker',
    'worldwind'],
    function (ko,
        constants,
        BasicMarker,
        ww) {

        "use strict";
        /**
         * Constructs a MarkerManager that manages a collection of BasicMarkers.
         * @param {Globe} globe
         * @param {RenderableLayer} layer Optional.
         * @constructor
         */
        var MarkerManager = function (globe, layer) {
            var self = this;
            this.globe = globe;
            this.layer = layer || globe.findLayer(constants.LAYER_NAME_MARKERS);
            this.markers = ko.observableArray();
            this.markerCount = ko.observable(0);

            // Subscribe to "arrayChange" events ...
            // documented here: http://blog.stevensanderson.com/2013/10/08/knockout-3-0-release-candidate-available/
            this.markers.subscribe(function (changes) {
                changes.forEach(function (change) {
                    if (change.status === 'added' && change.moved === undefined) {
                        // Ensure the name is unique by appending a suffix if reqd.
                        // (but not if the array reordered -- i.e., moved items)
                        self.doEnsureUniqueName(change.value);
                        self.doAddMarkerToLayer(change.value);
                    } else if (change.status === 'deleted' && change.moved === undefined) {
                        // When a marker is removed we must remove the placemark,
                        // (but not if the array reordered -- i.e., moved items)
                        self.doRemoveMarkerFromLayer(change.value);
                    }
                });
                self.markerCount(self.markers().length);
            }, null, "arrayChange");

            /**
             * Adds a BasicMarker to this manager.
             * @param {BasicMarker} marker The marker to be managed.
             */
            this.addMarker = function (marker) {
                self.markers.push(marker);  // observable
            };

            /**
             * Centers the globe on the given scout.
             * @param {BasicMarker} marker
             */
            this.gotoMarker = function (marker) {
                self.globe.goto(marker.latitude(), marker.longitude());
            };

            /**
             * Finds the marker with the given id.
             * @param {String} id System assigned id for the marker.
             * @returns {MarkerNode} The marker object if found, else null.
             */
            this.findMarker = function (id) {
                var marker, i, len;
                for (i = 0, len = self.markers.length(); i < len; i += 1) {
                    marker = self.markers()[i];
                    if (marker.id === id) {
                        return marker;
                    }
                }
                return null;
            };

            /**
             * Removes the given marker from the markers array and from the marker's renderable layer.
             * @param {BasicMarker} marker The marker to be removed
             */
            this.removeMarker = function (marker) {
                self.markers.remove(marker);
            };

            // Internal method to ensure the name is unique by appending a suffix if reqd.
            this.doEnsureUniqueName = function (marker) {
                marker.name(self.generateUniqueName(marker));
            };

            // Internal method to remove the placemark from its layer.
            this.doAddMarkerToLayer = function (marker) {
                self.layer.addRenderable(marker.placemark);
            };

            // Internal method to remove the placemark from its layer.
            this.doRemoveMarkerFromLayer = function (marker) {
                var i, max, placemark = marker.placemark;
                // Remove the placemark from the renderable layer
                for (i = 0, max = self.layer.renderables.length; i < max; i++) {
                    if (self.layer.renderables[i] === placemark) {
                        self.layer.renderables.splice(i, 1);
                        break;
                    }
                }
                self.globe.selectController.doDeselect(marker);
            };

            /**
             * Saves the markers list to local storage.
             */
            this.saveMarkers = function () {
                var validMarkers = [],
                    markersString,
                    i, len, marker;

                // Knockout's toJSON can fail on complex objects... it appears
                // to recurse and a call stack limit can be reached. So here we
                // create a simplfied version of the object here to pass to toJSON.
                for (var i = 0, len = self.markers().length; i < len; i++) {
                    marker = self.markers()[i];
                    if (!marker.invalid) {
                        validMarkers.push({
                            id: marker.id,
                            name: marker.name,
                            source: marker.source,
                            latitude: marker.latitude,
                            longitude: marker.longitude,
                            isMovable: marker.isMovable
                        });
                    }
                }
                markersString = ko.toJSON(validMarkers, ['id', 'name', 'source', 'latitude', 'longitude', 'isMovable']);
                localStorage.setItem(constants.STORAGE_KEY_MARKERS, markersString);
            };

            /**
             * Restores the markers list from local storage.
             */
            this.restoreMarkers = function () {
                var string = localStorage.getItem(constants.STORAGE_KEY_MARKERS),
                    array, max, i,
                    position, params;

                // Convert JSON array to array of objects
                array = JSON.parse(string);
                if (array && array.length !== 0) {
                    for (i = 0, max = array.length; i < max; i++) {
                        position = new WorldWind.Position(array[i].latitude, array[i].longitude, 0);
                        params = {id: array[i].id, name: array[i].name, imageSource: array[i].source, isMovable: array[i].isMovable};

                        self.addMarker(new BasicMarker(self, position, params));
                    }
                }
            };


            /**
             * Generates a unique name by appending a suffix '(n)'.
             * @param {BasicMarker} marker
             * @returns {String}
             */
            this.generateUniqueName = function (marker) {
                var uniqueName = marker.name().trim(),
                    otherMarker,
                    isUnique,
                    suffixes,
                    seqNos,
                    n, i, len;

                // Loop while name not unique
                do {
                    // Assume uniqueness, set to false if we find a matching name
                    isUnique = true;

                    // Test the name for uniqueness with the other markers
                    for (i = 0, len = self.markers().length; i < len; i += 1) {
                        otherMarker = self.markers()[i];
                        if (otherMarker === marker) {
                            continue; // Don't test with self
                        }
                        if (otherMarker.name() === uniqueName) {
                            isUnique = false;

                            // check for existing suffix '(n)' and increment
                            suffixes = uniqueName.match(/[(]\d+[)]$/);
                            if (suffixes) {
                                // increment an existing suffix's sequence number
                                seqNos = suffixes[0].match(/\d+/);
                                n = parseInt(seqNos[0], 10) + 1;
                                uniqueName = uniqueName.replace(/[(]\d+[)]$/, '(' + n + ')');
                            } else {
                                // else if no suffix, create one
                                uniqueName += ' (2)';   // The first duplicate is #2
                            }
                            // Break out of the for loop and recheck uniqueness
                            break;
                        }
                    }
                } while (!isUnique);

                return uniqueName;
            };

        };

        return MarkerManager;
    }
);

