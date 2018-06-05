/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Layers content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {LayersViewModel}
 */
/**
 * 
 * @param {Constants} constants
 * @param {Log} log
 * @param {Dragula} dragula
 * @param {Knockout} ko 
 * @param {JQeury} $
 * @returns {LayersViewModel}
 */
define([
    'model/Constants',
    'model/util/Log',
    'dragula',
    'knockout',
    'jquery',
    'jqueryui',
    'bootstrap'],
    function (constants, log, dragula, ko, $) {
        "use strict";
        /**
         * The view model for the Layers panel.
         * @constructor
         * @param {Globe} globe The globe that provides the layer manager.
         * @param {String} viewFragment
         * @param {String} appendToId
         * @returns {LayersViewModel}
         */
        function LayersViewModel(globe, viewFragment, appendToId) {
            var self = this,
                layerManager = globe.layerManager,
                domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $(appendToId ? '#' + appendToId : 'body').append(domNodes);
            this.view = domNodes[0];

            // Create view data sources from the LayerManager's observable arrays
            this.baseLayers = layerManager.baseLayers;
            this.overlayLayers = layerManager.overlayLayers;
            this.dataLayers = layerManager.dataLayers;
            this.effectsLayers = layerManager.effectsLayers;
            this.widgetLayers = layerManager.widgetLayers;
            this.selectedLayer = ko.observable();
            // Layer type options
            this.optionValues = ["WMS Layer", "WMTS Layer", "KML file", "Shapefile"];
            this.selectedOptionValue = ko.observable(self.optionValues[0]);
            /**
             * An observable array of servers
             */
            this.servers = layerManager.servers;

            // Setting a default server address to some interesting data

            this.serverAddress = ko.observable();
            this.serverAddresses = ko.observableArray([
                {name: "NASA Earth Observations", url: "https://neowms.sci.gsfc.nasa.gov/wms/wms"},
                {name: "European Centre for Medium-Range Weather Forecast", url: "http://apps.ecmwf.int/wms/?token=public"},
                {name: "Sentinel-2 cloudless by EOX IT Services GmbH", url: " https://tiles.maps.eox.at/wms"}
//                {name: "NOAA nowCOAST Observations", url: "https://nowcoast.noaa.gov/arcgis/services/nowcoast/obs_meteocean_insitu_sfc_time/MapServer/WMSServer"},
//                {name: "NOAA nowCOAST Radar Imagery", url: "https://nowcoast.noaa.gov/arcgis/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/WMSServer"},
//                {name: "NOAA nowCOAST Surface Analysis", url: "https://nowcoast.noaa.gov/arcgis/services/nowcoast/analysis_meteohydro_sfc_rtma_time/MapServer/WMSServer"},
//                {name: "GEOMac Wildfire Support", url: "https://wildfire.cr.usgs.gov/arcgis/services/geomac_dyn/MapServer/WMSServer"}
            ]);
            this.serverAddressSelection = ko.observable();
            this.serverAddressSelection.subscribe(function(newServer){
                self.serverAddress(newServer);
            });
            this.baseLayersCount = ko.observable(this.baseLayers().length);
            this.baseLayers.subscribe(function (changes) {
                this.baseLayersCount(this.baseLayers().length);
            }, this, "change");

            this.overlayLayersCount = ko.observable(this.overlayLayers().length);
            this.overlayLayers.subscribe(function (changes) {
                this.overlayLayersCount(this.overlayLayers().length);
            }, this, "change");

            this.dataLayersCount = ko.observable(this.dataLayers().length);
            this.dataLayers.subscribe(function (changes) {
                this.dataLayersCount(this.dataLayers().length);
            }, this, "change");

            this.effectsLayersCount = ko.observable(this.effectsLayers().length);
            this.effectsLayers.subscribe(function (changes) {
                this.effectsLayersCount(this.effectsLayers().length);
            }, this, "change");

            this.widgetLayersCount = ko.observable(this.widgetLayers().length);
            this.widgetLayers.subscribe(function (changes) {
                this.widgetLayersCount(this.widgetLayers().length);
            }, this, "change");

            /**
             * Toggles the selected layer's visibility on/off
             * @param {LayerProxy} layer The selected layer in the layer collection
             */
            this.onToggleLayer = function (layer) {
                layer.enabled(!layer.enabled());
                globe.redraw();
            };
            /**
             * Sets the selected state to true; disables selected state of previous layer.
             * @param {LayerProxy} layer
             */
            this.onSelectLayer = function (layer) {
                var lastLayer = self.selectedLayer();
                if (lastLayer === layer) {
                    return;
                }
                if (lastLayer) {
                    lastLayer.selected(false);
                    lastLayer.showDetails(false);
                }
                self.selectedLayer(layer);
                layer.selected(true);
            };
            /**
             * Opens a dialog to edit the layer settings.
             * @param {LayerProxy} layer The selected layer in the layer collection
             */
            this.onEditSettings = function (layer) {
//                var $element = $("#layer-settings-dialog"),
//                    dialog = ko.dataFor($element.get(0));
//                dialog.open(layer);
                layer.showDetails(!layer.showDetails());
            };

            /**
             * Opens the Add Layer dialog.
             */
            this.onAddLayer = function () {
                $("#add-layer-dialog").dialog({
                    autoOpen: false,
                    title: "Add Layer"
                });
                $("#add-layer-dialog").dialog("open");
            };
            this.onAddServer = function () {
                layerManager.addWmsServer(self.serverAddress());
                return true;
            };
            this.onZoomToLayer = function (layer) {
                layerManager.zoomToLayer(layer);
            };
            this.onMoveLayerUp = function (layer) {
                layerManager.moveLayer(layer, "up");
            };
            this.onMoveLayerDown = function (layer) {
                layerManager.moveLayer(layer, "down");
            };
            this.onMoveLayerToTop = function (layer) {
                layerManager.moveLayer(layer, "top");
            };
            this.onMoveLayerToBottom = function (layer) {
                layerManager.moveLayer(layer, "bottom");
            };
            /**
             * Add the supplied layer from the server's capabilities to the active layers
             */
            this.onServerLayerClicked = function (layerNode, event) {
                var layer;
                if (!layerNode.isChecked()) {
                    // TODO: Open dialog to select a layer category
                    layerManager.addLayerFromCapabilities(layerNode.layerCaps, constants.LAYER_CATEGORY_OVERLAY);
                } else {
                    // Find the first layer with a displayName matching the title
                    layer = layerManager.findLayer(layerNode.layerCaps.title);
                    if (layer) {
                        layerManager.removeLayer(layer.wwLayer);
                    } else {
                        log.error("LayersViewModel", "onServerLayerClicked",
                            "Could not find a layer to removed named " + layerNode.layerCaps.title);
                    }
                }
                return true;
            };

            // 
            // Time sequence controllers
            //

            this.onLinkTimeToGlobe = function (layer) {
                var shouldLinkTime = !layer.linkTimeToGlobe();
                layer.linkTimeToGlobe(shouldLinkTime);
                if (shouldLinkTime) {
                    // Sync to the globe
                    layer.time(globe.dateTime);
                }
            };

            this.onStepBackward = function (layer) {
                layer.linkTimeToGlobe(false);
                layer.stepTimeBackward();
            };

            this.onStepForward = function (layer) {
                layer.linkTimeToGlobe(false);
                layer.stepTimeForward();
            };


            /**
             * Handle drop event from the Dragula dragger.
             * 
             * @param {element} dropped Element that was dropped
             * @param {element} target Target element container
             * @param {element} source Source element container
             * @param {element} sibling New sibling element next to dropped element 
             */
            this.onDropLayer = function (dropped, target, source, sibling) {
                var droppedName = $(dropped).find('.layer-name').text(),
                    siblingName = $(sibling).find('.layer-name').text(),
                    droppedLayer = layerManager.findLayer(droppedName),
                    siblingLayer = layerManager.findLayer(siblingName),
                    layers, oldIndex, newIndex;
                // Remove the element created by dragula; let knockout manage the DOM
                $(dropped).remove();
                if (source.id === 'base-layers-item-container') {
                    layers = self.baseLayers;
                } else if (source.id === 'overlay-layers-item-container') {
                    layers = self.overlayLayers;
                } else if (source.id === 'data-layers-item-container') {
                    layers = self.dataLayers;
                }
                oldIndex = layers.indexOf(droppedLayer);
                newIndex = layers.indexOf(siblingLayer);
                if (oldIndex < 0) {
                    return; // error?
                }
                if (newIndex < 0) {
                    newIndex = layers().length;
                }

                // Remove/add the item in the obserable array to update the DOM
                layers.splice(oldIndex, 1);
                layers.splice(oldIndex > newIndex ? newIndex : newIndex - 1, 0, droppedLayer);
                layerManager.synchronizeLayers();
            };

            //
            // Setup dragging
            //
            this.drake = dragula({
                revertOnSpill: true,
                // Only allow sorting within the same container
                accepts: function (el, target, source, sibling) {
                    return source.id === target.id;
                },
                // Only allow dragging if a drag handle element is selected
                moves: function (el, source, handle, sibling) {
                    // BDS: I don't like depending on explicit view elements
                    return $(handle).hasClass("drag-handle");
                }
            });
            // Specifify the sortable containers
            this.drake.containers.push(document.getElementById('base-layers-item-container'));
            this.drake.containers.push(document.getElementById('overlay-layers-item-container'));
            this.drake.containers.push(document.getElementById('data-layers-item-container'));
            // Define the handler for the "dropped" layers
            this.drake.on('drop', this.onDropLayer);

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return LayersViewModel;
    }
);
