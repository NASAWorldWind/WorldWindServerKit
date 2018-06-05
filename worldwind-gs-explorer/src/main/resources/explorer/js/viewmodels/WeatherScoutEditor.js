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
        function WeatherScoutEditor(viewElementID, viewUrl) {
            var self = this;
            
            this.view = null;
            this.scout = ko.observable({});

            this.open = function (scout) {
                console.log("Open Wx Scout: " + scout.name());
                self.scout(scout);

                // Prepare a JQuery UI dialog
                var $editorElement = $(self.view);
                $editorElement.dialog({
                    autoOpen: false,
                    title: "Edit Weather Scout"
                });

                // Open the dialog
                $editorElement.dialog("open");
            };
            
            // Load the view html into the DOM and apply the Knockout bindings
            $.ajax({
                async: false,
                dataType: 'html',
                url: viewUrl,
                success: function (data) {
                    // Load the view html into the DOM's body
                    $('body').append(data);

                    // Update the view 
                    self.view = document.getElementById(viewElementID);

                    // Binds the view to this view model.
                    ko.applyBindings(self, self.view);
                }
            });


        }

        return WeatherScoutEditor;
    }
);