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
    'model/globe/LayerManagerHelper',
    'model/globe/LayerProxy',
    'model/util/Log',
    'worldwind',
    'url-search-params'],
        function (
                ko,
                config,
                constants,
                EnhancedWmsLayer,
                LayerManagerHelper,
                LayerProxy,
                log,
                ww,
                URLSearchParams) {
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
                this.localWmsServer = window.location.origin + "/geoserver/wms";
//                this.localWmsServer = window.origin + "/geoserver/gwc/service/wms";

                /** WWSK GeoServer WFS endpoint
                 * TODO: initialize from server REST settings
                 */
                this.localWfsServer = window.location.origin + "/geoserver/ows";

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
                 * An ordered list of the layer category arrays useful for iterating over all the layers. 
                 */
                this.layerCategories = [
                    this.backgroundLayers,
                    this.baseLayers,
                    this.overlayLayers,
                    this.dataLayers,
                    this.effectsLayers,
                    this.widgetLayers
                ];

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
                this.addAvailableWmsLayers();
                // Asynchronysly load the WFS layers found in the WWSK GeoServer WFS
                this.addAvailableWfsLayers();

                // Check if there are layers in the URL search string and enable them
                this.setWmsLayersFromUrl();

                //this.sortLayers();
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
                        },
                        layerProxy;

                // Apply default options for a background layer if options are not supplied
                LayerManagerHelper.applyOptionsToLayer(layer, options ? options : defaultOptions, constants.LAYER_CATEGORY_BACKGROUND);

                // Add the layer to the WorldWindow
                this.globe.wwd.insertLayer(index, layer);

                layerProxy = new LayerProxy(layer, this.globe);
                LayerManagerHelper.applyRestoreState(layerProxy);
                this.backgroundLayers.unshift(layerProxy);

                this.synchronizeLayers();
            };

            /**
             * Base layers are opaque and should be shown exclusive of other base layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options Optional
             * @param {Number} preferredOrder HACK: a workaround to force the initial sort order
             */
            LayerManager.prototype.addBaseLayer = function (layer, options, preferredOrder) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length,
                        layerProxy;

                // Apply the supplied options to the base layer
                LayerManagerHelper.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_BASE);

                // Add this layer to the WorldWindow
                this.globe.wwd.insertLayer(index, layer);

                // Create a to represent this layer
                layerProxy = new LayerProxy(layer, this.globe);

                // Check if the layer has existing persistance properties
                LayerManagerHelper.applyRestoreState(layerProxy);
                if (preferredOrder) {
                    layerProxy.order(preferredOrder);
                }

                // Add this layer to its category
                this.baseLayers.unshift(layerProxy);

                this.synchronizeLayers();
            };

            /**
             * Overlay layers may be translucent and/or contain sparce content, and
             * may be stacked with other layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addOverlayLayer = function (layer, options) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length,
                        layerProxy;

                LayerManagerHelper.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_OVERLAY);
                this.globe.wwd.insertLayer(index, layer);

                layerProxy = new LayerProxy(layer, this.globe);
                LayerManagerHelper.applyRestoreState(layerProxy);
                this.overlayLayers.unshift(layerProxy);

                this.synchronizeLayers();
            };

            /**
             * Effect layers may be stacked with other layers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addEffectLayer = function (layer, options) {
                // Determine the index of this layer within the WorldWindow
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length + this.effectsLayers().length,
                        layerProxy;

                LayerManagerHelper.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_EFFECT);
                this.globe.wwd.insertLayer(index, layer);

                layerProxy = new LayerProxy(layer, this.globe);
                LayerManagerHelper.applyRestoreState(layerProxy);
                this.effectsLayers.unshift(layerProxy);

                this.synchronizeLayers();
            };

            /**
             * Data layers are shapes and markers.
             * @param {WorldWind.Layer} layer
             * @param {Object} options
             */
            LayerManager.prototype.addDataLayer = function (layer, options) {
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length + this.effectsLayers().length
                        + this.dataLayers().length,
                        layerProxy;

                LayerManagerHelper.applyOptionsToLayer(layer, options, constants.LAYER_CATEGORY_DATA);
                this.globe.wwd.insertLayer(index, layer);

                layerProxy = new LayerProxy(layer, this.globe);
                LayerManagerHelper.applyRestoreState(layerProxy);
                this.dataLayers.unshift(layerProxy);

                this.synchronizeLayers();
            };

            /**
             * Widget layers are always enabled by default and are not shown in the layer menu.
             * @param {WorldWind.Layer} layer
             */
            LayerManager.prototype.addWidgetLayer = function (layer, options) {
                var index = this.backgroundLayers().length + this.baseLayers().length + this.overlayLayers().length + this.effectsLayers().length
                        + this.dataLayers().length + this.widgetLayers().length,
                        layerProxy;

                LayerManagerHelper.applyOptionsToLayer(layer, options ? options : {
                    hideInMenu: true,
                    enabled: true
                }, constants.LAYER_CATEGORY_WIDGET);

                this.globe.wwd.insertLayer(index, layer);

                layerProxy = new LayerProxy(layer, this.globe);
                this.widgetLayers.unshift(layerProxy);

                this.synchronizeLayers();
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
                            self.servers.push(LayerManagerHelper.loadServerCapabilites(serverAddress, wmsCapsDoc));

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

            /**
             * Add a layer from a GetCapabilties entry
             * @param {type} layerCaps
             * @param {type} category
             * @returns {EnhancedWmsLayer|WorldWind.WmsTimeDimensionedLayer}
             */
            LayerManager.prototype.addLayerFromCapabilities = function (layerCaps, category) {

                var wwLayer = LayerManagerHelper.createLayerFromCapabilities(layerCaps);
//            if (wwLayer.timeSequence) {
//                // EXPERIMENTAL 
//                // subscribing this layer to the globe's current time
//                wwLayer.dateTimeSubscription = this.globe.dateTime.subscribe(function (newDateTime) {
//                    var startTime = wwLayer.timeSequence.startTime,
//                        intervalMs = wwLayer.timeSequence.intervalMilliseconds,
//                        elapsedMs, newTime;
//                    if (intervalMs && startTime < newDateTime) {
//                        elapsedMs = newDateTime.getTime() - startTime.getTime();
//                        wwLayer.time = wwLayer.timeSequence.getTimeForScale(elapsedMs / intervalMs);
//                    }
//                    this.globe.redraw();
//                }, this);
//            }
                if (wwLayer) {
                    // TODO: pass in category; add to selected category
                    wwLayer.enabled = true;
                    if (category === constants.LAYER_CATEGORY_BASE) {
                        this.addBaseLayer(wwLayer);
                    } else if (category === constants.LAYER_CATEGORY_OVERLAY) {
                        this.addOverlayLayer(wwLayer);
                    } else if (category === constants.LAYER_CATEGORY_DATA) {
                        this.addDataLayer(wwLayer);
                    } else {
                        this.addBaseLayer(wwLayer);
                    }
                }
                return wwLayer;
            };

            /**
             * 
             * @param {WorldWind.Layer} wwLayer
             */
            LayerManager.prototype.removeLayer = function (wwLayer) {

                // Remove the Knockout subscription to date/time notifications
                if (wwLayer.dateTimeSubscription) {
                    wwLayer.dateTimeSubscription.dispose();
                }
                // Remove the legend if there is one
                if (wwLayer.companionLayer) {
                    this.globe.wwd.removeLayer(wwLayer.companionLayer);
                }
                // Remove the layer from the globe
                this.globe.wwd.removeLayer(wwLayer);

                // Remove the layer from the knockout observable array
                var category = wwLayer.category,
                        name = wwLayer.displayName,
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

                this.synchronizeLayers();
            };

            /**
             * Finds the first layer with a matching name (displayName) attribute.
             * @param {String} name The name to compare to the layer's displayName
             * @returns {LayerProxy} A layer view model object or null if not found
             */
            LayerManager.prototype.findLayer = function (name) {
                var layer;

                if (!name) {
                    return null;
                }

                layer = LayerManagerHelper.findLayerViewModel(name, this.baseLayers);

                if (!layer) {
                    layer = LayerManagerHelper.findLayerViewModel(name, this.overlayLayers);
                }
                if (!layer) {
                    layer = LayerManagerHelper.findLayerViewModel(name, this.dataLayers);
                }
                if (!layer) {
                    layer = LayerManagerHelper.findLayerViewModel(name, this.backgroundLayers);
                }
                if (!layer) {
                    layer = LayerManagerHelper.findLayerViewModel(name, this.effectsLayers);
                }
                if (!layer) {
                    layer = LayerManagerHelper.findLayerViewModel(name, this.widgetLayers);
                }

                return layer;
            };

            /**
             * Moves the WorldWindow camera to the center coordinates of the layer, and then zooms in (or out)
             * to provide a view of the layer as complete as possible.
             * @param {Object} layer A layerViewModel that the user selected for zooming
             */
            LayerManager.prototype.zoomToLayer = function (layer) {
                LayerManagerHelper.zoomToLayer(layer, this.globe);
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
                    log.warning('LayerManager', 'saveLayers', "A local storage object was not found, layer state will not persist");
                }
            };


            /**
             * Sets the sort order used by sortLayers
             */
            LayerManager.prototype.updateLayerSortOrder = function () {
                var i, j, layers, numLayers, numArrays = this.layerCategories.length;
                // Process each observable array in our list
                for (i = 0; i < numArrays; i++) {
                    layers = this.layerCategories[i];
                    numLayers = layers().length;
                    for (j = 0; j < numLayers; j++) {
                        // Set the order
                        layers()[j].order(j);
                    }
                }
            };


            /**
             * Sorts the layers by their provided order (if specified) and then synchronizes the Explorer layers
             * with the WorldWind layers.
             */
            LayerManager.prototype.sortLayers = function () {
                var i,
                        len = this.layerCategories.length,
                        byOrderValue = function (a, b) {
                            // if an order value is provided use it
                            if (a.order && !isNaN(a.order()) && b.order && !isNaN(b.order())) {
                                return a.order() - b.order();
                            } else if (a.order && !isNaN(a.order())) {
                                return 1;
                            } else if (b.order && !isNaN(b.order())) {
                                return -1;
                            } else {
                                return 0;   
                                //return a.name().localeCompare(b.name());
                            }
                        };

                for (i = 0; i < len; i++) {
                    this.layerCategories[i].sort(byOrderValue);
                }

                this.synchronizeLayers();
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
                    this.synchronizeLayerCategory(explorerLayerCategories[i]);
                }
            };

            /**
             * Synchronizes the provided Explorer layer category with corresponding WorldWind layers. The method
             * will reverse the ordering of the base, background, and overlay arrays in order to match expected 
             * visibility.
             */
            LayerManager.prototype.synchronizeLayerCategory = function (layerCategory) {
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
                    log.warning('LayerManager', 'synchronizeLayerCategory', 'Unable to determine initial index.');
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

                if (index === null || index < 0) {
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
                        log.info('LayerManager', 'moveLayer', "Moving the layer isn't support for " + layerViewModel.category());
                        return;
                }

                // Convert the up and down indices to a numerical index
                if (index === "up") {
                    index = explorerLayerArray.indexOf(layerViewModel) - 1;
                }
                if (index === "down") {
                    index = explorerLayerArray.indexOf(layerViewModel) + 2;
                }
                if (index === "top") {
                    index = 0;
                }
                if (index === "bottom") {
                    index = explorerLayerArray().length;
                }

                // Index bounds check
                if (index < 0 || index > explorerLayerArray().length) {
                    log.warning('LayerManager', 'moveLayer', "Layer move outside of bounds");
                    return;
                }

                // Update the layer manager order
                LayerManagerHelper.moveLayerInArray(layerViewModel, index, explorerLayerArray);

                // Synchronize the layer ordering
                this.synchronizeLayers();
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

            /**
             * Set the enabled state of layers to those in the URL.
             */
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
                        layerViewModel = LayerManagerHelper.findLayerViewModel(layerName, this.baseLayers);

                        if (layerViewModel) {
                            layerViewModel.enabled(true);
                            // Sort the layers in the order they were give in the URL
                            this.moveLayer(layerViewModel, n++);
                        }
                    }
                } else {
                    log.warning('LayerManager', 'setWmsLayersFromUrl', "No layer requested in URL");
                }

            };

            /**
             * Adds the layers defined in the URL
             */
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

                var self = this;
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
                                        log.warning('LayerManager', 'populateWmsLayerFromUrl', "Layer requested in URL not found in local resource");
                                    } else {
                                        wmsLayerConfig = WorldWind.WmsLayer.formLayerConfiguration(namedLayers[layerIndex]);
                                        // Using the EnhancedWmsLayer which uses GeoServer vendor params in the GetMap URL
                                        self.addBaseLayer(new EnhancedWmsLayer(wmsLayerConfig, null), {
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
                    log.warning('LayerManager', 'populateWmsLayerFromUrl', "No layer requested in URL");
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

            /**
             * Add WMS layers from an associated WorldWind Server Kit (WWSK) server.
             */
            LayerManager.prototype.addAvailableWmsLayers = function () {
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
                                    self.addBaseLayer(new EnhancedWmsLayer(wmsLayerConfig, null), {
                                        enabled: false,
                                        detailControl: config.imagerydetailControl
                                    });
                                }
                                // Check if there are layers in the URL search string and enable them
                                self.setWmsLayersFromUrl();
                                self.sortLayers();
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

            /**
             * Add WFS layers from an associated WorldWind Server Kit (WWSK) server.
             */
            LayerManager.prototype.addAvailableWfsLayers = function () {
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
                                
                                self.sortLayers();
                            }
                        }
                    }
                }(this.globe);

                $.get(wfsGetCapabilitiesUrl)
                        .done(wfsCapabilitiesRetriever.process)
                        .fail(console.error);

            };


            return LayerManager;
        }
);

