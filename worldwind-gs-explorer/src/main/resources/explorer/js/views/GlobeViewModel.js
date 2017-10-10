/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery', 'jqueryui',
        'model/markers/BasicMarker',
        'model/Explorer',
        'model/util/WmtUtil',
        'worldwind'
    ],
    function (ko, $, jqueryui,
              BasicMarker,
              explorer,
              util,
              ww) {
        "use strict";
        /**
         *
         * @param {Globe} globe The globe object
         * @param {Array} params Array containing markerManager object
         * @constructor
         */
        function GlobeViewModel(globe, params) {
            var self = this,
                markerManager = params.markerManager;

            // Save a reference to the auto-update time observable for the view view
            self.autoUpdateTime = explorer.autoUpdateTimeEnabled;

            // Create the marker templates used in the marker palette
            self.markerPalette = ko.observableArray(BasicMarker.templates);
            // The currently selected marker icon in the marker palette
            self.selectedMarkerTemplate = ko.observable(self.markerPalette()[0]);
            // Used for cursor style and click handling (see Globe's canvas in index.html)
            self.dropIsArmed = ko.observable(false);
            // The dropCallback is supplied with the click position and the dropObject.
            self.dropCallback = null;
            // The object passed to the dropCallback
            self.dropObject = null;

            /**
             * Arms the click-drop handler to add a marker to the globe. See: handleClick below.
             */
            self.armDropMarker = function () {
                self.dropIsArmed(true);
                self.dropCallback = self.dropMarkerCallback;
                self.dropObject = self.selectedMarkerTemplate();
            };
                        
            // Invoke armDropMarker when a template is selected from the palette
            self.selectedMarkerTemplate.subscribe(self.armDropMarker);

            // This "Drop" action callback creates and adds a marker to the globe
            // when the globe is clicked while dropIsArmed is true.
            self.dropMarkerCallback = function (position, markerTemplate) {
                // Add the placemark to the layer and to the observable array
                markerManager.addMarker(new BasicMarker(
                        markerManager, position, { imageSource: markerTemplate.imageSource }));
            };
            /**
             * Handles a click on the WorldWindow. If a "drop" action callback has been
             * defined, it invokes the dropCallback function with the picked location.
             */
            self.handleDropClick = function (event) {
                if (!self.dropIsArmed()) {
                    return;
                }
                var type = event.type,
                    x, y,
                    pickList,
                    terrain;
                // Get the clicked window coords
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
                if (self.dropCallback) {
                    // Get all the picked items
                    pickList = globe.wwd.pickTerrain(globe.wwd.canvasCoordinates(x, y));
                    // Terrain should be one of the items if the globe was clicked
                    terrain = pickList.terrainObject();
                    if (terrain) {
                        self.dropCallback(terrain.position, self.dropObject);
                    }
                }
                self.dropIsArmed(false);
                event.stopImmediatePropagation();
            };
            // Assign the click handler to the WorldWind
            globe.wwd.addEventListener('click', function (event) {
                self.handleDropClick(event);
            });


            self.onTimeReset = function () {
                explorer.autoUpdateTimeEnabled(true);   // reset enables the auto time adjustment
                globe.updateDateTime(new Date());
            };

            self.intervalMinutes = 0;
            self.changeDateTime = function () {
                explorer.autoUpdateTimeEnabled(false);  // stop the auto adjustment when we manually set the time
                globe.incrementDateTime(self.intervalMinutes);
            };

            // The time-control buttons have the repeatButton style:
            // This handler performs the time adjustment for both the
            // single click and repeat clicks.
            var intervalId = -1;
            $(".repeatButton").mousedown(function (event) {
                switch (event.currentTarget.id) {
                    case "time-step-forward":
                        self.intervalMinutes = 60;
                        break;
                    case "time-fast-forward":
                        self.intervalMinutes = 60 * 24;
                        break;
                    case "time-step-backward":
                        self.intervalMinutes = -60;
                        break;
                    case "time-fast-backward":
                        self.intervalMinutes = -60 * 24;
                        break;
                }
                self.changeDateTime();
                // Start a repeating interval that changes the time.
                if (intervalId !== -1) {    // prevent duplicates
                    clearInterval(intervalId);
                }
                intervalId = setInterval(self.changeDateTime, 200);
            }).mouseup(function () {
                clearInterval(intervalId);
                intervalId = -1;
            });

            $('#timeControlSlider').slider({
                animate: 'fast',
                min: -60,
                max: 60,
                orientation: 'horizontal',
                stop: function () {
                    $("#timeControlSlider").slider("value", "0");
                }
            });

            this.onSlide = function (event, ui) {
                //console.log("onSlide: " + ui.value);
                explorer.autoUpdateTimeEnabled(false);  // stop the auto time adjustment whenever we manually set the time
                globe.incrementDateTime(ui.value);
                //globe.incrementDateTime(self.sliderValueToMinutes(ui.value));
                globe.updateDateTime(self.sliderValueToTime(ui.value));
            };
            self.sliderValueToTime = function (value) {
                var time = globe.dateTime(),
                    minutes = time.getMinutes();
                time.setTime(time.getTime() + (value * 60000));
                return time;
            };
            self.sliderValueToMinutes = function (value) {
                var val, factor = 50;
                if (value < 45 && value > -45) {
                    val = Math.min(Math.max(value, -45), 45);
                    return Math.sin(val * util.DEG_TO_RAD) * factor;
                }
                val = Math.abs(value) - 44;
                return Math.pow(val, 1.5) * (value < 0 ? -1 : 1) * factor;
            };

            //$("#timeControlSlider").on('mousedown', $.proxy(this.onMousedown, this));
            //$("#timeControlSlider").on('mouseup', $.proxy(this.onMouseup, this));
            // The slide event provides events from the keyboard
            $("#timeControlSlider").on('slide', $.proxy(this.onSlide, this));

            self.timeSliderValue = ko.observable(0);
            self.onTimeSliderStop = function () {
                self.timeSliderValue(0);
            };
        }

        return GlobeViewModel;
    }
);