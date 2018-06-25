/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * D3 PROTOTYPE - WeatherScout content module.
 *
 * @param {type} ko
 * @param {type} $
 * @param {type} d3
 * @param {type} vis
 * @returns {WeatherScoutView}
 */
define(['knockout',
    'jquery',
    'd3',
    'vis'],
    function (ko, $, d3, vis) {

        /**
         * The view for an individual WeatherScout.
         * @constructor
         */
        function WeatherScoutView() {
            var self = this;

            // Define the custom binding used in the #wildfire-view-template template
            ko.bindingHandlers.visualizeTemperature = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called when the binding is first applied to an element
                    // Set up any initial state, event handlers, etc. here
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called once when the binding is first applied to an element,
                    // and again whenever any observables/computeds that are accessed change
                    // Update the DOM element based on the supplied values here.
                    self.drawAirTemperatureGraph(element, viewModel);
                }
            };
            // Define the custom binding used in the #wildfire-view-template template
            ko.bindingHandlers.visualizeHumidity = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called when the binding is first applied to an element
                    // Set up any initial state, event handlers, etc. here
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    // This will be called once when the binding is first applied to an element,
                    // and again whenever any observables/computeds that are accessed change
                    // Update the DOM element based on the supplied values here.
                    self.drawRelativeHumidityGraph(element, viewModel);
                }
            };
        }

        // Generate a vis.js graph for the weather
        WeatherScoutView.prototype.drawAirTemperatureGraph = function (element, wxScout) {
            var forecasts = wxScout.getForecasts(),
                i, len, wx,
                items = [],
                names = ["F "],
                groups = new vis.DataSet();

            groups.add({
                id: 0,
                content: names[0],
                options: {
                    drawPoints: {
                        style: 'square' // square, circle
                    },
                    shaded: {
                        orientation: 'bottom' // top, bottom
                    }
                }
            });

            for (i = 0, len = forecasts.length; i < len; i++) {
                wx = forecasts[i];
                items.push({x: wx.time, y: wx.airTemperatureF, group: 0, label: 'F'});
            }

            var dataset = new vis.DataSet(items);
            var options = {
                dataAxis: {
                    left: {
                        range: {min: 32, max: 120}
                    },
                    icons: true
                },
                legend: true,
                height: 200,
//                    start: forecasts[0].time,
//                    end: forecasts[len-1].time
            };

            // Add a 2D graph to the element
            var graph2d = new vis.Graph2d(element, dataset, groups, options);
        }


        // Generate a vis.js graph for the weather
        WeatherScoutView.prototype.drawRelativeHumidityGraph = function (element, wxScout) {
            var forecasts = wxScout.getForecasts(),
                i, len, wx,
                items = [],
                names = ["RH %"],
                groups = new vis.DataSet();

            groups.add({
                id: 0,
                content: names[0],
                options: {
                    drawPoints: {
                        style: 'circle' // square, circle
                    },
                    shaded: {
                        orientation: 'top' // top, bottom
                    },
                    yAxisOrientation: 'right'
                }
            });

            for (i = 0, len = forecasts.length; i < len; i++) {
                wx = forecasts[i];
                items.push({x: wx.time, y: wx.relaltiveHumidityPct, group: 0});
            }

            var dataset = new vis.DataSet(items);
            var options = {
                dataAxis: {
                    left: {
                        range: {min: 0, max: 100}
                    },
                    icons: true
                },
                legend: true,
                height: 200,
//                    start: forecasts[0].time,
//                    end: forecasts[len-1].time
            };

            // Add a 2D graph to the element
            var graph2d = new vis.Graph2d(element, dataset, groups, options);
        }

        return WeatherScoutView;
    }
);

