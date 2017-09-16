/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery', 'jqueryui'],
    function (ko, $) {
        "use strict";
        /**
         *
         * @constructor
         */
        function WeatherScoutEditor() {
            var self = this;
            self.scout = ko.observable({});

            self.open = function (scout) {
                console.log("Open Wx Scout: " + scout.name());
                self.scout(scout);

                // Prepare a JQuery UI dialog
                var $editorElement = $("#weather-scout-editor");
                $editorElement.dialog({
                    autoOpen: false,
                    title: "Edit Weather Scout"
                });

                // Open the dialog
                $editorElement.dialog("open");
            };

        }

        return WeatherScoutEditor;
    }
);