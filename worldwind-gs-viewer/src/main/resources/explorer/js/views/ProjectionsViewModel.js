/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Projections content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {ProjectionsViewModel}
 */
define(['knockout',
        'jquery',
        'model/Constants'],
    function (ko, $, constants) {

        /**
         * The view model for the Projections panel.
         * @param {Globe} globe The globe that provides the supported projections
         * @constructor
         */
        function ProjectionsViewModel(globe) {
            var self = this;

            self.projections = ko.observableArray([
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
            self.currentProjection = ko.observable('3D');

            // Projection click handler
            self.changeProjection = function (projectionName) {
                // Capture the selection
                self.currentProjection(projectionName);
                // Change the projection
                globe.setProjection(projectionName);
            };
        }

        return ProjectionsViewModel;
    }
);
