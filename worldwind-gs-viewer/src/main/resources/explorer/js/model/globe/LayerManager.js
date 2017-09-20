/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License - http://www.opensource.org/licenses/mit-license
 */

/**
 * The LayerManager manages categorical, observable lists of Layer objects. It itself observable,
 * and it injects some observable properties into the individual Layer objects.
 *
 * @param {Knockout} ko
 * @param {Config} config
 * @param {Constants} constants
 * @param {WorldWind} ww
 * @returns {LayerManager}
 */
define(['knockout',
    'model/Config',
    'model/Constants',
    'model/globe/layers/EnhancedWmsLayer',
    'model/globe/layers/SkyBackgroundLayer',
    'worldwind'],
        function (ko,
                config,
                constants,
                EnhancedWmsLayer,
                SkyBackgroundLayer,
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

                /** WWSK GeoServer WMS version
                 * TODO: initialize from server REST settings
                 */
                this.localWmsVersion = "1.3.0";     // alternative: "1.1.1"

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

                this.addDataLayer(new WorldWind.RenderableLayer(constants.LAYER_NAME_MARKERS), {
                    enabled: true,
                    pickEnabled: true
                });

                // Asynchronysly load the WMS layers found in the WWSK GeoServer WMS
                this.populateAvailableWwskWmsLayers();

            };

            /**
             * Background layers are always enabled and are not shown in the layer menu.
             * @param {WorldWind.Layer} layer
             */
            LayerManager.prototype.addBackgroundLayer = function (layer, options) {
                var index = this.backgroundLayers().length;

                // Apply default options for a background layer if options are not supplied
                LayerManager.applyOptionsToLayer(layer, options ? options : {
                    hideInMenu: true,
                    enabled: true
                }, constants.LAYER_CATEGORY_BACKGROUND);

                // Add the layer to the WorldWindow
                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy to the background layer observables
                this.backgroundLayers.push(LayerManager.createLayerViewModel(layer));
            };

            /**
             * Base layers are opaque and should be shown exclusive of other base layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addBaseLayer = function (layer, options) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length;

                // Apply the supplied options to the base layer
                LayerManager.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_BASE);

                // Add this layer to the WorldWindow
                this.globe.wwd.insertLayer(index, layer);

                // Add a proxy the the base layer observables
                this.baseLayers.push(LayerManager.createLayerViewModel(layer));
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
                this.overlayLayers.push(LayerManager.createLayerViewModel(layer));
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

                // Add a proxy for this layer to the list of overlays
                this.effectsLayers.push(LayerManager.createLayerViewModel(layer));
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
            };

            /**
             * Finds the first layer with a matching displayName attribute.
             * @param {type} layerName The name to compare to the layer's displayName
             * @returns A layer object or null if not found
             */
            LayerManager.prototype.findLayer = function (layerName) {
                var layers = this.globe.wwd.layers,
                        i, len;

                if (!layerName) {
                    return null;
                }

                for (i = 0, len = layers.length; i < len; i++) {
                    if (layers[i].displayName === layerName) {
                        return layers[i];
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
                    id: ko.observable(LayerManager.nextLayerId++),
                    category: ko.observable(layer.category),
                    name: ko.observable(layer.displayName),
                    enabled: ko.observable(layer.enabled),
                    legendUrl: ko.observable(layer.legendUrl ? layer.legendUrl.url : ''),
                    opacity: ko.observable(layer.opacity),
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
            };

            LayerManager.prototype.saveLayers = function () {
    
                // Iterate through all of the layer types and gather the properties of interest
                var saveLayersToLocalStorage = function(layerArray, layerType) {
                    var i = 0, len = layerArray.length, typeInfo = [], layerInfo;
                    for (i; i < len; i++) {
                        layerInfo = {};
                        layerInfo["name"] = layerArray[i].name();
                        layerInfo["opacity"] = layerArray[i].opacity();
                        layerInfo["enabled"] = layerArray[i].enabled();
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

            LayerManager.applyRestoreState = function (viewModel) {
                var persistSettingsString = localStorage.getItem(viewModel.category()), persistSettings, layerSettings;
                if (persistSettingsString) {
                    persistSettings = JSON.parse(persistSettingsString);
                    for (var i = 0; i < persistSettings.length; i++) {
                        layerSettings = persistSettings[i];
                        if (layerSettings.name == viewModel.name()) {
                            // a matching layer was found, the persisted settings will provided to the layer
                            // id: ko.observable(LayerManager.nextLayerId++),
                            // category: ko.observable(layer.category),
                            // name: ko.observable(layer.displayName),
                            // enabled: ko.observable(layer.enabled),
                            // legendUrl: ko.observable(layer.legendUrl ? layer.legendUrl.url : ''),
                            // opacity: ko.observable(layer.opacity)
                            viewModel.enabled(layerSettings.enabled);                            
                            viewModel.opacity(layerSettings.opacity);
                        }
                    }
                }
            };

            LayerManager.prototype.populateAvailableWwskWmsLayers = function () {

                var requestUrl = this.localWmsServer + "?SERVICE=WMS&VERSION=" + this.localWmsVersion + "&REQUEST=GetCapabilities";

                var layerGenerator = function (myGlobe) {
                    var globe = myGlobe;
                    return {
                        addLayers: function (data, status, headers) {
                            if (status === "success") {
                                var wmsCapabilities = new WorldWind.WmsCapabilities(data);
                                var namedLayers = wmsCapabilities.getNamedLayers();
                                for (var i = 0, len = namedLayers.length; i < len; i++) {
                                    var wmsLayerConfig = WorldWind.WmsLayer.formLayerConfiguration(namedLayers[i]);
                                    
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

            };

            return LayerManager;
        }
);

