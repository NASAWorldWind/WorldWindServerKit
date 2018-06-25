/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Projections content module
 *
 *@param {Constants} constants 
 * @param {Knockout} ko
 * @param {JQuery} $
 * @returns {ProjectionsViewModel}
 */
define(['model/Constants', 'knockout', 'jquery'],
    function (constants, ko, $) {

        /**
         * The view model for the Projections panel.
         * @constructor
         * @param {Globe} globe The globe that provides the supported projections
         * @param {String} viewFragment HTML
         * @param {String} appendToId Element id of parent
         * @returns {ProjectionsViewModel}
         */
        function ProjectionsViewModel(globe, viewFragment, appendToId) {
            var self = this,
                domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            this.projections = ko.observableArray([
                constants.PROJECTION_NAME_3D,
                constants.PROJECTION_NAME_EQ_RECT,
                constants.PROJECTION_NAME_MERCATOR,
                constants.PROJECTION_NAME_NORTH_POLAR,
                constants.PROJECTION_NAME_SOUTH_POLAR,
                constants.PROJECTION_NAME_NORTH_UPS,
                constants.PROJECTION_NAME_SOUTH_UPS,
                constants.PROJECTION_NAME_NORTH_GNOMONIC,
                constants.PROJECTION_NAME_SOUTH_GNOMONIC
            ]);

            // Track the current projection
            this.currentProjection = ko.observable('3D');

            // Projection click handler
            this.changeProjection = function (projectionName) {
                // Capture the selection
                self.currentProjection(projectionName);
                // Change the projection
                globe.setProjection(projectionName);
            };

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return ProjectionsViewModel;
    }
);
