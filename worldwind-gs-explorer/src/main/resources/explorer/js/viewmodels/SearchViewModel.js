/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/*global WorldWind*/

/**
 * Search content module.
 * @param {Knockout} ko library
 */
define(['model/util/Log', 'knockout', 'jquery', 'jquery-growl', 'worldwind'],
    function (log, ko, $) {
        "use strict";
        /**
         * The view model for the Search panel.
         * Uses the MapQuest Nominatim API. Requires an access key. See: https://developer.mapquest.com/
         * @constructor
         * @param {Globe} globe The globe that provides the supported projections
         * @param {String} viewElementId  
         */
        function SearchViewModel(globe, viewElementId) {
            var self = this,
                wwd = globe.wwd,
                accessKey = null;   // MapQuest API key. 

            this.geocoder = new WorldWind.NominatimGeocoder();
            this.goToAnimator = new WorldWind.GoToAnimator(wwd);
            this.searchText = ko.observable('');

            this.onEnter = function (data, event) {
                if (event.keyCode === 13) {
                    self.performSearch();
                }
                return true;
            };

            this.performSearch = function () {
                // MapQuest API access key is needed to use this function.
                // See: https://developer.mapquest.com/
                if (!accessKey) {
                    log.error("SearchViewModel", "performSearch", "Missing MapQuest API key. See: https://developer.mapquest.com/");
                    $.growl.warning({message: "A MapQuest API key is required to use the search. See https://developer.mapquest.com/"});
                    return;
                }
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
                        }, accessKey);
                    }
                }
            };

            // Binds the view to this view model.
            ko.applyBindings(this, document.getElementById(viewElementId));

        }
        return SearchViewModel;
    }
);
