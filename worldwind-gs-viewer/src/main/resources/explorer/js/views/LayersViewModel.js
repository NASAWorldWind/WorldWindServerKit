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
define(['knockout', 'jquery', 'jqueryui', 'bootstrap', 'model/Constants'],
        function (ko, $, jqueryui, boostrap, constants) {

            /**
             * The view model for the Layers panel.
             * @param {Globe} globe The globe that provides the layer manager.
             * @constructor
             */
            function LayersViewModel(globe) {
                var self = this,
                        layerManager = globe.layerManager;

                // Create view data sources from the LayerManager's observable arrays
                self.baseLayers = layerManager.baseLayers;
                self.overlayLayers = layerManager.overlayLayers;
                self.dataLayers = layerManager.dataLayers;
                self.effectsLayers = layerManager.effectsLayers;
                self.widgetLayers = layerManager.widgetLayers;

                // Layer type options
                self.optionValues = ["WMS Layer", "WMTS Layer", "KML file", "Shapefile"];
                self.selectedOptionValue = ko.observable(self.optionValues[0]);
                
                /**
                 * An observable array of servers
                 */
                this.servers = layerManager.servers;
                self.serverAddress = ko.observable("http://neowms.sci.gsfc.nasa.gov/wms/wms");

                /**
                 * Toggles the selected layer's visibility on/off
                 * @param {Object} layer The selected layer in the layer collection
                 */
                self.onToggleLayer = function (layer) {
                    layer.enabled(!layer.enabled());
                    globe.redraw();
                };


                /**
                 * Opens a dialog to edit the layer settings.
                 * @param {Object} layer The selected layer in the layer collection
                 */
                self.onEditSettings = function (layer) {
                    
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
                        title: layer.name()
                    });
                    
                    //console.log(layer.name() + ":  " + layer.opacity());
                    $("#opacity-slider").slider("option", "value", layer.opacity());
                    $("#layer-settings-dialog").dialog("open");
                };
                
                
                /**
                 * Opens the Add Layer dialog.
                 */
                self.onAddLayer = function() {
                    $("#add-layer-dialog").dialog({
                        autoOpen: false,
                        title: "Add Layer"
                    });
                    
                    $("#add-layer-dialog").dialog("open");
                };
                
                
                self.onAddServer  = function() {
                    layerManager.addServer(self.serverAddress());
                    return true;
                };

                /**
                 * Add the supplied layer from the server's capabilities to the active layers
                 */
                this.onServerLayerClicked = function(layerNode, event){
                    if (!layerNode.isChecked()) {
                        // TODO: Open dialog to select a layer category
                        layerManager.addLayerFromCapabilities(layerNode.layerCaps, constants.LAYER_CATEGORY_OVERLAY);
                    } else {
                        layerManager.removeLayer(layerNode.layerCaps);
                    }
                    return true;
                };
            }

            return LayersViewModel;
        }
);
