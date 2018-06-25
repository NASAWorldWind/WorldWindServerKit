/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * The Settings singleton is responsible for saving and restoring the Explorer view between sessions.
 *
 * @param {Log} log
 *
 * @returns {Settings}
 *
 * @author Bruce Schubert
 */
define(['model/Config',
    'model/util/Log'],
    function (config,
              log) {
        "use strict";
        var Settings = {
            STARTUP_LATITUDE_KEY: "startupLatitude",
            STARTUP_LONGITUDE_KEY: "startupLongitude",
            STARTUP_ALTITUDE_KEY: "startupAltitude",
            STARTUP_ROLL_KEY: "startupRoll",
            STARTUP_TILT_KEY: "startupTilt",
            STARTUP_HEADING_KEY: "startupHeading",
            /**
             * Saves the Explorer session settings to the persistent store.
             * @param {Explorer} explorer
             */
            saveSessionSettings: function (explorer) {
                if (!window.localStorage) {
                    log.warning("Settings", "saveSessionSettings", "Local Storage is not supported!");
                    return;
                }

                var target = explorer.getTargetTerrain(),
                    pos = new WorldWind.Location(target.latitude, target.longitude), // controller.wwd.navigator.lookAtLocation,
                    alt = explorer.wwd.navigator.range,
                    heading = explorer.wwd.navigator.heading,
                    tilt = explorer.wwd.navigator.tilt,
                    roll = explorer.wwd.navigator.roll;

                // Save the eye position
                localStorage.setItem(this.STARTUP_LATITUDE_KEY, pos.latitude);
                localStorage.setItem(this.STARTUP_LONGITUDE_KEY, pos.longitude);
                localStorage.setItem(this.STARTUP_ALTITUDE_KEY, alt);

                // Save the globe orientation.
                localStorage.setItem(this.STARTUP_HEADING_KEY, heading);
                localStorage.setItem(this.STARTUP_TILT_KEY, tilt);
                localStorage.setItem(this.STARTUP_ROLL_KEY, roll);

            },
            /**
             * Restores the Explorer's session settings from the persistent store.
             * @param {Explorer} explorer
             */
            restoreSessionSettings: function (explorer) {
                try {
                    if (!localStorage) {
                        log.warning("Settings", "restoreSessionSettings", "Local Storage is not enabled!");
                        return;
                    }
                    var lat = Number(localStorage.getItem(this.STARTUP_LATITUDE_KEY)),
                        lon = Number(localStorage.getItem(this.STARTUP_LONGITUDE_KEY)),
                        alt = Number(localStorage.getItem(this.STARTUP_ALTITUDE_KEY)),
                        head = Number(localStorage.getItem(this.STARTUP_HEADING_KEY)),
                        tilt = Number(localStorage.getItem(this.STARTUP_TILT_KEY)),
                        roll = Number(localStorage.getItem(this.STARTUP_ROLL_KEY));

                    if (isNaN(lat) || isNaN(lon)) {
                        log.warning("Settings", "restoreSessionSettings", "Previous state invalid: Using default lat/lon.");
                        lat = config.startupLatitude;
                        lon = config.startupLongitude;
                    }
                    if (isNaN(alt)) {
                        log.warning("Settings", "restoreSessionSettings", "Previous state invalid: Using default altitude.");
                        alt = config.startupAltitude;
                    }
                    if (isNaN(head) || isNaN(tilt) || isNaN(roll)) {
                        log.warning("Settings", "restoreSessionSettings", "Previous state invalid: Using default view angles.");
                        head = config.startupHeading;
                        tilt = config.startupTilt;
                        roll = config.startupRoll;
                    }

                    // Initiate animation to target
                    // The animation routine does a better job of
                    // preparing the map layers than does setting
                    // the view of the target (below) because it
                    // drills down through the various levels-of detail.
                    explorer.gotoLatLonAlt(lat, lon, alt);

                    // Restore view of target
                    // This routine doesn't always load the map level-of-detail
                    // appropriate for low alitudes. And you can't call this
                    // routine while lookAtLatLon is animiating.
//                    controller.wwd.navigator.lookAtLocation.latitude = lat;
//                    controller.wwd.navigator.lookAtLocation.longitude = lon;
//                    controller.wwd.navigator.range = alt;
//                    controller.wwd.navigator.heading = head;
//                    controller.wwd.navigator.tilt = tilt;
//                    controller.wwd.navigator.roll = roll;
//                    controller.wwd.redraw();

                } catch (e) {
                    log.error("Settings", "restoreSessionSettings",
                        "Exception occurred processing cookie: " + e.toString());
                }
            }
        };

        return Settings;
    }
);
