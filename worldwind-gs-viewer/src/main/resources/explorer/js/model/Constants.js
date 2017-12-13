/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */
define([],
    function () {
        "use strict";
        var Constants = {

            BUTTON_TEXT_CANCEL: 'Cancel',
            BUTTON_TEXT_DELETE: 'Delete',
            BUTTON_TEXT_GOTO: 'Go To',
            BUTTON_TEXT_NO: 'No',
            BUTTON_TEXT_OK: 'OK',
            BUTTON_TEXT_SAVE: 'Save',
            BUTTON_TEXT_YES: 'Yes',
            GEOMETRY_POINT: 'point',
            GEOMETRY_POLYGON: 'polygon',
            GEOMETRY_POLYLINE: 'polyline',
            GEOMETRY_UNKNOWN: 'unknown',
            /**
             * Base URL for WMT application images. (Do not use a relative path.)
             */
            IMAGE_PATH: "js/model/images/",
            /**
             * Layer categories
             */
            LAYER_CATEGORY_BACKGROUND: "Background",
            LAYER_CATEGORY_BASE: "Base",
            LAYER_CATEGORY_DATA: "Data",
            LAYER_CATEGORY_EFFECT: "Effect",
            LAYER_CATEGORY_OVERLAY: "Overlay",
            LAYER_CATEGORY_WIDGET: "Widget",
            /**
             * The display name for the layer that displays markers.
             */
            LAYER_NAME_COMPASS: "Compass",
            LAYER_NAME_MARKERS: "Markers",
            LAYER_NAME_RETICLE: "Crosshairs",
            LAYER_NAME_SKY: "Sky",
            LAYER_NAME_TIME_ZONES: "Time Zones",
            LAYER_NAME_VIEW_CONTROLS: "Controls",
            LAYER_NAME_WIDGETS: "Widgets",
            MARKER_LABEL_LATLON: "markerLabelLatLon",
            MARKER_LABEL_NAME: "markerLabelName",
            MARKER_LABEL_NONE: "markerLabelNone",
            MARKER_LABEL_PLACE: "markerLabelPlace",
            /**
             * The maximum range that the globe can be zoomed out to.
             * @default 20,000,000 meters.
             */
            NAVIGATOR_MAX_RANGE: 20000000,
            PROJECTION_NAME_3D: "3D",
            PROJECTION_NAME_EQ_RECT: "Equirectangular",
            PROJECTION_NAME_MERCATOR: "Mercator",
            PROJECTION_NAME_NORTH_POLAR: "North Polar",
            PROJECTION_NAME_SOUTH_POLAR: "South Polar",
            PROJECTION_NAME_NORTH_UPS: "North UPS",
            PROJECTION_NAME_SOUTH_UPS: "South UPS",
            PROJECTION_NAME_NORTH_GNOMONIC: "North Gnomic",
            PROJECTION_NAME_SOUTH_GNOMONIC: "South Gnomic",
            /**
             * The local storage key for markers.
             */
            STORAGE_KEY_MARKERS: "markers",

            /**
             * Base URL for Web World Wind SDK. (Do not use a relative path.)
             * @default "js/libs/webworldwind/"
             * @constant
             */
            WORLD_WIND_PATH: "js/libs/webworldwind/"
        };

        return Constants;
    }
);