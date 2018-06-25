/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define(['knockout', 'jquery', 'jqueryui'],
    function (ko, $) {
        "use strict";
        /**
         * @constructor
         * @param {String} viewFragment HTML
         * @returns {MarkerEditor}
         */
        function MarkerEditor(viewFragment) {
            var self = this;

            // Load the view fragment into the DOM's body.
            // Wrap the view in a hidden div for use in a JQuery UI dialog.
            var $view = $('<div style="display: none"></div>')
                .append(viewFragment)
                .appendTo($('body'));
            this.view = $view.children().first().get(0);

            this.marker = ko.observable({});

            this.open = function (marker) {
                console.log("Open Marker: " + marker.name());

                // Update observable(s)
                self.marker(marker);

                // Open the dialog
                var $markerEditor = $(self.view);
                $markerEditor.dialog({
                    autoOpen: false,
                    title: "Edit Marker"
                });
                $markerEditor.dialog("open");
            };
            
            // Binds the view to this view model.
            ko.applyBindings(this, this.view);

        }

        return MarkerEditor;
    }
);