/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global require, requirejs, WorldWind */

/**
 * Require.js bootstrapping javascript
 */
requirejs.config({
// Path mappings for the logical module names
    paths: {
        'knockout': 'libs/knockout/knockout-3.4.0.debug',
        'jquery': 'libs/jquery/jquery-2.1.3',
        'jqueryui': 'libs/jquery-ui/jquery-ui-1.11.4',
        'jquery-growl': 'libs/jquery-plugins/jquery.growl',
        'bootstrap': 'libs/bootstrap/v3.3.6/bootstrap',
        'moment': 'libs/moment/moment-2.14.1',
        'd3': 'libs/d3/d3',
        'url-search-params': 'libs/url-search-params/url-search-params.max.amd',
        'vis': 'libs/vis/v4.16.1/vis',
        'worldwind': 'libs/webworldwind/worldwind',
        'model': 'model' // root application path
    },
    // Shim configuration for Bootstrap's JQuery dependency
    shim: {
        "bootstrap": {
            deps: ["jquery"],
            exports: "$.fn.popover"
        }
    }
});

/**
 * A top-level require call executed by the Application.
 */
require(['knockout', 'jquery', 'bootstrap', 'worldwind',
    'model/Config',
    'model/Constants',
    'model/Explorer',
    'model/globe/Globe',
    'views/BookmarkViewModel',
    'views/GlobeViewModel',
    'views/HeaderViewModel',
    'views/LayersViewModel',
    'views/MarkerEditor',
    'views/MarkersViewModel',
    'views/OutputViewModel',
    'views/ProjectionsViewModel',
    'views/SearchViewModel',
    'views/SettingsViewModel'],
    function (ko, $, bootstrap, ww,
        config,
        constants,
        explorer,
        Globe,
        BookmarkViewModel,
        GlobeViewModel,
        HeaderViewModel,
        LayersViewModel,
        MarkerEditor,
        MarkersViewModel,
        OuputViewModel,
        ProjectionsViewModel,
        SearchViewModel,
        SettingsViewModel) { // this callback gets executed when all required modules are loaded
        "use strict";
        // ----------------
        // Setup the globe
        // ----------------
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
        WorldWind.configuration.baseUrl = ww.WWUtil.currentUrlSansFilePart() + "/" + constants.WORLD_WIND_PATH;

        // Define the configuration for the primary globe
        var globeOptions = {
            showBackground: true,
            showReticule: true,
            showViewControls: true,
            includePanControls: config.showPanControl,
            includeRotateControls: true,
            includeTiltControls: true,
            includeZoomControls: true,
            includeExaggerationControls: config.showExaggerationControl,
            includeFieldOfViewControls: config.showFieldOfViewControl},
            globe;

        // Create the explorer's primary globe that's associated with the specified HTML5 canvas
        globe = new Globe(new WorldWind.WorldWindow("canvasOne"), globeOptions);

        // Initialize the Explorer object with a basic Globe to "explore"
        explorer.initialize(globe);

        // Load additional layers and layer options
        globe.layerManager.loadDefaultLayers();

        // --------------------------------------------------------
        // Bind view models to the corresponding HTML elements
        // --------------------------------------------------------
        ko.applyBindings(new GlobeViewModel(globe, {markerManager: explorer.markerManager}), document.getElementById('globe'));
        ko.applyBindings(new HeaderViewModel(), document.getElementById('header'));
        ko.applyBindings(new ProjectionsViewModel(globe), document.getElementById('projections'));
        ko.applyBindings(new SearchViewModel(globe), document.getElementById('search'));
        ko.applyBindings(new LayersViewModel(globe), document.getElementById('layers'));
        ko.applyBindings(new MarkersViewModel(globe, explorer.markerManager), document.getElementById('markers'));
        ko.applyBindings(new SettingsViewModel(globe), document.getElementById('settings'));
        ko.applyBindings(new MarkerEditor(), document.getElementById('marker-editor'));
        ko.applyBindings(new OuputViewModel(globe), document.getElementById('output'));
        ko.applyBindings(new BookmarkViewModel(globe), document.getElementById('bookmark'));

        // -----------------------------------------------------------
        // Add handlers to auto-expand/collapse the menus
        // -----------------------------------------------------------
        // Auto-expand menu section-bodies when not small
        $(window).resize(function () {
            if ($(window).width() >= 768) {
                $('.section-body').collapse('show');
            }
        });
        // Auto-collapse navbar when its tab items are clicked
        $('.navbar-collapse a[role="tab"]').click(function () {
            $('.navbar-collapse').collapse('hide');
        });
        // Auto-scroll-into-view expanded dropdown menus
        $('.dropdown').on('shown.bs.dropdown', function (event) {
            event.target.scrollIntoView(false); // align to bottom
        });

        // ------------------------------------------------------------
        // Add handlers to save/restore the session
        // -----------------------------------------------------------
        // Add event handler to save the current view (eye position) and markers when the window closes
        window.onbeforeunload = function () {
            explorer.saveSession();
            // Return null to close quietly on Chrome and FireFox.
            return null;
        };

        // Now that MVC is set up, restore the model from the previous session.
        explorer.restoreSession();
    }
);
