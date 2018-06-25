/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define([
    'knockout',
    'jquery'],
    function (
        ko,
        $) {
        "use strict";
        /**
         * @constructor
         * @param {String} viewFragment HTML
         * @param {String} appendToId Parent element id
         * @returns {MarkersViewModel}
         */
        function MarkersViewModel(viewFragment, appendToId) {
            var domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);


            /**
             * Appends a view fragment to the markers view.
             * @param {Object} viewModel the view model to bind to the view fragment
             * @param {String} viewFragment HTML
             * @param {String} appendToId Element to append to (default: markers-body)
             */
            this.addMarkers = function (viewModel, viewFragment, appendToId) {
                var domNodes = $.parseHTML(viewFragment);

                // Load the view html into the parent view element
                $("#" + (appendToId || "markers-body")).append(domNodes);

                // Binds the view to this view model.
                ko.applyBindings(viewModel, domNodes[0]);
            };
        }

        return MarkersViewModel;
    }
);