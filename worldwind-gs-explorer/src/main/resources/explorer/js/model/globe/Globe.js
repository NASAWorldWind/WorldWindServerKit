/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

/**
 * The Globe module manages the WorldWindow object and add capabilities to the globe not found in the
 * Web World Wind library.
 *
 * @param {Knockout}
 * @param {Config}
 * @param {Events}
 * @param {Constants}
 * @param {EnhancedTextSupport} EnhancedTextSupport Provides outline text.
 * @param {EnhancedViewControlsLayer} EnhancedViewControlsLayer Provides a vertical layout.
 * @param {KeyboardControls} KeyboardControls Provides keyboard navigation for the globe.
 * @param {LayoutManager}
 * @param {LocationWidget}
 * @param {Log} log Logger.
 * @param {PickController} PickController Provides select and move of globe renderables.
 * @param {Publisher}
 * @param {ReticuleLayer} ReticuleLayer Crosshairs.
 * @param {SkyBackgroundLayer} SkyBackgroundLayer Adaptive sky color.
 * @param {Sunlight}
 * @param {Terrain} Terrain Aspect, slope and elevation.
 * @param {TerrainProvider} TerrainProvider Provides terrain data.
 * @param {TimeWidget}
 * @param {TimeZoneLayer}
 * @param {Viewpoint} Viewpoint Eye position and target terrain.
 * @param {WorldWind} ww Web World Wind.
 * @returns {Globe}
 *
 * @author Bruce Schubert
 */
