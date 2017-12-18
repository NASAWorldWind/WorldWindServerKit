/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Settings content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {SettingsViewModel}
 */
define(['knockout',
        'jquery',
        'model/Constants'],
    function (ko, $, constants) {

        /**
         * The view model for the Home panel.
         * @constructor
         */
        function SettingsViewModel(globe) {
            var self = this;
            
            this.globe = globe;
            this.timeZoneDetectEnabled = globe.timeZoneDetectEnabled;
            this.use24Time = globe.use24Time;

        }

        return SettingsViewModel;
    }
);
