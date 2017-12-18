/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

/**
 * Config singleton .
 *
 * @author Bruce Schubert
 */
define(['jquery',
        'model/Constants',
        'model/util/Log',
        'model/util/Settings',
        'worldwind'],
    function ($,
              constants,
              log,
              settings) {
        "use strict";
        /**
         * This is the top-level Config singleton.
         * Holds configuration parameters for WWE. Applications may modify these parameters prior to creating
         * their first Explorer objects. Configuration properties are:
         * <ul>
         *     <li><code>startupLatitude</code>: Initial "look at" latitude. Default is Ventura, CA.
         *     <li><code>startupLongitude</code>: Initial "look at" longitude. Default is Venura, CA.
         *     <li><code>startupLongitude</code>: Initial altitude/eye position. Default 0.
         *     <li><code>startupHeading</code>: Initial view heading. Default 0.
         *     <li><code>startupTilt</code>: Initial view tilt. Default 0.
         *     <li><code>startupRoll</code>: Initial view roll. Default 0.
         *     <li><code>viewControlOrientation</code>: horizontal or vertical. Default vertical.
         *     <li><code>showPanControl</code>: Show pan (left/right/up/down) controls. Default false.
         *     <li><code>showExaggerationControl</code>: Show vertical exaggeration controls. Default false.
         *     <li><code>imageryDetailControl</code>: Requests higher resolution imagery are made when the texture pixel size is greater than this value.
         * </ul>
         */
        var Config = {
            imageryDetailControl: (window.screen.width < 768 ? 2.0 : (window.screen.width < 1024 ? 1.75 : (window.screen.width < 1280 ? 1.6 : 1.5))),
            markerLabels: "Marker",
            startupLatitude: 34.29,
            startupLongitude: -119.29,
            startupAltitude: 1000000,
            startupHeading: 0,
            startupTilt: 0,
            startupRoll: 0,
            showPanControl: false,
            showExaggerationControl: true,
            showFieldOfViewControl: false,
            terrainSampleRadius: 30
      };

        return Config;
    }
);