define([
    'knockout',
    'model/Config',
    'model/Constants',
    'model/Events',
    'model/globe/layers/EnhancedAtmosphereLayer',
    'model/globe/layers/EnhancedStarFieldLayer',
    'model/globe/EnhancedTextSupport',
    'model/globe/layers/EnhancedViewControlsLayer',
    'model/globe/KeyboardControls',
    'model/globe/LayerManager',
    'model/globe/widgets/LocationWidget',
    'model/util/Log',
    'model/globe/PickController',
    'model/util/Publisher',
    'model/globe/layers/ReticuleLayer',
    'model/globe/layers/SkyBackgroundLayer',
    'model/globe/Sunlight',
    'model/globe/Terrain',
    'model/globe/TerrainProvider',
    'model/globe/widgets/TimeWidget',
    'model/globe/layers/TimeZoneLayer',
    'model/globe/Viewpoint',
    'model/util/WmtUtil',
    'worldwind'], function (
        ko,
        config,
        constants,
        events,
        EnhancedAtmosphereLayer,
        EnhancedStarFieldLayer,
        EnhancedTextSupport,
        EnhancedViewControlsLayer,
        KeyboardControls,
        LayerManager,
        LocationWidget,
        log,
        PickController,
        publisher,
        ReticuleLayer,
        SkyBackgroundLayer,
        Sunlight,
        Terrain,
        TerrainProvider,
        TimeWidget,
        TimeZoneLayer,
        Viewpoint,
        util,
        ww) {
    "use strict";
    /**
     * Creates a Globe object which manages a WorldWindow object created for the given canvas.
     * @constructor
     * @param {WorldWindow} wwd The WorldWindow object.
     * @param {Object} options Optional. Example (with defaults):
     *  {
     *      showBackground: true
     *      showReticule: true,
     *      showViewControls: true,
     *      includePanControls: true,
     *      includeRotateControls: true,
     *      includeTiltControls: true,
     *      includeZoomControls: true,
     *      includeExaggerationControls: false,
     *      includeFieldOfViewControls: false,
     *  }
     * @returns {Globe}
     */
    var Globe = function (wwd, options) {
        // Mix-in Publisher capability (publish/subscribe pattern)
        publisher.makePublisher(this);

        this.wwd = wwd;

        // Enhance the behavior of the navigator: prevent it from going below the terrain
        this.enhanceLookAtNavigator(wwd.navigator);

        // Observable properties
        this.use24Time = ko.observable(false);
        this.timeZoneDetectEnabled = ko.observable(true);
        this.timeZoneOffsetHours = ko.observable(0); // default to UTC
        this.timeZoneName = ko.observable("UTC"); // default to UTC
        this.dateTime = ko.observable(new Date(0));
        this.viewpoint = ko.observable(Viewpoint.ZERO).extend({rateLimit: 100});    // 10hz
        this.terrainAtMouse = ko.observable(Terrain.ZERO);
        this.sunlight = ko.observable(new Sunlight(
                this.dateTime(),
                this.viewpoint().target.latitude,
                this.viewpoint().target.longitude)).extend({rateLimit: 100});   // 10hz

        // Override the default TextSupport with our custom verion that draws outline text
        this.wwd.drawContext.textSupport = new EnhancedTextSupport();
        // Add support for animating the globe to a position.
        this.goToAnimator = new WorldWind.GoToAnimator(this.wwd);
        this.isAnimating = false;
        this.selectController = new PickController(this.wwd);
        this.keyboardControls = new KeyboardControls(this);
        this.layerManager = new LayerManager(this);
        this.resizeTimer = null;
        this.canvasWidth = null;
        // Add terrain services (aspect, slope) to the globe
        this.terrainProvider = new TerrainProvider(this);

        // Create the standard background, view controls and widget layers

        var self = this,
                showBackground = options ? options.showBackground : true,
                showReticule = options ? options.showReticule : true,
                showViewControls = options ? options.showViewControls : true,
                showWidgets = options ? options.showWidgets : true,
                includePanControls = options ? options.includePanControls : true,
                includeRotateControls = options ? options.includeRotateControls : true,
                includeTiltControls = options ? options.includeTiltControls : true,
                includeZoomControls = options ? options.includeZoomControls : true,
                includeExaggerationControls = options ? options.includeExaggerationControls : true,
                includeFieldOfViewControls = options ? options.includeFieldOfViewControls : false,
                bmngImageLayer,
                controls,
                widgets;


        // Clear all existing layers
        wwd.layers.splice(0, wwd.layers.length);
        
        // Add a BlueMarble world layer that's always visible
        bmngImageLayer = new WorldWind.BMNGOneImageLayer();
        bmngImageLayer.minActiveAltitude = 0; // default setting is 3e6;
        this.layerManager.addBackgroundLayer(bmngImageLayer, {
            enabled: true,
            hideInMenu: true,
            detailControl: config.imagerydetailControl
        });

        // Add Marker support
        this.layerManager.addDataLayer(new WorldWind.RenderableLayer(constants.LAYER_NAME_MARKERS), {
            enabled: true,
            pickEnabled: true
        });
        this.layerManager.addDataLayer(new WorldWind.RenderableLayer(constants.LAYER_NAME_TACTICAL_SYMBOLS), {
            enabled: true,
            pickEnabled: true
        });

        // Add TimeZone support
        this.timeZoneLayer = new TimeZoneLayer();
        this.layerManager.addEffectLayer(this.timeZoneLayer, {
            enabled: true,
            pickEnabled: true,
            hideInMenu: false
        });

        // Add optional effects layers
        if (showBackground || showBackground === undefined) {
            // Set the background color to variable shade of blue
            this.layerManager.addEffectLayer(new EnhancedStarFieldLayer(this), {
                enabled: true,
                hideInMenu: false
            });
            this.layerManager.addEffectLayer(new SkyBackgroundLayer(this), {
                enabled: false,
                hideInMenu: false
            });
            // Add the optional Day/Night mode and Atmosphere effect
            this.layerManager.addEffectLayer(new EnhancedAtmosphereLayer(this), {
                enabled: true,
                hideInMenu: false
            });
            // Add the optional Tesselation layer (for debugging or high-tech display)
            this.layerManager.addEffectLayer(new WorldWind.ShowTessellationLayer(), {
                enabled: false,
                hideInMenu: false
            });
            // Add the optional Tesselation layer (for debugging or high-tech display)
            this.layerManager.addEffectLayer(new WorldWind.FrameStatisticsLayer(this.wwd), {
                enabled: false,
                hideInMenu: false
            });
        }

        // Adjust the level of detail based on screen properties
        //this.adjustTiledImageLayerDetailHints();

        // Add optional reticule
        if (showReticule || showReticule === undefined) {
            this.layerManager.addWidgetLayer(new ReticuleLayer());
        }


        // Add optional view controls layer
        if (showViewControls || showViewControls === undefined) {
            controls = new EnhancedViewControlsLayer(this);
            controls.showPanControl = includePanControls;
            controls.showHeadingControl = includeRotateControls;
            controls.showTiltControl = includeTiltControls;
            controls.showZoomControl = includeZoomControls;
            controls.showExaggerationControl = includeExaggerationControls;
            controls.showFieldOfViewControl = includeFieldOfViewControls;
            this.layerManager.addWidgetLayer(controls);
        }


        // Add optional time and location widgets
        if (showWidgets || showWidgets === undefined) {
            widgets = new WorldWind.RenderableLayer(constants.LAYER_NAME_WIDGETS);
            widgets.addRenderable(new TimeWidget(this));
            widgets.addRenderable(new LocationWidget(this));
            this.layerManager.addWidgetLayer(widgets, {
                enabled: true,
                pickEnabled: true,
                hideInMenu: false
            });
        }

        // Add handler to redraw the WorldWindow during resize events
        // to prevent the canvas from looking distorted.
        // Adjust the level of detail proportional to the
        // window size.
        $(window).resize(function () {
            self.wwd.redraw();

//                clearTimeout(self.resizeTimer);
//                self.resizeTimer = setTimeout(function () {
//                    self.adjustTiledImageLayerDetailHints();
//                }, 2000);
        });

        // Ensure keyboard controls are operational by
        // setting focus to the globe
        this.wwd.addEventListener("click", function (event) {
            self.setFocus();
        });

        // Internals
        this.lastEyePoint = new WorldWind.Vec3();
        this.lastViewpoint = new Viewpoint(WorldWind.Position.ZERO, Terrain.ZERO);
        this.lastMousePoint = new WorldWind.Vec2();
        this.lastSolarTarget = new Terrain(0, 0, 0, 0, 0);
        this.lastSolarTime = new Date(0);
        this.SUNLIGHT_DISTANCE_THRESHOLD = 10000; // meters
        this.SUNLIGHT_TIME_THRESHOLD = 15; // minutes

        // Perform initial updates for time and sunlight
        this.updateDateTime(new Date());

        // Subscribe to rate-throttled viewpoint updates
        this.viewpoint.subscribe(function () {
            if (this.timeZoneDetectEnabled()) {
                this.updateTimeZoneOffset();
            }
        }, this);
    };

    /**
     * Enhance the behavior of the LookAtNavigator by not allowing the eye
     * position to go below the terrain.
     * @param {LookAtNavigator} navigator
     */
    Globe.prototype.enhanceLookAtNavigator = function (navigator) {
        var self = this;
        // Use the navigator's current settings for the initial 'last' settings
        navigator.lastEyePosition = new WorldWind.Position();
        navigator.lastLookAtLocation = new WorldWind.Location(navigator.lookAtLocation.latitude, navigator.lookAtLocation.longitude);
        navigator.lastRange = navigator.range;
        navigator.lastHeading = navigator.heading;
        navigator.lastTilt = navigator.tilt;
        navigator.lastRoll = navigator.roll;

        /**
         * Returns the intercept position of a ray from the eye to the lookAtLocation.
         * @returns {Position) The current terrain intercept position
         */
        navigator.terrainInterceptPosition = function () {
            var wwd = navigator.worldWindow,
                    centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2),
                    terrainObject = wwd.pickTerrain(centerPoint).terrainObject();

            if (terrainObject) {
                return terrainObject.position;
            }
        };
        /**
         * Limit the navigator's position and orientation appropriately for the current scene.
         * Overrides the LookAtNavigator's applyLimits function.
         */
        navigator.applyLimits = function () {
            if (isNaN(navigator.lookAtLocation.latitude) || isNaN(navigator.lookAtLocation.longitude)) {
                log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid lat/lon: NaN");
                navigator.lookAtLocation.latitude = navigator.lastLookAtLocation.latitude;
                navigator.lookAtLocation.longitude = navigator.lastLookAtLocation.longitude;
            }
            if (isNaN(navigator.range)) {
                log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid range: NaN");
                navigator.range = isNaN(navigator.lastRange) ? 1000 : navigator.lastRange;
            }
            if (navigator.range < 0) {
                log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid range: < 0");
                navigator.range = 1;
            }
            if (isNaN(navigator.heading)) {
                log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid heading: NaN");
                navigator.heading = navigator.lastHeading;
            }
            if (isNaN(navigator.tilt)) {
                log.error("EnhancedLookAtNavigator", "applyLimits", "Invalid tilt: NaN");
                navigator.tilt = navigator.lastTilt;
            }

            if (self.wwd.globe.is2D()) {
                // Don't allow rotation for Mercator and Equirectangular projections
                // to improve the user experience.
                if (self.wwd.globe.projection instanceof WorldWind.ProjectionEquirectangular ||
                        self.wwd.globe.projection instanceof WorldWind.ProjectionMercator) {
                    navigator.heading = 0;
                }
            }

            if (!navigator.validateEyePosition()) {
                // Eye position is invalid, so restore the last navigator settings
                navigator.lookAtLocation.latitude = navigator.lastLookAtLocation.latitude;
                navigator.lookAtLocation.longitude = navigator.lastLookAtLocation.longitude;
                navigator.range = navigator.lastRange;
                navigator.heading = navigator.lastHeading;
                navigator.tilt = navigator.lastTilt;
                navigator.roll = navigator.lastRoll;
            }
            // Clamp latitude to between -90 and +90, and normalize longitude to between -180 and +180.
            // HACK: Clamping to +/-89.9 to avoid bug that locks up app when looking at the poles.
            navigator.lookAtLocation.latitude = WorldWind.WWMath.clamp(navigator.lookAtLocation.latitude, -89.9, 89.9);
            navigator.lookAtLocation.longitude = WorldWind.Angle.normalizedDegreesLongitude(navigator.lookAtLocation.longitude);
            // Clamp range to values greater than 1 in order to prevent degenerating to a first-person navigator when
            // range is zero.
            navigator.range = WorldWind.WWMath.clamp(navigator.range, 1, constants.NAVIGATOR_MAX_RANGE);
            // Normalize heading to between -180 and +180.
            navigator.heading = WorldWind.Angle.normalizedDegrees(navigator.heading);
            // Clamp tilt to between 0 and +90 to prevent the viewer from going upside down.
            navigator.tilt = WorldWind.WWMath.clamp(navigator.tilt, 0, 90);
            // Normalize heading to between -180 and +180.
            navigator.roll = WorldWind.Angle.normalizedDegrees(navigator.roll);
            // Apply 2D limits when the globe is 2D.
            if (navigator.worldWindow.globe.is2D() && navigator.enable2DLimits) {
                // Clamp range to prevent more than 360 degrees of visible longitude.
                var nearDist = navigator.nearDistance,
                        nearWidth = WorldWind.WWMath.perspectiveFrustumRectangle(navigator.worldWindow.viewport, nearDist).width,
                        maxRange = 2 * Math.PI * navigator.worldWindow.globe.equatorialRadius * (nearDist / nearWidth);
                navigator.range = WorldWind.WWMath.clamp(navigator.range, 1, maxRange);

                // Force tilt to 0 when in 2D mode to keep the viewer looking straight down.
                navigator.tilt = 0;
            }
            // Cache the nav settings
            navigator.lastLookAtLocation.latitude = navigator.lookAtLocation.latitude;
            navigator.lastLookAtLocation.longitude = navigator.lookAtLocation.longitude;
            navigator.lastRange = navigator.range;
            navigator.lastHeading = navigator.heading;
            navigator.lastTilt = navigator.tilt;
            navigator.lastRoll = navigator.roll;
        };
        /**
         * Validate the eye position is not below the terrain.
         * @returns {Boolean}
         */
        navigator.validateEyePosition = function () {
            if (isNaN(navigator.lookAtLocation.latitude)) {
                log.error("EnhancedLookAtNavigator", "validateEyePosition", "lookAtLocation.latitude is NaN.");
            }
            if (isNaN(navigator.lookAtLocation.longitude)) {
                log.error("EnhancedLookAtNavigator", "validateEyePosition", "lookAtLocation.longitude is NaN.");
                return false;
            }
            var wwd = navigator.worldWindow,
                    navigatorState = navigator.intermediateState(),
                    eyePoint = navigatorState.eyePoint,
                    eyePos = new WorldWind.Position(),
                    terrainElev;

            // Get the eye position in geographic coords
            wwd.globe.computePositionFromPoint(eyePoint[0], eyePoint[1], eyePoint[2], eyePos);
            if (!eyePos.equals(navigator.lastEyePosition)) {
                // Validate the new eye position to ensure it doesn't go below the terrain surface
                terrainElev = wwd.globe.elevationAtLocation(eyePos.latitude, eyePos.longitude);
                if (eyePos.altitude < terrainElev) {
                    //Log.error("EnhancedLookAtNavigator", "validateEyePosition", "eyePos (" + eyePos.altitude + ") is below ground level (" + terrainElev + ").");
                    return false;
                }
            }
            navigator.lastEyePosition.copy(eyePos);
            return true;
        };
        /**
         * Returns a new NavigatorState without calling applyLimits().
         * See also LookAtNavigator.currentState().
         * @returns {NavigatorState}
         */
        navigator.intermediateState = function () {
            // navigator.applyLimits(); -- Don't do this!!
            var globe = navigator.worldWindow.globe,
                    lookAtPosition = new WorldWind.Position(
                            navigator.lookAtLocation.latitude,
                            navigator.lookAtLocation.longitude,
                            0),
                    modelview = WorldWind.Matrix.fromIdentity();

            modelview.multiplyByLookAtModelview(lookAtPosition, navigator.range, navigator.heading, navigator.tilt, navigator.roll, globe);

            return navigator.currentStateForModelview(modelview);
        };

    };

    /**
     *
     * @param {Date} time
     */
    Globe.prototype.updateDateTime = function (time) {
        if (this.dateTime().valueOf() === time.valueOf()) {
            return;
        }
        // Update the sunlight angles when the elapsed time has gone past the threshold (15 min)
        if (util.minutesBetween(this.lastSolarTime, time) > this.SUNLIGHT_TIME_THRESHOLD) {
            this.updateSunlight(time, this.lastSolarTarget.latitude, this.lastSolarTarget.longitude);
        }
        //log.info("Globe", "updateDateTime", time.toLocaleString());

        this.dateTime(time); // observable
    };

    /**
     * Updates the date/time with the an adjusted time (+/- minutues).
     * @param {Number} minutes The number of minutes (+/-) added or subtracted from the current application time.
     */
    Globe.prototype.incrementDateTime = function (minutes) {
        var msCurrent = this.dateTime().valueOf(),
                msNew = msCurrent + (minutes * 60000);
        this.updateDateTime(new Date(msNew));
    };

    /**
     * Updates the globe's viewpoint..
     */
    Globe.prototype.updateEyePosition = function () {
        var currentViewpoint = this.getViewpoint(), // computes the viewpoint
                target = currentViewpoint.target,
                time = this.dateTime();

        if (this.viewpoint().equals(currentViewpoint)) {
            return;
        }

        // Initiate a request to update the sunlight property when we've moved a significant distance
        if (!this.lastSolarTarget || this.lastSolarTarget.distanceBetween(target) > this.SUNLIGHT_DISTANCE_THRESHOLD) {
            this.lastSolarTarget.copy(target);
            this.updateSunlight(time, target.latitude, target.longitude);
        }

        this.viewpoint(currentViewpoint);  // rate-throttled observable
    };

    /**
     * Updates the time zone offset.
     */
    Globe.prototype.updateTimeZoneOffset = function () {
        var canvasCenter = new WorldWind.Vec2(this.wwd.canvas.width / 2, this.wwd.canvas.height / 2),
                pickList, i, len, pickedObject,
                userObject, layer, record;

        this.timeZoneLayer.pickEnabled = true;
        pickList = this.wwd.pick(canvasCenter);
        if (pickList.hasNonTerrainObjects()) {

            for (i = 0, len = pickList.objects.length; i < len; i++) {
                pickedObject = pickList.objects[i];
                if (pickedObject.isTerrain) {
                    continue;
                }
                userObject = pickedObject.userObject;
                if (userObject.userProperties) {
                    layer = userObject.userProperties.layer;
                    if (layer && layer instanceof TimeZoneLayer) {
                        record = userObject.userProperties.record;
                        if (record) {   // DBaseRecord
                            // Update observables
                            this.timeZoneName(record.values.time_zone);
                            this.timeZoneOffsetHours(record.values.zone);
                            break;
                        }
                    }
                }
            }
        }
        this.timeZoneLayer.pickEnabled = false;
    };

    /**
     * Updates the terrainAtMouse observable property.
     *
     * @param {Vec2} mousePoint Mouse point or touchpoint coordiantes.
     */
    Globe.prototype.updateMousePosition = function (mousePoint) {
        if (mousePoint.equals(this.lastMousePoint)) {
            return;
        }
        this.lastMousePoint.copy(mousePoint);
        var terrain = this.getTerrainAtScreenPoint(mousePoint);

        this.terrainAtMouse(terrain);   // observable
    };

    Globe.prototype.updateSunlight = function (time, latitude, longitude) {
        this.lastSolarTime = time;
        this.lastSolarTarget.latitude = latitude;
        this.lastSolarTarget.longitude = longitude;

        this.sunlight(new Sunlight(time, latitude, longitude)); // observable
    };

    /**
     * Adjusts the level of detail to be proportional to the window size. 
     * When a layer's texture pixel size grows greater than the layer's 
     * detailContol value a request for higher resolution imagery is made.
     * If the window is twice the size of the base, then the detailHint should be 1.5;
     * if the window half the size then the detail control level should be 2.0.
     */
    Globe.prototype.adjustTiledImageLayerDetailHints = function () {
        var width = $(this.wwd.canvas).width(),
                i, len, layer,
                detailControl;

        if (this.canvasWidth === width) {
            return;
        }
        this.canvasWidth = width;

        if (width < 1000) {
            // Mobile
            detailControl = 2.0;
        } else {
            detailControl = util.linearInterpolation(width, 1000, 2000, 1.75, 1.25);
        }

        // $(window).width() / parseFloat($("body").css("font-size"));

        // Process TiledImageLayers
        for (i = 0, len = this.wwd.layers.length; i < len; i++) {
            layer = this.wwd.layers[i];
            if (layer instanceof WorldWind.TiledImageLayer) {
                layer.detailControl = detailControl;
            }
        }
    };

    /**
     * Finds the World Wind Layer in the layer list with the given display name.
     * @param {String} name Display name of the layer
     * @returns {Layer}
     */
    Globe.prototype.findLayer = function (name) {
        var layer,
                i, len;
        for (i = 0, len = this.wwd.layers.length; i < len; i++) {
            layer = this.wwd.layers[i];
            if (layer.displayName === name) {
                return layer;
            }
        }
    };

    /**
     * 
     * @returns {String}
     */
    Globe.prototype.getCameraParams = function () {
        // TODO: Move this to a Bookmark class similar to Settings
        var target = this.viewpoint().target,
                pos = new WorldWind.Location(target.latitude, target.longitude),
                alt = this.wwd.navigator.range,
                heading = this.wwd.navigator.heading,
                tilt = this.wwd.navigator.tilt,
                roll = this.wwd.navigator.roll;

        return "lat=" + target.latitude.toFixed(7) + "&lon=" + target.longitude.toFixed(7) + "&alt=" + alt.toFixed(2)
                + "&heading=" + heading + "&tilt=" + tilt + "&roll=" + roll;
    };


    /**
     * Gets terrain at the given latitude and longitude.
     * @param {Number} latitude
     * @param {Number} longitude
     * @return {Terrain} A WMT Terrain object at the given lat/lon.
     */
    Globe.prototype.getTerrainAtLatLon = function (latitude, longitude) {
        return this.terrainProvider.terrainAtLatLon(latitude, longitude);
    };

    /**
     * EXPERIMENTAL!!
     * Gets terrain at the given latitude and longitude.
     * @param {Number} latitude
     * @param {Number} longitude
     * @param {Number} targetResolution: The desired elevation resolution, in radians. (To compute radians from
     * meters, divide the number of meters by the globe's radius.) Default 1/WorldWind.EARTH_RADIUS.
     * @return {Terrain} An Explorer Terrain object at the given lat/lon.
     */
    Globe.prototype.getTerrainAtLatLonHiRes = function (latitude, longitude, targetResolution) {
        return this.terrainProvider.terrainAtLatLon(latitude, longitude, targetResolution || 1 / WorldWind.EARTH_RADIUS);
    };

    /**
     * Gets terrain at the screen point.
     * @param {Vec2} screenPoint Point in screen coordinates for which to get terrain.
     * @return {Terrain} A WMT Terrain object at the screen point.
     */
    Globe.prototype.getTerrainAtScreenPoint = function (screenPoint) {
        var terrainObject,
                terrain;
        // Get the WW terrain at the screen point, it supplies the lat/lon
        terrainObject = this.wwd.pickTerrain(screenPoint).terrainObject();
        if (terrainObject) {
            // Get the WMT terrain at the picked lat/lon
            terrain = this.terrainProvider.terrainAtLatLon(
                    terrainObject.position.latitude,
                    terrainObject.position.longitude);
        } else {
            // Probably above the horizon.
            terrain = new Terrain();
            terrain.copy(Terrain.INVALID);
        }
        return terrain;
    };

    /**
     * Gets the current viewpoint at the center of the viewport.
     * @@returns {Viewpoint} A Viewpoint representing the the eye position and the target position.
     */
    Globe.prototype.getViewpoint = function () {
        try {
            var wwd = this.wwd,
                    centerPoint = new WorldWind.Vec2(wwd.canvas.width / 2, wwd.canvas.height / 2),
                    navigatorState = wwd.navigator.currentState(),
                    eyePoint = navigatorState.eyePoint,
                    eyePos = new WorldWind.Position(),
                    target, viewpoint;
            // Avoid costly computations if nothing changed
            if (eyePoint.equals(this.lastEyePoint)) {
                return this.lastViewpoint;
            }
            this.lastEyePoint.copy(eyePoint);
            // Get the current eye position
            wwd.globe.computePositionFromPoint(eyePoint[0], eyePoint[1], eyePoint[2], eyePos);
            // Get the target (the point under the reticule)
            target = this.getTerrainAtScreenPoint(centerPoint);
            // Return the viewpoint
            viewpoint = new Viewpoint(eyePos, target);
            this.lastViewpoint.copy(viewpoint);
            return viewpoint;
        } catch (e) {
            log.error("Globe", "getViewpoint", e.toString());
            return Viewpoint.INVALID;
        }
    };

    /**
     * Updates the globe via animation.
     * @param {Number} latitude Reqd.
     * @param {Number} longitude Reqd.
     * @param {Number} range Optional.
     * @param {Function} callback Optional.
     */
    Globe.prototype.goto = function (latitude, longitude, range, callback) {
        //log.info("Globe", "goto", "Lat: " + latitude+ ", Lon: " + longitude + ", Range: " + range);
        if (typeof latitude !== "number" || typeof longitude !== "number" || isNaN(latitude) || isNaN(longitude)) {
            log.error("Globe", "gotoLatLon", "Invalid Latitude and/or Longitude.");
            return;
        }
        // HACK: Clamping to +/-89.9 to avoid bug that locks up app when looking at the poles.
        latitude = WorldWind.WWMath.clamp(latitude, -89.9, 89.9);

        var self = this;
        if (this.isAnimating) {
            this.goToAnimator.cancel();
        }
        this.isAnimating = true;
        this.goToAnimator.goTo(new WorldWind.Position(latitude, longitude, range), function () {
            self.isAnimating = false;
            if (callback) {
                callback();
            }
        });
    };

    /**
     * Updates the globe without animation.
     * @param {Number} latitude Reqd.
     * @param {Number} longitude Reqd.
     * @param {Number} range Optional.
     */
    Globe.prototype.lookAt = function (latitude, longitude, range) {
        //log.info("Globe", "lookAt", "Lat: " + latitude+ ", Lon: " + longitude + ", Range: " + range);
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            log.error("Globe", "lookAt", "Invalid Latitude and/or Longitude.");
            return;
        }
        // HACK: Clamping to +/-89.9 to avoid bug that locks up app when looking at the poles.
        latitude = WorldWind.WWMath.clamp(latitude, -89.9, 89.9);

        this.wwd.navigator.lookAtLocation.latitude = latitude;
        this.wwd.navigator.lookAtLocation.longitude = longitude;
        if (range) {
            this.wwd.navigator.range = range;
        }
        this.wwd.redraw();
    };

    /**
     * Request a redraw of the globe.
     */
    Globe.prototype.redraw = function () {
        this.wwd.redraw();
    };

    /**
     * Refreshes temporal layers.
     */
    Globe.prototype.refreshLayers = function () {
        var i, len, layer;

        // Process TiledImageLayers
        for (i = 0, len = this.wwd.layers.length; i < len; i++) {
            layer = this.wwd.layers[i];
            if (layer.isTemporal) {
                layer.refresh();
            }
            this.wwd.redraw();
        }

    };

    /**
     * Resets the viewpoint to the startup configuration settings.
     */
    Globe.prototype.reset = function () {
        this.wwd.navigator.lookAtLocation.latitude = Number(config.startupLatitude);
        this.wwd.navigator.lookAtLocation.longitude = Number(config.startupLongitude);
        this.wwd.navigator.range = Number(config.startupAltitude);
        this.wwd.navigator.heading = Number(config.startupHeading);
        this.wwd.navigator.tilt = Number(config.startupTilt);
        this.wwd.navigator.roll = Number(config.startupRoll);
        this.wwd.redraw();
    };

    /**
     * Resets the viewpoint to north up.
     */
    Globe.prototype.resetHeading = function () {
        this.wwd.navigator.heading = Number(0);
        this.wwd.redraw();
    };

    /**
     * Resets the viewpoint to north up and nadir.
     */
    Globe.prototype.resetHeadingAndTilt = function () {
        // Tilting the view will change the location due to a bug in
        // the early release of WW.  So we set the location to the
        // current crosshairs position (viewpoint) to resolve this issue
        var viewpoint = this.getViewpoint(),
                lat = viewpoint.target.latitude,
                lon = viewpoint.target.longitude;
        this.wwd.navigator.heading = 0;
        this.wwd.navigator.tilt = 0;
        this.wwd.redraw(); // calls applyLimits which changes the location

        this.lookAt(lat, lon);
    };

    Globe.prototype.setFocus = function () {
        this.wwd.canvas.focus();
    };

    /**
     * Establishes the projection for this globe.
     * @param {String} projectionName A PROJECTION_NAME_* constant.
     */
    Globe.prototype.setProjection = function (projectionName) {
        if (projectionName === constants.PROJECTION_NAME_3D) {
            if (!this.roundGlobe) {
                this.roundGlobe = new WorldWind.Globe(new WorldWind.EarthElevationModel());
            }

            if (this.wwd.globe !== this.roundGlobe) {
                this.wwd.globe = this.roundGlobe;
            }
        } else {
            if (!this.flatGlobe) {
                this.flatGlobe = new WorldWind.Globe2D();
            }

            if (projectionName === constants.PROJECTION_NAME_EQ_RECT) {
                this.flatGlobe.projection = new WorldWind.ProjectionEquirectangular();
            } else if (projectionName === constants.PROJECTION_NAME_MERCATOR) {
                this.flatGlobe.projection = new WorldWind.ProjectionMercator();
            } else if (projectionName === constants.PROJECTION_NAME_NORTH_POLAR) {
                this.flatGlobe.projection = new WorldWind.ProjectionPolarEquidistant("North");
            } else if (projectionName === constants.PROJECTION_NAME_SOUTH_POLAR) {
                this.flatGlobe.projection = new WorldWind.ProjectionPolarEquidistant("South");
            } else if (projectionName === constants.PROJECTION_NAME_NORTH_UPS) {
                this.flatGlobe.projection = new WorldWind.ProjectionUPS("North");
            } else if (projectionName === constants.PROJECTION_NAME_SOUTH_UPS) {
                this.flatGlobe.projection = new WorldWind.ProjectionUPS("South");
            } else if (projectionName === constants.PROJECTION_NAME_NORTH_GNOMONIC) {
                this.flatGlobe.projection = new WorldWind.ProjectionGnomonic("North");
            } else if (projectionName === constants.PROJECTION_NAME_SOUTH_GNOMONIC) {
                this.flatGlobe.projection = new WorldWind.ProjectionGnomonic("South");
            }

            if (this.wwd.globe !== this.flatGlobe) {
                this.wwd.globe = this.flatGlobe;
            }
            // Reset to north up to improve the user experience.
            this.resetHeading();
        }
        this.wwd.redraw();
    };

    return Globe;
}
);
