/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License - http://www.opensource.org/licenses/mit-license
 */

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
define(['knockout',
    'model/Config',
    'model/Constants',
    'model/globe/layers/EnhancedWmsLayer',
    'model/util/Log',
    'worldwind'],
        function (ko,
                config,
                constants,
                EnhancedWmsLayer,
                log,
                ww) {
            "use strict";
            /**
             *
             * @param {Globe} globe
             * @returns {LayerManager}
             */
            var LayerManager = function (globe) {
                var self = this;

                this.globe = globe;

                /** WWSK GeoServer WMS endpoint
                 * TODO: initialize from server REST settings
                 */
                this.localWmsServer = window.origin + "/geoserver/wms";
//                this.localWmsServer = window.origin + "/geoserver/gwc/service/wms";

                /** WWSK GeoServer WFS endpoint
                 * TODO: initialize from server REST settings
                 */
                this.localWfsServer = window.origin + "/geoserver/ows";

                /** WWSK GeoServer WMS version
                 * TODO: initialize from server REST settings
                 */
                this.localWmsVersion = "1.3.0";     // alternative: "1.1.1"

                /** WWSK GeoServer WMS version
                 * TODO: initialize from server REST settings
                 */
                this.localWfsVersion = "1.0.0";

                /** Background layers are always enabled and are not shown in the layer menu. */
                this.backgroundLayers = ko.observableArray();

                /** Base layers are opaque and should be shown exclusive of other base layers. */
                this.baseLayers = ko.observableArray();

                /** Overlay layers may be translucent and/or contain sparce content, and may be stacked with other layers.  */
                this.overlayLayers = ko.observableArray();

                /** Effects layers (like atmosphere) are stacked with other layers.  */
                this.effectsLayers = ko.observableArray();

                /** Data layers are shapes and markers. */
                this.dataLayers = ko.observableArray();

                /** Widget layers are fixed controls on the screen and are not shown in the layer menu. */
                this.widgetLayers = ko.observableArray();

                /**
                 * A collection of servers added to the layer manager by the user.
                 */
                this.servers = ko.observableArray();

                /**
                 * Toggles a layer on and off.
                 *
                 * @param {WorldWind.Layer} layer The layer to be toggled on or off.
                 */
                this.toggleLayer = function (layer) {
                    // Update the WorldWind.Layer object
                    layer.enabled = !layer.enabled;

                    // Update the observable so UI elements can reflect the new state
                    layer.layerEnabled(layer.enabled);

                    self.globe.redraw();
                };
            };

            /**
             * Loads a set of application specific default layers.
             * See the Globe constructor's handling of showBackground for the  basic globe layers.
             */
            LayerManager.prototype.loadDefaultLayers = function () {

                // Asynchronysly load the WMS layers found in the WWSK GeoServer WMS
                this.populateAvailableWmsLayers();
                // Asynchronysly load the WFS layers found in the WWSK GeoServer WFS
                this.populateAvailableWfsLayers();

            };

            /**
             * Background layers are always enabled and are not shown in the layer menu.
             * @param {WorldWind.Layer} layer
             * @param {Object} options Optional
             */
            LayerManager.prototype.addBackgroundLayer = function (layer, options) {
                var index = this.backgroundLayers().length,
                        defaultOptions = {
                            hideInMenu: true,
                            enabled: true
                        };

                // Apply default options for a background layer if options are not supplied
                LayerManager.applyOptionsToLayer(layer, options ? options : defaultOptions, constants.LAYER_CATEGORY_BACKGROUND);

                // Add the layer to the WorldWindow
                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy to the background layer observables
                this.backgroundLayers.unshift(LayerManager.createLayerViewModel(layer));

                this.globe.layerManager.sortLayers();
            };

            /**
             * Base layers are opaque and should be shown exclusive of other base layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options Optional
             */
            LayerManager.prototype.addBaseLayer = function (layer, options) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length;

                // Apply the supplied options to the base layer
                LayerManager.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_BASE);

                // Add this layer to the WorldWindow
                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy the the base layer observables
                this.baseLayers.unshift(LayerManager.createLayerViewModel(layer));

                this.globe.layerManager.sortLayers();
            };

            /**
             * Overlay layers may be translucent and/or contain sparce content, and
             * may be stacked with other layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addOverlayLayer = function (layer, options) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length;

                LayerManager.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_OVERLAY);

                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy for this layer to the list of overlays
                this.overlayLayers.unshift(LayerManager.createLayerViewModel(layer));

                this.globe.layerManager.sortLayers();
            };

            /**
             * Effect layers may be stacked with other layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addEffectLayer = function (layer, options) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length + this.effectsLayers().length;

                LayerManager.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_EFFECT);

                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy for this layer to the list of effects
                this.effectsLayers.push(LayerManager.createLayerViewModel(layer));

                this.globe.layerManager.sortLayers();
            };

            /**
             * Data layers are shapes and markers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addDataLayer = function (layer, options) {
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length + this.effectsLayers().length
                        + this.dataLayers().length;

                LayerManager.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_DATA);

                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy for this layer to the list of data layers
                this.dataLayers.push(LayerManager.createLayerViewModel(layer));

                this.globe.layerManager.sortLayers();
            };

            /**
             * Widget layers are always enabled by default and are not shown in the layer menu.
             * @param {WorldWind.Layer} layer
             */
            LayerManager.prototype.addWidgetLayer = function (layer, options) {
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length + this.effectsLayers().length
                        + this.dataLayers().length + this.widgetLayers().length;

                LayerManager.applyOptionsToLayer(layer, options ? options : {
                    hideInMenu: false,
                    enabled: true
                }, constants.LAYER_CATEGORY_WIDGET);

                this.globe.wwd.insertLayer(index, layer);
                this.widgetLayers.push(LayerManager.createLayerViewModel(layer));

                this.globe.layerManager.sortLayers();
            };

            /**
             * Finds the first layer with a matching name (displayName) attribute.
             * @param {string} name The name to compare to the layer's displayName
             * @returns A layer view model object or null if not found
             */
            LayerManager.prototype.findLayerViewModel = function (name) {
                var layerViewModels = this.baseLayers,
                        i, len;

                if (!name) {
                    return null;
                }

                for (i = 0, len = layerViewModels().length; i < len; i++) {
                    if (layerViewModels()[i].name() === name) {
                        return layerViewModels()[i];
                    }
                }
                return null;
            };

            /**
             * Applys or adds the options to the given layer.
             * @param {WorldWind.Layer} layer The layer to update
             * @param {Object} options The options to apply
             * @param {String} category The category the layer should be assigned to
             */
            LayerManager.applyOptionsToLayer = function (layer, options, category) {
                var opt = (options === undefined) ? {} : options;

                // Explorer layer type
                layer.category = category;

                // Propagate enabled and pick options to the layer object
                layer.enabled = opt.enabled === undefined ? true : opt.enabled;
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
             * Creates a view model object to represent the layer within the UI.
             * @param {Layer} layer A WorldWind layer object
             * @returns {Object} A lightwieght view model with obserable properties, condusive to cloning
             * in oj.ArrayTableDataSource containers
             */
            LayerManager.nextLayerId = 0;
            LayerManager.createLayerViewModel = function (layer) {
                var viewModel = {
                    wwLayer: layer,
                    id: ko.observable(LayerManager.nextLayerId++),
                    category: ko.observable(layer.category),
                    name: ko.observable(layer.displayName),
                    enabled: ko.observable(layer.enabled),
                    legendUrl: ko.observable(layer.legendUrl ? layer.legendUrl.url : ''),
                    opacity: ko.observable(layer.opacity),
                    order: ko.observable(),
                    showInMenu: ko.observable(layer.showInMenu)
                };
                // Forward changes from enabled and opacity observables to the the layer object
                viewModel.enabled.subscribe(function (newValue) {
                    layer.enabled = newValue;
                });
                viewModel.opacity.subscribe(function (newValue) {
                    layer.opacity = newValue;
                });

                // Check if the layer has existing persistance properties
                LayerManager.applyRestoreState(viewModel);

                return viewModel;
            };

            /**
             *
             * @param serverAddress
             */
            LayerManager.prototype.addWmsServer = function (serverAddress) {
                if (!serverAddress) {
                    return;
                }

                serverAddress = serverAddress.trim();
                serverAddress = serverAddress.replace("Http", "http");
                if (serverAddress.lastIndexOf("http", 0) != 0) {
                    serverAddress = "http://" + serverAddress;
                }

                var self = this,
                        request = new XMLHttpRequest(),
                        url = WorldWind.WmsUrlBuilder.fixGetMapString(serverAddress);

                url += "service=WMS&request=GetCapabilities&vers";

                request.open("GET", url, true);
                request.onreadystatechange = function () {
                    if (request.readyState === 4 && request.status === 200) {
                        var xmlDom = request.responseXML,
                                wmsCapsDoc;

                        if (!xmlDom && request.responseText.indexOf("<?xml") === 0) {
                            xmlDom = new window.DOMParser().parseFromString(request.responseText, "text/xml");
                        }

                        if (!xmlDom) {
                            alert(serverAddress + " retrieval failed. It is probably not a WMS server.");
                            return;
                        }

                        wmsCapsDoc = new WorldWind.WmsCapabilities(xmlDom);

                        if (wmsCapsDoc.version) { // if no version, then the URL doesn't point to a caps doc.

                            // Process the servers's capabilities document
                            self.servers.push(self.loadServerCapabilites(serverAddress, wmsCapsDoc));

                        } else {
                            alert(serverAddress +
                                    " WMS capabilities document invalid. The server is probably not a WMS server.");
                        }
                    } else if (request.readyState === 4) {
                        if (request.statusText) {
                            alert(request.responseURL + " " + request.status + " (" + request.statusText + ")");
                        } else {
                            alert("Failed to retrieve WMS capabilities from " + serverAddress + ".");
                        }
                    }
                };

                request.send(null);
            };

            LayerManager.nextServerId = 0;
            LayerManager.prototype.loadServerCapabilites = function (serverAddress, wmsCapsDoc) {
                var wmsService = wmsCapsDoc.service,
                        wmsLayers = wmsCapsDoc.capability.layers,
                        server = {
                            id: LayerManager.nextServerId++,
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

                this.assembleLayers(wmsLayers, server.layers);

                return server;
            };

            /**
             *
             * @param {type} wmsLayers Array of layer capabilities
             * @param {observableArray} layerNodes Array of layer nodes
             * @returns {observableArray}
             */
            LayerManager.prototype.assembleLayers = function (wmsLayers, layerNodes) {

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

            LayerManager.prototype.addLayerFromCapabilities = function (layerCaps, category) {
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
                    if (category === constants.LAYER_CATEGORY_BASE) {
                        this.addBaseLayer(layer);
                    } else if (category === constants.LAYER_CATEGORY_OVERLAY) {
                        this.addOverlayLayer(layer);
                    } else if (category === constants.LAYER_CATEGORY_DATA) {
                        this.addDataLayer(layer);
                    } else {
                        this.addBaseLayer(layer);
                    }

                    return layer;
                }

                return null;
            };

            LayerManager.prototype.removeLayer = function (layer) {

                // Remove the legend if there is one
                if (layer.companionLayer) {
                    this.globe.wwd.removeLayer(layer.companionLayer);
                }
                // Remove the layer from the globe
                this.globe.wwd.removeLayer(layer);

                // Remove the layer from the knockout observable array
                var category = layer.category,
                        name = layer.displayName,
                        pred = function (item) {
                            return item.name() === name
                        };
                if (category === constants.LAYER_CATEGORY_BASE) {
                    this.baseLayers.remove(pred);
                } else if (category === constants.LAYER_CATEGORY_OVERLAY) {
                    this.overlayLayers.remove(pred);
                } else if (category === constants.LAYER_CATEGORY_DATA) {
                    this.dataLayers.remove(pred);
                } else {
                    this.baseLayers.remove(pred);
                }

                // Cleanup the time series player
                if (this.timeSeriesPlayer && this.timeSeriesPlayer.layer === layerCaps) {
                    this.timeSeriesPlayer.timeSequence = null;
                    this.timeSeriesPlayer.layer = null;
                }

                this.globe.redraw();

                this.globe.layerManager.sortLayers();
            };

            /**
             * saves the managed layers to local storage as JSON objects. 
             */
            LayerManager.prototype.saveLayers = function () {

                // Iterate through all of the layer types and gather the properties of interest
                var saveLayersToLocalStorage = function (layerArray, layerType) {
                    var i = 0, len = layerArray.length, typeInfo = [], layerInfo;
                    for (i; i < len; i++) {
                        layerInfo = {};
                        layerInfo["name"] = layerArray[i].name();
                        layerInfo["opacity"] = layerArray[i].opacity();
                        layerInfo["enabled"] = layerArray[i].enabled();
                        layerInfo["order"] = i;
                        typeInfo.push(layerInfo);
                    }
                    localStorage.setItem(layerType, ko.toJSON(typeInfo));
                };

                if (localStorage) {
                    saveLayersToLocalStorage(this.backgroundLayers(), constants.LAYER_CATEGORY_BACKGROUND);
                    saveLayersToLocalStorage(this.baseLayers(), constants.LAYER_CATEGORY_BASE);
                    saveLayersToLocalStorage(this.overlayLayers(), constants.LAYER_CATEGORY_OVERLAY);
                    saveLayersToLocalStorage(this.effectsLayers(), constants.LAYER_CATEGORY_EFFECT);
                    // marker state should be handled by the marker manager
                    // saveLayersToLocalStorage(this.widgetLayers(), Constants.L);
                } else {
                    console.log("a local storage object was not found, layer state will not persist");
                }

            };

            /**
             * Restores the state for a layer from local storage.
             * @param {type} layerViewModel An individual layer view model object.
             */
            LayerManager.applyRestoreState = function (layerViewModel) {
                var persistSettingsString = localStorage.getItem(layerViewModel.category()), persistSettings, layerSettings;
                if (persistSettingsString) {
                    persistSettings = JSON.parse(persistSettingsString);
                    for (var i = 0; i < persistSettings.length; i++) {
                        layerSettings = persistSettings[i];
                        if (layerSettings.name == layerViewModel.name()) {
                            layerViewModel.enabled(layerSettings.enabled);
                            layerViewModel.opacity(layerSettings.opacity);
                            layerViewModel.order(layerSettings.order);
                        }
                    }
                }
            };

            /**
             * Returns a "layers=name 1,name 2,name n" URI conponent suituable for a url parameter.
             * @returns {String} layer=... 
             */
            LayerManager.prototype.getWmsLayersParam = function () {
                var param = "layers=",
                        layerName,
                        i, len, isFirstParam = true;

                for (i = 0, len = this.baseLayers().length; i < len; i++) {
                    if (this.baseLayers()[i].enabled()) {
                        // Encode the layer name to prevent special chars from corrupting a URL
                        layerName = encodeURIComponent(this.baseLayers()[i].name());
                        param = param + (isFirstParam ? "" : ",") + layerName;
                        isFirstParam = false;
                    }
                }
                return param;
            };


            LayerManager.prototype.setWmsLayersFromUrl = function () {

                /** Store URL parameters from the web browser
                 *
                 * Proposed values in the URL:
                 *
                 * layer
                 * latitude
                 * longitude
                 * altitude
                 * bounding_box
                 *
                 * These can be repeated (e.g. '?&layer=bmng&layer=landsat&layer=sentinel')
                 *
                 * see: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
                 */

                // The '.slice(1)' operation removes the question mark separator.
                var urlParameters = new URLSearchParams(window.location.search.slice(1)),
                        layersParam,
                        requestedLayers,
                        i, len, n,
                        layerViewModel,
                        layerName;

                // Check if URL string has a layer associated
                // e.g. http://127.0.0.1:8080/?layer=layerName
                if (urlParameters.has("layers")) {
                    layersParam = urlParameters.get("layers");

                    // Disable default base layers in preparation for enabling the URL's layers
                    for (i = 0, len = this.baseLayers().length; i < len; i++) {
                        this.baseLayers()[i].enabled(false);
                    }

                    // Enable the URL's layers
                    requestedLayers = layersParam.split(",");
                    n = 0;
                    for (i = 0, len = requestedLayers.length; i < len; i++) {
                        // Layer names are URI encoded to allow special chars in the URL
                        layerName = decodeURIComponent(requestedLayers[i]);
                        layerViewModel = this.findLayerViewModel(layerName);

                        if (layerViewModel) {
                            layerViewModel.enabled(true);
                            // Sort the layers in the order they were give in the URL
                            this.moveLayer(layerViewModel, n++);
                        }
                    }
                } else {
                    console.log("No layer requested in URL");
                }

            };

            LayerManager.prototype.populateWmsLayerFromUrl = function () {

                /** Store URL parameters from the web browser
                 *
                 * Proposed values in the URL:
                 *
                 * layer
                 * latitude
                 * longitude
                 * altitude
                 * bounding_box
                 *
                 * These can be repeated (e.g. '?&layer=bmng&layer=landsat&layer=sentinel')
                 *
                 * see: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
                 */

                // The '.slice(1)' operation removes the question mark separator.
                var urlParameters = new URLSearchParams(window.location.search.slice(1));

                // Check if URL string has a layer associated
                // e.g. http://127.0.0.1:8080/?layer=layerName
                if (urlParameters.has("layer")) {

                    // TODO: Unnnecesary going through the whole GetCapabilities document. Abbreviate request for a single layer?
                    var requestUrl = this.localWmsServer + "?SERVICE=WMS&VERSION=" + this.localWmsVersion + "&REQUEST=GetCapabilities";
                    var layerGenerator = function (myGlobe) {
                        var globe = myGlobe;
                        return {
                            addLayers: function (data, status) {
                                // Assuming a single layer value, store desired layer name in a string
                                var requestedLayer = urlParameters.get("layer");

                                if (status === "success") {
                                    var wmsCapabilities = new WorldWind.WmsCapabilities(data),
                                            namedLayers = wmsCapabilities.getNamedLayers(),
                                            wmsLayerConfig;

                                    // Looking for the requested layer in the URL inside wmsCapabilities
                                    var layerIndex = searchLayerName(namedLayers, requestedLayer, "name");

                                    if (layerIndex === -1) {
                                        console.log("Layer requested in URL not found in local resource");
                                    } else {
                                        wmsLayerConfig = WorldWind.WmsLayer.formLayerConfiguration(namedLayers[layerIndex]);
                                        // Using the EnhancedWmsLayer which uses GeoServer vendor params in the GetMap URL
                                        globe.layerManager.addBaseLayer(new EnhancedWmsLayer(wmsLayerConfig, null), {
                                            enabled: false,
                                            detailControl: config.imagerydetailControl
                                        });
                                    }
                                }
                            }
                        }
                    }(this.globe);

                    $.get(requestUrl).done(
                            layerGenerator.addLayers
                            ).fail(function (err) {
                        // TODO C Squared Error Alert
                        console.error(err);
                    });

                } else {
                    console.log("No layer requested in URL");
                }

                // Generic function to look for a value inside an object using a particular key (property)
                var searchLayerName = function (wmsLayers, searchTerm, property) {
                    for (var i = 0, len = wmsLayers.length; i < len; i++) {
                        if (wmsLayers[i][property] === searchTerm)
                            return i;
                    }
                    return -1;
                };
            };

            LayerManager.prototype.populateAvailableWmsLayers = function () {
                var requestUrl = this.localWmsServer + "?SERVICE=WMS&VERSION=" + this.localWmsVersion + "&REQUEST=GetCapabilities";
                var self = this;
                var layerGenerator = function (myGlobe) {
                    var globe = myGlobe;
                    return {
                        addLayers: function (data, status, headers) {
                            if (status === "success") {
                                var wmsCapabilities = new WorldWind.WmsCapabilities(data),
                                        namedLayers = wmsCapabilities.getNamedLayers(),
                                        i, len = namedLayers.length,
                                        wmsLayerConfig;
                                for (i = 0; i < len; i++) {
                                    wmsLayerConfig = WorldWind.WmsLayer.formLayerConfiguration(namedLayers[i]);

                                    // Using the EnhancedWmsLayer which uses GeoServer vendor params in the GetMap URL
                                    globe.layerManager.addBaseLayer(new EnhancedWmsLayer(wmsLayerConfig, null), {
                                        enabled: false,
                                        detailControl: config.imagerydetailControl
                                    });
                                }
                                // Check if there are layers in the URL search string and enable them
                                self.setWmsLayersFromUrl();
                            }
                        }
                    }
                }(this.globe);

                $.get(requestUrl).done(
                        layerGenerator.addLayers
                        ).fail(function (err) {
                    // TODO C Squared Error Alert
                    console.error(err);
                });

            };

            LayerManager.prototype.populateAvailableWfsLayers = function () {
                var wfsGetCapabilitiesUrl = this.localWfsServer + "?SERVICE=WFS&VERSION=" + this.localWfsVersion + "&REQUEST=DescribeFeatureType",
                        wfsCapabilitiesRetriever,
                        wfsFeatureUrl,
                        self = this;

                wfsCapabilitiesRetriever = function (myGlobe) {
                    var globe = myGlobe;
                    return {
                        process: function (xml, status, headers) {
                            if (status === "success") {
                                var features = {},
                                        availableFeatures = xml.children[0].children,
                                        i, numAvailable,
                                        attributesList,
                                        j, numAttributes,
                                        featureName,
                                        keys,
                                        z, numKeys,
                                        layerName,
                                        wfsLayerGenerator;

                                numAvailable = availableFeatures.length;
                                for (i = 0; i < numAvailable; i++) {
                                    attributesList = availableFeatures[i].attributes;
                                    numAttributes = attributesList.length;
                                    for (j = 0; j < numAttributes; j++) {
                                        featureName = attributesList[j].name;
                                        // TODO Better Document Parsing
                                        if (featureName === "name" && !attributesList[j].value.includes("Type")) {
                                            features[attributesList[j].value] = "true";
                                        }
                                    }
                                }

                                keys = Object.keys(features);
                                numKeys = keys.length;
                                for (z = 0; z < numKeys; z++) {
                                    layerName = keys[z];
                                    wfsLayerGenerator = function (theGlobe, myName) {
                                        var globe = theGlobe,
                                                name = myName;
                                        log.info('LayerManager', 'wfsLayerGenerator', 'name: ' + name);

                                        return {
                                            addLayer: function (kmlFile) {
                                                var renderableLayer = new WorldWind.RenderableLayer(name);

                                                renderableLayer.addRenderable(kmlFile);
                                                globe.layerManager.addOverlayLayer(renderableLayer);
                                            }
                                        }
                                    }(globe, layerName);

                                    wfsFeatureUrl = self.localWfsServer
                                            + "?SERVICE=WFS&VERSION=" + self.localWfsVersion
                                            + "&REQUEST=GetFeature&typename=" + layerName
                                            + "&outputFormat=application%2Fvnd.google-earth.kml%2Bxml";

                                    log.info('LayerManager', 'wfsCapabilitiesRetriever.process', wfsFeatureUrl);

                                    // Create a KmlFile object for the feature and add a RenderableLayer 
                                    new WorldWind.KmlFile(wfsFeatureUrl).then(wfsLayerGenerator.addLayer);
                                }

                            }
                        }
                    }
                }(this.globe);

                $.get(wfsGetCapabilitiesUrl)
                        .done(wfsCapabilitiesRetriever.process)
                        .fail(console.error);

            };


            /**
             * Moves the WorldWindow camera to the center coordinates of the layer, and then zooms in (or out)
             * to provide a view of the layer as complete as possible.
             * @param layer the layer from the layer manager that the user selected for zooming in.
             * TODO: Make this to work when Sector/Bounding box crosses the 180° meridian
             */
            LayerManager.prototype.zoomToLayer = function (layer) {

                // Verify layer sector (bounding box in 2D terms) existence and
                // do not center the camera if layer covers the whole globe.
                var layerSector = layer.wwLayer.bbox; // property of EnhancedWmsLayer
                // layerSector = setTestSector(layerSector, "hawaii"); // Test with known sectors
                if (layerSector == null) { // null or undefined.
                    $.growl.error({ message: "No Layer sector / bounding box defined!" });
                    return;
                }

                // Comparing each boundary of the sector to verify layer global coverage.
                if (layerSector.maxLatitude === 90 &&
                    layerSector.minLatitude === -90 &&
                    layerSector.maxLongitude === 180 &&
                    layerSector.minLongitude === -180) {
                    $.growl.notice({ message: "The selected layer covers the full globe. No camera centering needed." });
                    return;
                }

                // Obtain layer center
                var layerCenterPosition = findLayerCenter(layerSector);
                // Move camera to position
                this.globe.goto(layerCenterPosition.latitude, layerCenterPosition.longitude, defineZoomLevel(layerSector));

                // Classical formula to obtain middle point between two coordinates
                function findLayerCenter (layerSector){
                    var centerLatitude = (layerSector.maxLatitude + layerSector.minLatitude) / 2;
                    var centerLongitude = (layerSector.maxLongitude + layerSector.minLongitude) / 2;
                    var layerCenter = new WorldWind.Position(centerLatitude, centerLongitude);
                    return layerCenter;
                }

                // Zoom level is obtained following this simple method: Calculate approx arc length of the
                // sectors' diagonal, and set that as the range (altitude) of the camera.
                function defineZoomLevel (layerSector) {
                    var verticalBoundary = layerSector.maxLatitude - layerSector.minLatitude;
                    var horizontalBoundary = layerSector.maxLongitude - layerSector.minLongitude;

                    // Calculate diagonal angle between boundaries (simple pythagoras formula, we don't need to
                    // consider vectors or great circles).
                    var diagonalAngle = Math.sqrt(Math.pow(verticalBoundary, 2) + Math.pow(horizontalBoundary, 2));

                    // If the diagonal angle is equal or more than an hemisphere (180°) don't change zoom level.
                    // Else, use the diagonal arc length as camera altitude.
                    if (diagonalAngle >= 180){
                        return null;
                    } else {
                        // Gross approximation of longitude of arc in km
                        // (assuming spherical Earth with radius of 6,371 km. Accuracy is not needed for this).
                        var diagonalArcLength = (diagonalAngle/360) * (2 * 3.1416 * 6371000);
                        return diagonalArcLength;
                    }
                }

                // Predefined known sectors. For testing purposes only
                // obtained with: http://boundingbox.klokantech.com/
                function setTestSector(layerSector, place){
                    switch(place){
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

            /**
             * Sorts the layers by their provided order (if specified) and then synchronizes the Explorer layers
             * with the WorldWind layers.
             */
            LayerManager.prototype.sortLayers = function () {
                var explorerLayerCategories = [
                    this.backgroundLayers, 
                    this.baseLayers, 
                    this.overlayLayers, 
                    this.dataLayers,
                    this.widgetLayers,
                    this.effectsLayers
                ], i, len = explorerLayerCategories.length, 
                byOrderValue = function (a, b) {
                    // if an order value is provided use it
                    if (a.order && !isNaN(a.order()) && b.order && !isNaN(b.order())) {
                        return a.order() - b.order();
                    } else if (a.order && !isNaN(a.order())) {
                        return -1;
                    } else if (b.order && !isNaN(b.order())) {
                        return 1;
                    } else {
                        return a.name().localeCompare(b.name());
                    }
                };

                for (i = 0; i < len; i++) {
                    explorerLayerCategories[i].sort(byOrderValue);
                }

                this.globe.layerManager.synchronizeLayers();
            };

            /**
             * Synchronizes the Explorer layer arrays with the WorldWind layers. This method will reverse the ordering
             * of the base, background, and overlay arrays in order to match the expected visibility.
             */
            LayerManager.prototype.synchronizeLayers = function () {
                var explorerLayerCategories = [
                    this.backgroundLayers, 
                    this.baseLayers, 
                    this.overlayLayers, 
                    this.dataLayers,
                    this.widgetLayers,
                    this.effectsLayers
                ], i, len = explorerLayerCategories.length;

                for (i = 0; i < len; i++) {
                    this.globe.layerManager.synchronizeLayerCategory(explorerLayerCategories[i]);
                }
            };

            /**
             * Synchronizes the provided Explorer layer category with corresponding WorldWind layers. The method
             * will reverse the ordering of the base, background, and overlay arrays in order to match expected 
             * visibility.
             */
            LayerManager.prototype.synchronizeLayerCategory = function(layerCategory) {
                var i, explorerLayerLength = layerCategory().length, wwStartIndex = Number.MAX_SAFE_INTEGER, 
                    explorerLayer, wwInsertionIndex;

                if (explorerLayerLength === 0) {
                    return; // there is nothing to sort in this layer
                }

                // Find the minimum index for this layer category in the WorldWind layer array
                for (i = 0; i < explorerLayerLength; i++) {
                    wwStartIndex = Math.min(wwStartIndex, this.globe.wwd.layers.indexOf(layerCategory()[i].wwLayer));
                }

                // Stop and log an error if a start index was not found
                if (isNaN(wwStartIndex) || wwStartIndex === Number.MAX_SAFE_INTEGER) {
                    console.error('Unable to determine initial index ');
                    return;
                }
                
                // Remove all of the layers of this layer category from the WorldWindow layers
                for (i = 0; i < explorerLayerLength; i++) {
                    this.globe.wwd.removeLayer(layerCategory()[i].wwLayer);
                }

                // Iterate through the layer category layers and populate the ordered WorldWind layer array
                for (i = 0; i < explorerLayerLength; i++) {
                    explorerLayer = layerCategory()[i];
                 
                    // The category type determines if the layer should be added to the end or beginning of the
                    // WorldWind layers
                    if (explorerLayer.category() === constants.LAYER_CATEGORY_BACKGROUND ||
                        explorerLayer.category() === constants.LAYER_CATEGORY_BASE ||
                        explorerLayer.category() === constants.LAYER_CATEGORY_OVERLAY) {
                        wwInsertionIndex = wwStartIndex; // index expression of the unshift method
                    } else {
                        wwInsertionIndex = wwStartIndex + i; // index expression of the push method
                    }
                    this.globe.wwd.insertLayer(wwInsertionIndex, explorerLayer.wwLayer);
                }
            };

            /**
             * Moves the provided layer to the provided index of the layer category the layer belongs. Moves the
             * WorldWind layer in concert to maintain list synchronicity between the order layers are displayed
             * in the layer manager and WorldWind.
             * @param layerViewModel the Explorer layer manager layer to be moved
             * @param index the index to move the layer to in its specific layer category, or "up" and "down" to
             * move the layer above or below its neighbor
             */
            LayerManager.prototype.moveLayer = function (layerViewModel, index) {
                var explorerLayerArray, i, len;

                if (!layerViewModel) {
                    return;
                }

                if (index == null || index < 0) {
                    return;
                }

                // Determine the corresponding layer array
                switch (layerViewModel.category()) {
                    case constants.LAYER_CATEGORY_BACKGROUND:
                        explorerLayerArray = this.backgroundLayers;
                        break;
                    case constants.LAYER_CATEGORY_BASE:
                        explorerLayerArray = this.baseLayers;
                        break;
                    case constants.LAYER_CATEGORY_OVERLAY:
                        explorerLayerArray = this.overlayLayers;
                        break;
                    default:
                        console.log("moving the layer isn't support for " + layerViewModel.category());
                        return;
                }

                // Convert the up and down indices to a numerical index
                if (index === "up") {
                    index = explorerLayerArray.indexOf(layerViewModel) - 1;
                }

                if (index === "down") {
                    index = explorerLayerArray.indexOf(layerViewModel) + 2;
                }

                // Index bounds check
                if (index < 0 || index > explorerLayerArray().length) {
                    console.error("layer move outside of bounds");
                    return;
                }

                // Update the layer manager order
                LayerManager.moveLayerInArray(layerViewModel, index, explorerLayerArray);
                
                // Synchronize the layer ordering
                this.globe.layerManager.synchronizeLayers();
            };

            LayerManager.moveLayerInArray = function (layer, moveToIndex, layers) {
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

            return LayerManager;
        }
);

