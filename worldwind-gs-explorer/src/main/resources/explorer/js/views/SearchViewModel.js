/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/*global WorldWind*/

/**
 * Search content module
 */
define(['knockout',
        'jquery',
        'worldwind'],
    function (ko, $, ww) {
        "use strict";
        /**
         * The view model for the Search panel.
         * @param {Globe} globe The globe that provides the supported projections
         * @constructor
         */
        function SearchViewModel(globe) {
            var self = this,
                wwd = globe.wwd;

            self.geocoder = new WorldWind.NominatimGeocoder();
            self.goToAnimator = new WorldWind.GoToAnimator(wwd);
            self.searchText = ko.observable('');
            self.onEnter = function (data, event) {
                if (event.keyCode === 13) {
                    self.performSearch();
                }
                return true;
            };
            self.performSearch = function () {
                var queryString = self.searchText();
                if (queryString) {
                    var latitude, longitude;
                    if (queryString.match(WorldWind.WWUtil.latLonRegex)) {
                        var tokens = queryString.split(",");
                        latitude = parseFloat(tokens[0]);
                        longitude = parseFloat(tokens[1]);
                        self.goToAnimator.goTo(new WorldWind.Location(latitude, longitude));
                    } else {
                        self.geocoder.lookup(queryString, function (geocoder, result) {
                            if (result.length > 0) {
                                latitude = parseFloat(result[0].lat);
                                longitude = parseFloat(result[0].lon);
                                self.goToAnimator.goTo(new WorldWind.Location(latitude, longitude));
                            }
                        });
                    }
                }
            };
        }
        return SearchViewModel;
    }
);
