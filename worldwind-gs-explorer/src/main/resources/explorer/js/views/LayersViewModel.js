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
define(['knockout', 'jquery', 'jqueryui', 'bootstrap', 'dragula', 'model/globe/LayerManager', 'model/Constants', 'model/util/Log'],
        function (ko, $, jqueryui, boostrap, dragula, LayerManager, constants, log) {

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

                /**
                 * Handle drop event from the Dragula dragger.
                 * 
                 * @param {element} dropped Element that was dropped
                 * @param {element} target Target element container
                 * @param {element} source Source element container
                 * @param {element} sibling New sibling element next to dropped element 
                 */
                this.onDropLayer = function (dropped, target, source, sibling) {
                    var droppedName = $(dropped).find('.layer').text(),
                            siblingName = $(sibling).find('.layer').text(),
                            droppedLayer = layerManager.findLayerViewModel(droppedName),
                            siblingLayer = layerManager.findLayerViewModel(siblingName),
                            layers, oldIndex, newIndex;

                    // Remove the dropped element created by dragula; it's not compatible with Knockout
                    $(dropped).remove();

                    // We'll let knockout manage the DOM by removing/adding items in the observable array.
                    if (source.id === 'base-layers-item-container') {
                        layers = self.baseLayers;
                    } else if (source.id === 'overlay-layers-item-container') {
                        layers = self.overlayLayers;
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
                    accepts: function (el, target, source, sibling) {
                        return source.id === target.id;
                    }
                });
                this.drake.containers.push(document.getElementById('base-layers-item-container'));
                this.drake.containers.push(document.getElementById('overlay-layers-item-container'));
                this.drake.on('drop', this.onDropLayer);

            }

            return LayersViewModel;
        }
);
