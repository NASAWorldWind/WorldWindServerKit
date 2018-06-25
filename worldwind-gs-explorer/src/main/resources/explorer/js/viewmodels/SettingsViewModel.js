/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Settings content module
 *
 * @param {Constants} constants
 * @param {Knockout} ko
 * @param {JQuery} $
 * @param {Moment} moment
 * @returns {SettingsViewModel}
 */
define(['model/Constants',
    'knockout',
    'jquery',
    'moment'],
    function (constants, ko, $, moment) {

        /**
         * The view model for the Settings panel.
         * 
         * @constructor
         * @param {Globe} globe
         * @param {String} viewFragment HTML
         * @param {String} appendToId Parent element id
         * @returns {SettingsViewModel}
         */
        function SettingsViewModel(globe, viewFragment, appendToId) {
            var self = this,
                domNodes = $.parseHTML(viewFragment),
                skyLayer, starsLayer, atmosphereLayer, timeZoneLayer, viewControls, widgets, crosshairs,
                tessellation, frameStatistics;

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            this.globe = globe;
            this.layerManager = globe.layerManager;


            skyLayer = this.layerManager.findLayer(constants.LAYER_NAME_SKY);
            starsLayer = this.layerManager.findLayer(constants.LAYER_NAME_STARS);
            atmosphereLayer = this.layerManager.findLayer(constants.LAYER_NAME_ATMOSPHERE);
            timeZoneLayer = this.layerManager.findLayer(constants.LAYER_NAME_TIME_ZONES);
            viewControls = this.layerManager.findLayer(constants.LAYER_NAME_VIEW_CONTROLS);
            widgets = this.layerManager.findLayer(constants.LAYER_NAME_WIDGETS);
            crosshairs = this.layerManager.findLayer(constants.LAYER_NAME_RETICLE);
            tessellation = this.layerManager.findLayer("Show Tessellation");
            frameStatistics = this.layerManager.findLayer("Frame Statistics");

            //
            // Observables
            //

            /**
             * The current state of the time zones layer (settable).
             */
            this.timeZonesEnabled = timeZoneLayer ? timeZoneLayer.enabled : ko.observable();
            /**
             * The current state of the time zones layer opacity (settable).
             */
            this.timeZonesOpacity = timeZoneLayer ? timeZoneLayer.opacity : ko.observable();
            /**
             * The globe's timeZoneDetectEnabled observable setting (settable).
             */
            this.timeZoneDetectEnabled = globe.timeZoneDetectEnabled;
            this.timeZoneDetectEnabled.subscribe(function (newValue) {
                self.timeZonesEnabled(newValue);
            });
            /**
             * The globe's use24Time observable setting.
             */
            this.use24Time = globe.use24Time;
            /**
             * Tracks the current background color selection. Used by radio buttons in the view.
             */
            this.backgroundColor = ko.observable(skyLayer && skyLayer.enabled() ? "blue" : "black");
            /**
             * The current state of the blue background layer (settable).
             */
            this.blueBackgroundEnabled = skyLayer ? skyLayer.enabled : ko.observable();
            /**
             * The state of the black background (read-only).
             */
            this.blackBackgroundEnabled = ko.computed(function () {
                return skyLayer ? !skyLayer.enabled() : true;
            });
            /**
             * The current state of the star field layer (settable).
             */
            this.starsBackgroundEnabled = starsLayer ? starsLayer.enabled : ko.observable();
            /**
             * The current state of the atmosphere layer (settable)
             */
            this.atmosphereBackgroundEnabled = atmosphereLayer ? atmosphereLayer.enabled : ko.observable();
            /**
             * The current opacity level for the atmosphere's nightime effect
             */
            this.nightOpacity = atmosphereLayer ? atmosphereLayer.opacity : ko.observable();

            this.dayNightEnabled = ko.observable(false);


            this.viewControlsEnabled = viewControls ? viewControls.enabled : ko.observable();
            this.widgetsEnabled = widgets ? widgets.enabled : ko.observable();
            this.crosshairsEnabled = crosshairs ? crosshairs.enabled : ko.observable();
            this.tessellationEnabled = tessellation ? tessellation.enabled : ko.observable();
            this.frameStatisticsEnabled = frameStatistics ? frameStatistics.enabled : ko.observable();

            /**
             * Background color selection handler
             * @param {String} newValue background color 
             */
            this.backgroundColor.subscribe(function (newValue) {
                switch (newValue) {
                    case "blue":
                        self.blueBackgroundEnabled(true);
                        break;
                    case "black":
                        self.blueBackgroundEnabled(false);
                        // The sky background layer manipulates the canvas' background color.
                        // When it's disabled, the last used color remains in the canvas.
                        // Set the background color to the default when the background is disabled.
                        $(self.globe.wwd.canvas).css('background-color', 'black');
                        break;
                }
            });


            /**
             * Turn off stars if the default background layer is enabled.
             * @param {Boolean} newValue day/night ensbled state 
             */
            this.dayNightEnabled.subscribe(function (newValue) {
                if (atmosphereLayer) {
                    atmosphereLayer.wwLayer.nightEnabled = newValue;
                }
                if (starsLayer) {
                    starsLayer.wwLayer.sunEnabled = newValue;
                }
                // Tickle the time to force a redraw of the day/night
                var time = new moment(globe.dateTime());
                globe.dateTime(time.add(1, 'ms').toDate());
                globe.redraw();
                globe.dateTime(time.subtract(1, 'ms').toDate());
                globe.redraw();

            });

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return SettingsViewModel;
    }
);
