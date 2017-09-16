/**
 * Created by bds_000 on 6/7/2016.
 */
define([
    'knockout',
    'model/util/Log',
    'model/sun/SolarCalculator'],
        function (ko,
                log,
                SolarCalculator) {
            "use strict";
            /**
             * This module is under development and subject to change. 
             * DO NOT USE.
             * 
             * @param {observable(Date)} time An observable Date object.
             * @param {observable(Object)} location An observable Object containing latitude and longitude members.
             * @constructor
             */
            var SolarModel = function (time, location) {
                // TODO: Assert time and location are observables
                // TODO: Assert location has latitude and logitude members
                
                var solarCalculator = new SolarCalculator();
                /**
                 * An observable sunglight object, updated whenever the time or location changes.
                 * @type observable{Object}
                 */
                this.sunlight = ko.pureComputed(function () {
                    return solarCalculator.calculate(
                            time(),
                            -(time().getTimezoneOffset() / 60),
                            location().latitude,
                            location().longitude);
                });
            };

            return SolarModel;
        }
);
