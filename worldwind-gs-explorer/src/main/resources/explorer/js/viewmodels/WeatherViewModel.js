/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery' , 'model/Constants'],
    function (ko, $, constants) {
        "use strict";
        /**
         *
         * @param {Globe} globe
         * @param {WeatherScoutManager} weatherScoutManager
         * @constructor
         */
        function WeatherViewModel(globe, weatherScoutManager, viewElementId, viewUrl, appendToId) {
            var self = this;
            this.view = null;
            
            this.weatherScouts = weatherScoutManager.scouts;

            /** "Goto" function centers the globe on a selected weatherScout */
            this.gotoWeatherScout = function (weatherScout) {
                globe.goto(weatherScout.latitude(), weatherScout.longitude());
                globe.selectController.doSelect(weatherScout);
            };

            /** "Edit" function invokes a modal dialog to edit the weatherScout attributes */
            this.editWeatherScout = function (weatherScout) {
                if (weatherScout.isOpenable) {
                    weatherScout.open();
                }
            };

            /** "Remove" function removes a weatherScout from the globe */
            this.removeWeatherScout = function (weatherScout) {
                if (weatherScout.isRemovable) {
                    weatherScout.remove();
                }
            };

            //
            // Load the view html into the DOM and apply the Knockout bindings
            //
            $.ajax({
                async: false,
                dataType: 'html',
                url: viewUrl,
                success: function (data) {
                    // Load the view html into the specified DOM element
                    $("#" + appendToId).append(data);

                    // Update the view member
                    self.view = document.getElementById(viewElementId);

                    // Binds the view to this view model.
                    ko.applyBindings(self, self.view);
                }
            });
        }

        return WeatherViewModel;
    }
);