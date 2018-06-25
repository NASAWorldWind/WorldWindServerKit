/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License - http://www.opensource.org/licenses/mit-license
 */

/* global WorldWind */

/**
 * The LayerManager manages categorical, observable lists of Layer objects. It itself observable,
 * and it injects some observable properties into the individual Layer objects.
 *
 * @param {Knockout} ko object
 * @param {Config} config object
 * @param {Constants} constants object
 * @param {EnhancedWmsLayer} EnhancedWmsLayer class
 * @param {Log} log object
 * @param {WorldWind} ww object
 * @returns {LayerManager}
 */
define([
    'knockout',
    'model/Config',
    'model/Constants',
    'model/globe/layers/EnhancedWmsLayer',
    'model/util/Log',
    'worldwind',
    'url-search-params'],
    function (
        ko,
        config,
        constants,
        EnhancedWmsLayer,
        log,
        ww,
        URLSearchParams) {
        "use strict";
        /**
         *
         * @param {Globe} globe
         * @returns {LayerManager}
         */
        var LayerManagerHelper = function () {

        }


        LayerManagerHelper.nextServerId = 0;
        LayerManagerHelper.loadServerCapabilites = function (serverAddress, wmsCapsDoc) {
            var wmsService = wmsCapsDoc.service,
                wmsLayers = wmsCapsDoc.capability.layers,
                server = {
                    id: LayerManagerHelper.nextServerId++,
                    address: serverAddress,
                    service: wmsService,
                    title: ko.observable(wmsService.title && wmsService.title.length > 0 ? wmsService.title : serverAddress),
                    layers: ko.observableArray()
                },
                result, i, numLayers;


            // Don't show the top-level layer if it's a grouping layer with the same title as the server title.
            // The NEO server is set up this way, for example.
            if ((wmsLayers.length === 1) && (wmsLayers[0].layers) &&
                (wmsLayers[0].title === wmsCapsDoc.service.title) && !(wmsLayers[0].name && wmsLayers[0].name.length > 0)) {
                wmsLayers = wmsLayers[0].layers;
            }

            LayerManagerHelper.assembleLayers(wmsLayers, server.layers);

            return server;
        };

        /**
         *
         * @param {type} wmsLayers Array of layer capabilities
         * @param {observableArray} layerNodes Array of layer nodes
         * @returns {observableArray}
         */
        LayerManagerHelper.assembleLayers = function (wmsLayers, layerNodes) {

            for (var i = 0; i < wmsLayers.length; i++) {
                var layer = wmsLayers[i],
                    isLayer = ko.observable(layer.name && layer.name.length > 0 || false),
                    node = {
                        title: layer.title,
                        abstract: layer.abstract,
                        layerCaps: layer,
                        isChecked: ko.observable(false),
                        isFolder: !isLayer,
                        isLayer: isLayer,
                        layers: ko.observableArray()   // children
                    };

                if (layer.layers && layer.layers.length > 0) {
                    this.assembleLayers(layer.layers, node.layers);
                }

                layerNodes.push(node);
            }

            return layerNodes;
        };


        /**
         * 
         * @param {Object} layerCaps
         * @returns {EnhancedWmsLayer|WorldWind.WmsTimeDimensionedLayer|LayerManagerHelperL#31.LayerManagerHelper.createLayerFromCapabilities.layer}
         */
        LayerManagerHelper.createLayerFromCapabilities = function (layerCaps) {
            if (layerCaps.name) {
                var config = WorldWind.WmsLayer.formLayerConfiguration(layerCaps, null);
                var layer;

                if (config.timeSequences &&
                    (config.timeSequences[config.timeSequences.length - 1] instanceof WorldWind.PeriodicTimeSequence)) {
                    var timeSequence = config.timeSequences[config.timeSequences.length - 1];
                    config.levelZeroDelta = new WorldWind.Location(180, 180);
                    layer = new WorldWind.WmsTimeDimensionedLayer(config);
                    layer.opacity = 0.8;
                    layer.time = timeSequence.startTime;
//                        this.timeSeriesPlayer.timeSequence = timeSequence;
//                        this.timeSeriesPlayer.layer = layer;
                    layer.timeSequence = timeSequence;

                    //for (var t = timeSequence.currentTime; t != null; t = timeSequence.next()) {
                    //    console.log(t.toISOString());
                    //}
                    //timeSequence.reset();

                } else if (config.timeSequences &&
                    (config.timeSequences[config.timeSequences.length - 1] instanceof Date)) {
                    timeSequence = config.timeSequences[config.timeSequences.length - 1];
                    config.levelZeroDelta = new WorldWind.Location(180, 180);
                    layer = new WorldWind.WmsTimeDimensionedLayer(config);
                    layer.opacity = 0.8;
                    layer.time = config.timeSequences[0];
//                        this.timeSeriesPlayer.timeSequence = new WorldWind.BasicTimeSequence(config.timeSequences);
//                        this.timeSeriesPlayer.layer = layer;
                    layer.timeSequence = timeSequence;
                } else {
                    layer = new EnhancedWmsLayer(config, null);
//                        layer = new WorldWind.WmsLayer(config, null);
//                        this.timeSeriesPlayer.timeSequence = null;
//                        this.timeSeriesPlayer.layer = null;
                }

                if (layerCaps.styles && layerCaps.styles.length > 0
                    && layerCaps.styles[0].legendUrls && layerCaps.styles[0].legendUrls.length > 0) {
                    // Add the legend url to the layer object so we can
                    // draw an image using the url as the image source
                    layer.legendUrl = layerCaps.styles[0].legendUrls[0];
                }

                // TODO: pass in category; add to selected category
                layer.enabled = true;
                return layer;
            }

            return null;
        };



        /**
         * Applys or adds the options to the given layer.
         * @param {WorldWind.Layer} layer The layer to update
         * @param {Object} options The options to apply
         * @param {String} category The category the layer should be assigned to
         */
        LayerManagerHelper.applyOptionsToLayer = function (layer, options, category) {
            var opt = (options === undefined) ? {} : options;

            // Explorer layer type
            layer.category = category;

            // Propagate enabled and pick options to the layer object
            layer.enabled = opt.enabled === undefined ? true : opt.enabled;

            // Picking is disabled by default.
            layer.pickEnabled = opt.pickEnabled === undefined ? false : opt.enabled;

            // Add refresh capability
            if (opt.isTemporal) {
                layer.isTemporal = true;
            }

            // Apply the level-of-detail control, if provided
            // A request for higher resolution imagery is made when the texture 
            // pixel size is greater than the detailControl value.
            if (opt.detailControl) {
                // layer default is 1.75
                layer.detailControl = opt.detailControl;
            }

            // Apply the opacity, if provided
            if (opt.opacity) {
                layer.opacity = opt.opacity;
            }

            // Propagate (and invert) the visibilty of this layer in the UI
            layer.showInMenu = opt.hideInMenu === undefined ? true : !opt.hideInMenu;

        };


        /**
         * Restores the state for a layer from local storage.
         * @param {LayerProxy} layerProxy An individual layer view model object.
         */
        LayerManagerHelper.applyRestoreState = function (layerProxy) {
            var persistSettingsString = localStorage.getItem(layerProxy.category()), persistSettings, layerSettings;
            if (persistSettingsString) {
                persistSettings = JSON.parse(persistSettingsString);
                for (var i = 0; i < persistSettings.length; i++) {
                    layerSettings = persistSettings[i];
                    if (layerSettings.name === layerProxy.name()) {
                        layerProxy.enabled(layerSettings.enabled);
                        layerProxy.opacity(layerSettings.opacity);
                        layerProxy.order(layerSettings.order);
                    }
                }
            }
        };

        /**
         * Finds the first layer with a matching name (displayName) attribute.
         * 
         * @param {String} name The name to compare to the layer's displayName
         * @param {ObservableArray} layers An array of layer view models
         * @returns {LayerProxy} A layer view model object or null if not found
         */
        LayerManagerHelper.findLayerViewModel = function (name, layerProxies) {
            var i, len;

            if (!name) {
                return null;
            }

            for (i = 0, len = layerProxies().length; i < len; i++) {
                if (layerProxies()[i].name() === name) {
                    return layerProxies()[i];
                }
            }
            return null;
        };

        /**
         * 
         * @param {type} layer
         * @param {type} moveToIndex
         * @param {type} layers
         * @returns {undefined}
         */
        LayerManagerHelper.moveLayerInArray = function (layer, moveToIndex, layers) {
            var initialIndex = layers.indexOf(layer);
            if (initialIndex < 0) {
                // TODO - it didn't find it, what does this mean...
                console.log('TODO - index not found');
                return;
            }

            if (moveToIndex < 0) {
                return;
            }

            if (initialIndex === moveToIndex) {
                // no need to move
                return;
            }

            layers.splice(moveToIndex, 0, layer);
            if (initialIndex > moveToIndex) {
                // layer moved 'up' the following indices are off by one
                layers.splice(initialIndex + 1, 1);
            } else {
                layers.splice(initialIndex, 1);
            }
        };

        /**
         * Moves the WorldWindow camera to the center coordinates of the layer, and then zooms in (or out)
         * to provide a view of the layer as complete as possible.
         * @param {LayerProxy} layer A layer proxy that the user selected for zooming
         * @param {Globe} globe The globe used for zooming
         * TODO: Make this to work when Sector/Bounding box crosses the 180° meridian
         */
        LayerManagerHelper.zoomToLayer = function (layer, globe) {

            // Verify layer sector (bounding box in 2D terms) existence and
            // do not center the camera if layer covers the whole globe.
            var layerSector = layer.wwLayer.bbox; // property of EnhancedWmsLayer
            // layerSector = setTestSector(layerSector, "hawaii"); // Test with known sectors
            if (layerSector == null) { // null or undefined.
                $.growl.error({message: "No Layer sector / bounding box defined!"});
                return;
            }

            // Comparing each boundary of the sector to verify layer global coverage.
            if (layerSector.maxLatitude === 90 &&
                layerSector.minLatitude === -90 &&
                layerSector.maxLongitude === 180 &&
                layerSector.minLongitude === -180) {
                $.growl.notice({message: "The selected layer covers the full globe. No camera centering needed."});
                return;
            }

            // Obtain layer center
            var layerCenterPosition = findLayerCenter(layerSector);
            // Move camera to position
            globe.goto(layerCenterPosition.latitude, layerCenterPosition.longitude, defineZoomLevel(layerSector));

            // Classical formula to obtain middle point between two coordinates
            function findLayerCenter(layerSector) {
                var centerLatitude = (layerSector.maxLatitude + layerSector.minLatitude) / 2;
                var centerLongitude = (layerSector.maxLongitude + layerSector.minLongitude) / 2;
                var layerCenter = new WorldWind.Position(centerLatitude, centerLongitude);
                return layerCenter;
            }

            // Zoom level is obtained following this simple method: Calculate approx arc length of the
            // sectors' diagonal, and set that as the range (altitude) of the camera.
            function defineZoomLevel(layerSector) {
                var verticalBoundary = layerSector.maxLatitude - layerSector.minLatitude;
                var horizontalBoundary = layerSector.maxLongitude - layerSector.minLongitude;

                // Calculate diagonal angle between boundaries (simple pythagoras formula, we don't need to
                // consider vectors or great circles).
                var diagonalAngle = Math.sqrt(Math.pow(verticalBoundary, 2) + Math.pow(horizontalBoundary, 2));

                // If the diagonal angle is equal or more than an hemisphere (180°) don't change zoom level.
                // Else, use the diagonal arc length as camera altitude.
                if (diagonalAngle >= 180) {
                    return null;
                } else {
                    // Gross approximation of longitude of arc in km
                    // (assuming spherical Earth with radius of 6,371 km. Accuracy is not needed for this).
                    var diagonalArcLength = (diagonalAngle / 360) * (2 * 3.1416 * 6371000);
                    return diagonalArcLength;
                }
            }

            // Predefined known sectors. For testing purposes only
            // obtained with: http://boundingbox.klokantech.com/
            function setTestSector(layerSector, place) {
                switch (place) {
                    case "switzerland":
                        layerSector.maxLatitude = 47.8084;
                        layerSector.minLatitude = 45.818;
                        layerSector.maxLongitude = 10.4921;
                        layerSector.minLongitude = 5.9559;
                        break;

                    case "mexico":
                        layerSector.maxLatitude = 33.1;
                        layerSector.minLatitude = 12.0;
                        layerSector.maxLongitude = -85.8;
                        layerSector.minLongitude = -117.3;
                        break;

                    case "new zealand":
                        layerSector.maxLatitude = -34.65;
                        layerSector.minLatitude = -47.31;
                        layerSector.maxLongitude = 178.75;
                        layerSector.minLongitude = 163.78;
                        break;

                    case "hawaii":
                        layerSector.maxLatitude = 22.95;
                        layerSector.minLatitude = 18.07;
                        layerSector.maxLongitude = -154.3;
                        layerSector.minLongitude = -161.25;
                        break;

                    case "madagascar":
                        layerSector.maxLatitude = -11.97;
                        layerSector.minLatitude = -25.9;
                        layerSector.maxLongitude = 51.28;
                        layerSector.minLongitude = 42.41;
                        break;
                    default:
                        console.log("Place name error");
                }

                return layerSector;
            }

        };

        return LayerManagerHelper;
    }
);

