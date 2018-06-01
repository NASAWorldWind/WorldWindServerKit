/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

define([
    'knockout',
    'jquery',
    'jquery-growl',
    'model/Constants',
    'model/util/ContextSensitive',
    'model/Events',
    'model/util/Formatter',
    'model/util/Openable',
    'model/util/Log',
    'model/util/Movable',
    'model/services/PlaceService',
    'model/util/Removable',
    'model/util/Selectable',
    'model/util/WmtUtil',
    'worldwind'],
        function (ko,
                $,
                growl,
                constants,
                contextSensitive,
                events,
                formatter,
                openable,
                log,
                movable,
                placeService,
                removable,
                selectable,
                util) {
            "use strict";

            /**
             * Constructs a BasicMarker wrapper around a Placemark and Layer.
             * @param {MarkerManager} manager
             * @param {Position} position
             * @param {Object} params Parameters object containing:
             * {    
             *      id: optional, must be unique, will be assigned if missing
             *      name: optional, will be assigned if missing
             *      isMovable: optional, will be set to true if missing
             *      editor: 
             *  }
             * @constructor
             */
            var BasicMarker = function (manager, position, params) {
                var self = this,
                        args = params || {},
                        normalAttributes, highlightAttributes, placemark;

                // TODO: assert validitiy of method arguments

                // Add the mix-in capabilites:

                // Make movable by the PickController: adds the isMovable, latitude and longitude
                // observables. The MarkerManager toggles the isMovable state when a marker is selected.
                movable.makeMovable(this);

                // Make selectable via picking (see PickController): adds the "select" method
                selectable.makeSelectable(this, function (params) {   // define the callback that selects this marker
                    this.isMovable(params.selected);
                    this.placemark.highlighted = params.selected;
                    return true;    // return true to fire a EVENT_OBJECT_SELECTED event
                });
                
                // Make openable via menus: adds the isOpenable member and the "open" method
                openable.makeOpenable(this, function () {   // define the callback that "opens" this marker
                    // TODO: get the marker editor ID from parameters
                    // TODO: add error checking for existance of editor
                    // TOOD: set openable false if no editor element defined in options/params
                    var $editor = $("#marker-editor"),
                        markerEditor = ko.dataFor($editor.get(0));
                    markerEditor.open(this);
                    return true; // return true to fire EVENT_OBJECT_OPENED event.
                });

                // Make deletable via menu: adds the isRemovable member and the "remove" method
                removable.makeRemovable(this, function () {     // define the callback that "removes" this marker
                    // TODO: Could ask for confirmation; return false if veto'd
                    manager.removeMarker(self);     // Removes the marker from the manager's observableArray
                    return true;    // return true to fire a EVENT_OBJECT_REMOVED
                });

                // Make context sensitive by the PickController: adds the isContextSensitive member
                contextSensitive.makeContextSensitive(this, function () {    // define the function that shows the context sentive memnu
                    $.growl({
                        title: self.name(), 
                        message: "Location: " + self.toponym() + ", " + self.location()});
                });

                // Observables
                
                /** The unique id used to identify this particular marker object */
                this.id = ko.observable(args.id || util.guid());
                /** The name of this marker */
                this.name = ko.observable(args.name || "Marker");
                /** The movable mix-in state */
                this.isMovable(args.isMovable === undefined ? false : args.isMovable);
                /** The latitude of this marker -- set be by the Movable interface during pick/drag operations. See PickController */
                this.latitude(position.latitude)
                /** The longitude of this marker -- may be set by the Movable interface during pick/drag operations See PickController */
                this.longitude (position.longitude);
                /** The lat/lon location string of this marker */
                this.location = ko.computed(function () {
                    return formatter.formatDecimalDegreesLat(self.latitude(), 3) + ", " + formatter.formatDecimalDegreesLon(self.longitude(), 3);
                });
                this.toponym = ko.observable("");
                
                // Properties
                
                /** The image source url, stored/recalled in the persistant store */
                this.source = args.imageSource;
                /** DOM element id to display view when this marker is selected. */
                this.viewTemplateName = 'basic-marker-view-template';
                
                
                // Create the placemark property
                normalAttributes = new WorldWind.PlacemarkAttributes(BasicMarker.commonAttributes());
                if (args.imageSource) {
                    normalAttributes.imageSource = args.imageSource;
                } else {
                    // When there no imageSource, Placemark will draw a colored square
                    normalAttributes.imageScale = 20;   // size of the square, in pixels
                    normalAttributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 0.5);
                }
                highlightAttributes = new WorldWind.PlacemarkAttributes(normalAttributes);
                highlightAttributes.imageScale = normalAttributes.imageScale * 1.2;

                this.placemark = new WorldWind.Placemark(position, true, normalAttributes); // eye distance scaling enabled
                this.placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                this.placemark.eyeDistanceScalingThreshold = 4000000;
                this.placemark.highlightAttributes = highlightAttributes;
                this.placemark.label = this.name();
                // Configure the placemark to return this marker object when the placemark is picked, 
                // See: PickController
                this.placemark.pickDelegate = this;

                // Synchronize the placemark to this marker's the observable properties

                this.name.subscribe(function (newName) {
                    self.placemark.label = newName;
                });
                this.latitude.subscribe(function (newLat) {
                    self.placemark.position.latitude = newLat;
                });
                this.longitude.subscribe(function (newLon) {
                    self.placemark.position.longitude = newLon;
                });
                
                // Self subscribe to move operations so we can update the toponyn when
                // the move is finished. We don't want to update during the move itself.
                this.on(events.EVENT_OBJECT_MOVE_FINISHED, this.refresh);

                this.refresh();
            };


            /**
             * Updates the marker's place data.
             */
            BasicMarker.prototype.refresh = function () {
                this.refreshPlace();
            };

            /**
             * Updates this object's place attributes. 
             */
            BasicMarker.prototype.refreshPlace = function (deferred) {

                if (!this.latitude() || !this.longitude()) {
                    return;
                }
                var self = this,
                    i, max, item, 
                    places = [], 
                    placename = '',
                    placeResults;

                // Get the place name(s) at this location
                placeService.places(
                    this.latitude(),
                    this.longitude(),
                    function (json) { // Callback to process Yahoo GeoPlanet geo.placefinder result

                        // Load all the places into a places object array
                        if (!json.query.results) {
                            log.error("BasicMarker", "refreshPlace", "json.query.results is null");
                            return;
                        }
                        // Place single result into an array for processing
                        placeResults = (json.query.count === 1 ? [json.query.results.place] : json.query.results.place);
                        for (i = 0, max = placeResults.length; i < max; i++) {
                            item = placeResults[i];
                            places[i] = {
                                name: item.name, 
                                placeType: item.placeTypeName.content,
                            };
                        };
                        self.places = places; // Saving the place results for testing... not currently used

                        // Find the first place name that's not a zip code (they're ordered by granularity) 
                        for (i = 0, max = places.length; i < max; i++) {
                            if (places[i].type !== "Zip Code") {
                                placename = places[i].name;
                                break;
                            }
                        }
                        // Update the placename property: toponym
                        self.toponym(placename);

                        log.info('BasicMarker', 'refreshPlace', self.name() + ': EVENT_PLACE_CHANGED');
                        self.fire(events.EVENT_PLACE_CHANGED, self);
                        if (deferred) {
                            deferred.resolve(self);
                        }
                    }
                );
            };


            BasicMarker.commonAttributes = function () {
                var attributes = new WorldWind.PlacemarkAttributes(null);

                // Set up the common placemark attributes for markers
                attributes.depthTest = true;
                attributes.imageScale = 0.7;
                attributes.imageColor = WorldWind.Color.WHITE;
                attributes.imageOffset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.3,
                        WorldWind.OFFSET_FRACTION, 0.0);
                attributes.labelAttributes.color = WorldWind.Color.YELLOW;
                attributes.labelAttributes.offset = new WorldWind.Offset(
                        WorldWind.OFFSET_FRACTION, 0.5,
                        WorldWind.OFFSET_FRACTION, 1.0);
                attributes.labelAttributes.color = WorldWind.Color.WHITE;
                attributes.labelAttributes.depthTest = true;
                attributes.drawLeaderLine = true;
                attributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;
                attributes.leaderLineAttributes.outlineWidth = 2;
                return attributes;
            };

            BasicMarker.imagePath = constants.WORLD_WIND_PATH + 'images/pushpins/';
            BasicMarker.templates = [
                {name: "Red ", imageSource: BasicMarker.imagePath + "castshadow-red.png"},
                {name: "Black ", imageSource: BasicMarker.imagePath + "castshadow-black.png"},
                {name: "Green ", imageSource: BasicMarker.imagePath + "castshadow-green.png"},
                {name: "Blue ", imageSource: BasicMarker.imagePath + "castshadow-blue.png"},
                {name: "Teal ", imageSource: BasicMarker.imagePath + "castshadow-teal.png"},
                {name: "Orange ", imageSource: BasicMarker.imagePath + "castshadow-orange.png"},
                {name: "Purple ", imageSource: BasicMarker.imagePath + "castshadow-purple.png"},
                {name: "Brown ", imageSource: BasicMarker.imagePath + "castshadow-brown.png"},
                {name: "White ", imageSource: BasicMarker.imagePath + "castshadow-white.png"}
            ];

            return BasicMarker;
        }
);

