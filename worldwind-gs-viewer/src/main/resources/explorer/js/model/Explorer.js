/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

/**
 * Explorer singleton and constants.
 *
 * @param {Constants} constants singleton
 * @param {Log} log singleton
 * @param {Settings} settings singleton
 * @param {WorldWind} ww
 *
 * @returns {Explorer}
 *
 * @author Bruce Schubert
 */
define(['jquery',
    'knockout',
    'model/Constants',
    'model/util/Log',
    'model/markers/MarkerManager',
    'model/util/Settings',
    'model/weather/WeatherScoutManager',
    'worldwind'],
    function (
        $,
        ko,
        constants,
        log,
        MarkerManager,
        settings,
        WeatherScoutManager) {
        "use strict";
        /**
         * This is the top-level Explorer singleton.
         * @exports Explorer
         * @global
         */
        var Explorer = {
            /**
             * The Explorer version number.
             * @constant
             */
            VERSION: "0.2.0",
            /**
             * Prepares the singleton Explorer object for use.
             * @param {Globe} globe
             */
            initialize: function (globe) {
                var self = this;

                this.globe = globe;
                this.wwd = globe.wwd;

                // Configure the manager of objects on the globe
                this.markerManager = new MarkerManager(globe);
                this.weatherManager = new WeatherScoutManager(globe);

                // Configure the objects used to animate the globe when performing "go to" operations
                this.goToAnimator = new WorldWind.GoToAnimator(this.wwd);
                this.isAnimating = false;

                // Internal. Intentionally not documented.
                this.updateTimeout = null;
                this.updateInterval = 50;

                // Setup to update each time the World Window is repainted.
                this.wwd.redrawCallbacks.push(function () {
                    self.handleRedraw();
                });

                // Setup an interval to update the current time
                this.autoUpdateTimeEnabled = ko.observable(true);
                this.dateTimeInterval = window.setInterval(function () {
                    if (self.autoUpdateTimeEnabled()) {
                        self.globe.updateDateTime(new Date());
                    }
                }, 30000);  // Update every 30 seconds

                // Setup to track the cursor position relative to the World Window's canvas. Listen to touch events in order
                // to recognize and ignore simulated mouse events in mobile browsers.
                window.addEventListener("mousemove", function (event) {
                    self.handleMouseEvent(event);
                });
                window.addEventListener("touchstart", function (event) {
                    self.handleTouchEvent(event);
                });

            },

            /**
             *
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Object} params
             */
            identifyFeaturesAtLatLon: function (latitude, longitude, params) {
                var arg = params || {};

                if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                    log.error("Explorer", "identifyFeaturesAtLatLon", "Invalid Latitude and/or Longitude.");
                    return;
                }
            },
            /**
             * Centers the globe on the given lat/lon via animation.
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Number} eyeAltitude
             */
            lookAtLatLon: function (latitude, longitude, eyeAltitude) {
                if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
                    log.error("Explorer", "lookAtLatLon", "Invalid Latitude and/or Longitude.");
                    return;
                }
                // TODO: Make AGL and MSL elevations a function of the model
                // TODO: Eye Position a property of the model
                // 
                var self = this,
                    eyeAltMsl = this.globe.viewpoint().eye.altitude,
                    eyePosGrdElev = this.globe.terrainProvider.elevationAtLatLon(this.globe.viewpoint().eye.latitude, this.globe.viewpoint().eye.longitude),
                    tgtPosElev = this.globe.terrainProvider.elevationAtLatLon(latitude, longitude),
                    eyeAltAgl = eyeAltitude || Math.max(eyeAltMsl - eyePosGrdElev, 100),
                    tgtEyeAltMsl = Math.max(tgtPosElev + eyeAltAgl, 100);

                // HACK: Force the view to nadir to avoid bug where navigator looks at target at 0 MSL.
                // This will establish the crosshairs on the target.
                this.wwd.navigator.range = eyeAltMsl;
                this.wwd.navigator.tilt = 0;
                this.wwd.redraw();

                this.globe.goto(latitude, longitude, tgtEyeAltMsl, function () {
                    self.updateSpatialData();
                });
            },
            /**
             * Returns the terrain at the reticule.
             * @returns {Terrain} Explorer.model.viewpoint.target}
             */
            getTargetTerrain: function () {
                return this.globe.viewpoint().target;
            },
            /**
             * Restores all the persistant data from a previous session.
             * This method must be called after World Wind has finished
             * updating. See the use Pace.on("done",...) in WmtClient.
             */
            restoreSession: function () {
                log.info('Explorer', 'restoreSession', 'Restoring the model and view.');
                this.markerManager.restoreMarkers();
                this.weatherManager.restoreScouts();
                this.restoreSessionView();
                // Update all time sensitive objects
                this.globe.updateDateTime(new Date());

                // Force a refresh now that everything is setup.
                this.globe.redraw();
            },
            // Internal method
            restoreSessionView: function () {
                settings.restoreSessionSettings(this);
            },
            /**
             * Saves the current session to the persistent store.
             * See the call to window.onUnload(...) in WmtClient.
             */
            saveSession: function () {
                log.info('Explorer', 'saveSession', 'Saving the model and view.');
                this.saveSessionView();
                this.markerManager.saveMarkers();
                this.weatherManager.saveScouts();
            },
            // Internal method.
            saveSessionView: function () {
                settings.saveSessionSettings(this);
            },
            /**
             * Updates the view model with current globe viewpoint.
             */
            updateSpatialData: function () {
                var wwd = this.wwd,
                    mousePoint = this.mousePoint,
                    centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2);

                // Use the mouse point when we've received at least one mouse event. Otherwise assume that we're
                // on a touch device and use the center of the World Window's canvas.
                if (!mousePoint) {
                    this.globe.updateMousePosition(centerPoint);
                } else if (wwd.viewport.containsPoint(mousePoint)) {
                    this.globe.updateMousePosition(mousePoint);
                }
                // Update the viewpoint
                if (!this.isAnimating) {
                    this.globe.updateEyePosition();
                }
            },
            /**
             * handleRedraw updates the spatial view models.
             */
            handleRedraw: function () {
                var self = this;
                if (self.updateTimeout) {
                    return; // we've already scheduled an update; ignore redundant redraw events
                }
                self.updateTimeout = window.setTimeout(function () {
                    // Update the geospatial view models
                    self.updateSpatialData();
                    self.updateTimeout = null;
                }, self.updateInterval);
            },
            handleMouseEvent: function (event) {
                if (this.isTouchDevice) {
                    return; // ignore simulated mouse events in mobile browsers
                }
                this.mousePoint = this.wwd.canvasCoordinates(event.clientX, event.clientY);
                this.wwd.redraw();
            },
            //noinspection JSUnusedLocalSymbols
            handleTouchEvent: function () {
                this.isTouchDevice = true; // suppress simulated mouse events in mobile browsers
                this.mousePoint = null;
            }
        };

        return Explorer;
    }
);