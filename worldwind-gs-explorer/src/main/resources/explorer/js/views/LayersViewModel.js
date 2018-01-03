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
define(['knockout', 'jquery', 'jqueryui', 'bootstrap', 'model/Constants', 'model/util/Log',
],
        function (ko, $, jqueryui, boostrap, constants, log) {

            /**
             * The view model for the Layers panel.
             * @param {Globe} globe The globe that provides the layer manager.
             * @constructor
             */
            function LayersViewModel(globe) {
                var self = this,
                        layerManager = globe.layerManager;

                // Create view data sources from the LayerManager's observable arrays
                this.baseLayers = layerManager.baseLayers;
                this.overlayLayers = layerManager.overlayLayers;
                this.dataLayers = layerManager.dataLayers;
                this.effectsLayers = layerManager.effectsLayers;
                this.widgetLayers = layerManager.widgetLayers;

                // Layer type options
                this.optionValues = ["WMS Layer", "WMTS Layer", "KML file", "Shapefile"];
                this.selectedOptionValue = ko.observable(self.optionValues[0]);

                /**
                 * An observable array of servers
                 */
                this.servers = layerManager.servers;
                // Setting a default server address to some interesting data
                this.serverAddress = ko.observable("https://neowms.sci.gsfc.nasa.gov/wms/wms"); // CORS is disabled now in here
                // self.serverAddress = ko.observable("https://worldwind25.arc.nasa.gov/wms");


                /**
                 * Toggles the selected layer's visibility on/off
                 * @param {Object} layer The selected layer in the layer collection
                 */
                this.onToggleLayer = function (layer) {
                    layer.enabled(!layer.enabled());
                    globe.redraw();
                };


                /**
                 * Opens a dialog to edit the layer settings.
                 * @param {Object} layer The selected layer in the layer collection
                 */
                this.onEditSettings = function (layer) {
                    $('#opacity-slider').slider({
                        animate: 'fast',
                        min: 0,
                        max: 1,
                        orientation: 'horizontal',
                        slide: function (event, ui) {
                            //console.log(layer.name() + ":  " + layer.opacity());
                            layer.opacity(ui.value);
                        },
                        step: 0.1
                    });

                    $("#layer-settings-dialog").dialog({
                        autoOpen: false,
                        title: layer.name(),
                        close: function (event, ui) {
                            $('#move-up-button').off('click');
                            $('#move-down-button').off('click');
                            $('#move-top-button').off('click');
                            $('#move-bottom-button').off('click');
                        }
                    });
                    $('#opacity-slider').slider("option", "value", layer.opacity());
                    $('#move-up-button').on('click', function () {
                        layerManager.moveLayer(layer, 'up');
                    });
                    $('#move-down-button').on('click', function () {
                        layerManager.moveLayer(layer, 'down');
                    });
                    $('#move-top-button').on('click', function () {
                        layerManager.moveLayer(layer, 'top');
                    });
                    $('#move-bottom-button').on('click', function () {
                        layerManager.moveLayer(layer, 'bottom');
                    });

                    //console.log(layer.name() + ":  " + layer.opacity());
                    $('#layer-settings-dialog').dialog("open");
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
                        layerManager.addLayerFromCapabilities(layerNode.layerCaps, constants.LAYER_CATEGORY_BASE);
                    } else {
                        // Find the first layer with a displayName matching the title
                        layer = layerManager.findLayer(layerNode.layerCaps.title);
                        if (layer) {
                            layerManager.removeLayer(layer);
                        } else {
                            log.error("LayersViewModel", "onServerLayerClicked",
                                    "Could not find a layer to removed named " + layerNode.layerCaps.title);
                        }
                    }
                    return true;
                };
            }

            return LayersViewModel;
        }
);
