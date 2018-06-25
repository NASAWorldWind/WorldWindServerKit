/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2016 Bruce Schubert.
 */

/**
 * The LayerSettings module is responsible for managing the view that
 * presents controls for a single layer.
 * 
 * @param {Constants} constants 
 * @param {Knockout} ko
 * @param {JQuery} $
 * @returns {LayerSettings}
 */
define(['model/Constants', 'knockout', 'jquery'],
    function (constants, ko, $) {
        "use strict";
        /**
         * Constructs a LayerSettings view model and binds it to the given
         * view element. 
         * @constructor
         * @param {Globe} globe The globe model
         * @param {String} viewFragment The view fragment's html
         * @returns {LayerSettings}
         */
        function LayerSettings(globe, viewFragment) {
            var self = this,
                $view;
            
            // Load the view html into the specified DOM element
            // Wrap the view in a hidden div for use in a JQuery dialog.
            $view = $('<div style="display: none"></div>')
                .append(viewFragment)
                .appendTo($('body'));
            
            /**
             * The DOM element containing the view fragment.
             * @type {Element}
             */
            this.view = $view.children().first().get(0);
            
            /**
             * The Globe that renders the layer.
             * @type {Globe}
             */
            this.globe = globe;

            /**
             * The layer manager for the layer.
             * @type {LayerManager}
             */
            this.layerManager = globe.layerManager;

            /**
             * The observable current layer being managed.
             * @type {Layer} observable Layer
             */
            this.currentLayer = ko.observable();

            /**
             * Is this layer sortable?
             * @type {boolean} observable Layer
             */
            this.sortable = ko.pureComputed(function () {
                var layer = self.currentLayer();
                return layer && (
                    layer.category() === constants.LAYER_CATEGORY_BASE ||
                    layer.category() === constants.LAYER_CATEGORY_OVERLAY);
            });

            /**
             * Is this layer zoomable?
             * @type {boolean} observable Layer
             */
            this.zoomable = ko.pureComputed(function () {
                var layer = self.currentLayer(),
                    layerSector;

                if (layer === null) {
                    return false;
                }
                var layerSector = layer.wwLayer.bbox; // property of EnhancedWmsLayer
                if (layerSector === null) {
                    return false;
                }
                // Comparing each boundary of the sector to test if a layer has global coverage.
                if (layerSector.maxLatitude >= 89 &&
                    layerSector.minLatitude <= -89 &&
                    layerSector.maxLongitude >= 179 &&
                    layerSector.minLongitude <= -179) {
                    return false;
                }
                return true;
            });

            /**
             * The time in milliseconds to display each frame of the time sequence.
             * @type {Number}
             * @default 1000 milliseconds
             */
            this.frameTime = 1000;

            /**
             * The observable time sequence this player controls.
             * @type {PeriodicTimeSequence} 
             * @default null
             */
            this.timeSequence = ko.observable();

            /**
             * The observable current time within the time sequence.
             * @type {Date} 
             */
            this.currentTime = ko.observable();
            this.currentTimeScale = ko.observable(0);
            this.isPlaying = ko.observable(false);
            this.isRepeating = ko.observable(false);
            this.legendUrl = ko.observable('');
            this.opacity = ko.observable(0);

            // Forward changes from observable(s) to the the layer object
            this.opacity.subscribe(function (newValue) {
                if (this.currentLayer()) {
                    this.currentLayer().opacity(newValue);
                }
            }, this);

            this.currentTime.subscribe(function (newValue) {
                console.log("New current time: " + newValue);
                if (this.currentLayer() && newValue) {
                    this.globe.dateTime(newValue);
                }
            }, this);

            this.currentTimeScale.subscribe(function (newValue) {
                var selectedTime = this.timeSequence().getTimeForScale(newValue / 100);
                if (this.currentTime() !== selectedTime) {
                    this.currentTime(selectedTime);
                }
            }, this);

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);

        }

        /**
         * Opens the Layer Settings dialog
         * @param {type} layer
         */
        LayerSettings.prototype.open = function (layer) {

            // Stop the time series player when we change layers
            if (this.isPlaying()) {
                this.isPlaying(!this.isPlaying());
            }

            // Update observables
            this.currentLayer(layer);
            this.timeSequence(layer.wwLayer.timeSequence);
            this.legendUrl(layer.legendUrl());
            this.opacity(layer.opacity());

            // Get the view element and wrap it in a JQuery dialog
            var $view = $(this.view);
            $view.dialog({
                autoOpen: false
            });
            // Update the dialog title
            $view.dialog("option", "title", layer.name());
            // Show the dialog
            $view.dialog("open");
        };

        /**
         * Move the current layer to the top of its category.
         */
        LayerSettings.prototype.onMoveLayerToTop = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'top');
        };

        /**
         * Move the current layer to the bottom of its category.
         */
        LayerSettings.prototype.onMoveLayerToBottom = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'bottom');
        };

        /**
         * Move the current layer up one in its category.
         */
        LayerSettings.prototype.onMoveLayerUp = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'up');
        };

        /**
         * Move the current layer up down one in its category.
         */
        LayerSettings.prototype.onMoveLayerDown = function () {
            this.layerManager.moveLayer(this.currentLayer(), 'down');
        };

        LayerSettings.prototype.onPlay = function (event) {
            if (!this.timeSequence()) {
                return;
            }

            this.isPlaying(!this.isPlaying());

            var self = this;
            var playFunction = function () {
                if (self.timeSequence() && self.isPlaying()) {
                    var nextTime = self.timeSequence().next();
                    if (nextTime) {
                        self.currentTime(self.timeSequence().currentTime);
                        self.currentTimeScale(self.timeSequence().scaleForCurrentTime * 100);
                        //self.updateTimeDisplay(nextTime.toUTCString());
                        window.setTimeout(playFunction, self.frameTime);
                    } else if (self.isRepeating()) {
                        self.timeSequence().reset();
                        window.setTimeout(playFunction, self.frameTime);
                    } else {
                        self.isPlaying(false);
                    }

                }
            };

            if (this.isPlaying()) {
                window.setTimeout(playFunction, this.frameTime);
            }

        };

        LayerSettings.prototype.onStepBackward = function (event) {
            if (!this.isPlaying()) {
                if (this.timeSequence()) {
                    var previousTime = this.timeSequence().previous() || this.timeSequence().previous();
                    this.currentTime(previousTime);
                    this.currentTimeScale(this.timeSequence().scaleForCurrentTime * 100);
                }
            }
        };

        LayerSettings.prototype.onStepForward = function (event) {
            if (!this.isPlaying()) {
                if (this.timeSequence()) {
                    var nextTime = this.timeSequence().next() || this.timeSequence().next();
                    this.currentTime(nextTime);
                    this.currentTimeScale(this.timeSequence().scaleForCurrentTime * 100);
                }
            }
        };

        LayerSettings.prototype.onRepeat = function (event) {
            this.isRepeating(!this.isRepeating());
        };

        return LayerSettings;
    }
);