/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

/**
 * The LayerProxy modude is used to create a proxy for a WorldWind.Layer object. The proxy
 * wraps the layer object and is endowed with additional observable properties that allow it 
 * to controlled by the LayerManager and be displayed in the MVVM views.
 * 
 * @param {Knockout} ko
 * @param {Moment} moment
 * @returns {LayerProxy}
 */
define([
    'knockout',
    'moment',
    'worldwind'],
    function (ko, moment) {
        "use strict";

        /**
         * @constructor
         * @param {WorldWind.Layer} layer
         * @returns {LayerProxy}
         */
        var LayerProxy = function (layer, globe) {
            var self = this;

            /**
             * The WorldWind layer proxied by this object
             * @type WorldWind.Layer
             */
            this.wwLayer = layer;

            //
            // Observables
            //

            /**
             * The unique ID for this object (in the current session).
             * @type Number
             */
            this.id = ko.observable(LayerProxy.nextLayerId++);

            /**
             * The layer category used to group layers.
             * @type String
             */
            this.category = ko.observable(layer.category);

            /**
             * The name used for this layer in the layer lists.
             * @type String
             */
            this.name = ko.observable(layer.displayName);

            /**
             * The enabled (visible) state of this layer.
             * @type Boolean
             */
            this.enabled = ko.observable(layer.enabled);

            /**
             * The optional URL to a legend image.
             * @type String
             */
            this.legendUrl = ko.observable(layer.legendUrl ? layer.legendUrl.url : '');

            /**
             * Flag to show this layer's legend (if it has one)
             */
            this.showLegend = ko.observable(true);

            /**
             * Flag to indicate if this layer's time sequence (if it has one) should be linked
             * to the globe's time.
             */
            this.linkTimeToGlobe = ko.observable(true);

            /**
             * The opacity (tranparency) setting for this layer.
             * @type Number
             */
            this.opacity = ko.observable(layer.opacity);

            /**
             * The sort order of this layer in its category.
             * @type Number
             */
            this.order = ko.observable();

            /**
             * Flag to determine if this layer should appear in its category's layer list.
             * @type Boolean
             */
            this.showInMenu = ko.observable(layer.showInMenu);

            /**
             * Flag to indicate if this layer is should expose its details in the layer manager.
             * @type Boolean
             */
            this.showDetails = ko.observable(false);

            /**
             * Flag to indicate if this layer is currently selected in the layer manager.
             * @type Boolean
             */
            this.selected = ko.observable(false);

            /**
             * The observable current time within the layer's time sequence.
             * @type {Moment} 
             */
            this.currentTime = ko.observable(layer.time ? moment(layer.time) : null);
            this.startTime = ko.observable(layer.timeSequence ? moment(layer.timeSequence.startTime) : null);
            this.endTime = ko.observable(layer.timeSequence ? moment(layer.timeSequence.endTime) : null);

            // Internal. Intentionally not documented.
            this.time = ko.pureComputed({
                /**
                 * @returns {Date}
                 */
                read: function () {
                    return this.wwLayer.time;
                },
                /**
                 * @param {Date} newTime
                 */
                write: function (newTime) {
                    if (this.wwLayer.time === newTime) {
                        return;
                    }
                    var timeSequence = this.wwLayer.timeSequence,
                        currentTime = timeSequence.currentTime,
                        startTime = timeSequence.startTime,
                        intervalMs = timeSequence.intervalMilliseconds,
                        elapsedMs, newScale;
                    // If necessary, adjust the new time to the beginning of the time period 
                    // containing the new value 
                    if (intervalMs && currentTime !== newTime && startTime <= newTime) {
                        // Compute time period
                        elapsedMs = newTime.getTime() - startTime.getTime();
                        newScale = elapsedMs / intervalMs;
                        newTime = timeSequence.getTimeForScale(newScale);
                        // Update the time sequence
                        timeSequence.currentTime = newTime;
                    }
                    // Update this observable and the time dimensioned layer
                    this.wwLayer.time = newTime;
                    // Update the dependent observables
                    this.currentTime(moment(newTime));
                    // Update the display
                },
                owner: this
            });
            // Notify the globe (and other subscribers) no more than once every 500 milliseconds 
            // to thottle the number of WMS requests when a slider is moved.
            this.time.extend({ rateLimit: 500 });
            this.time.subscribe(function() {
                globe.redraw();
            })
            /**
             * 
             */
            this.currentTimeText = ko.pureComputed(function () {
                var dateTime = this.currentTime(), // a moment object
                    timeText, dateText;
                if (dateTime) {
                    timeText = dateTime.format(globe.use24Time() ? "HH:mm" : "h:mm A");
                    dateText = dateTime.format("YYYY-MM-DD");
                    return dateText + " " + timeText;
                }
            }, this);

            this.numTimePeriods = ko.observable(layer.timeSequence ? layer.timeSequence.intervalMilliseconds : 0),
                /**
                 * A value in milliseconds indicating the current progress in the time sequence.
                 */
                this.currentTimeScale = ko.pureComputed({
                    read: function () {
                        // Problems with bi-directional bindings with sliders
                        // when the slider increments don't align with scale periods.
                        // 
                        if (this.wwLayer.timeSequence) {
                            var dependency = this.currentTime().toDate(); // establish a dependency on current time 
                            return this.wwLayer.timeSequence.scaleForCurrentTime * this.numTimePeriods();
                        } else {
                            return null;
                        }
                    },
                    write: function (newValue) {
                        var newScale = newValue / this.numTimePeriods(),
                            newTime = this.wwLayer.timeSequence.getTimeForScale(newScale);
                        this.time(newTime);
                    },
                    owner: this
                });

            /**
             * 
             */
            this.currentTimeText = ko.pureComputed(function () {
                var dateTime = this.currentTime(), // a moment object
                    timeText, dateText;
                if (dateTime) {
                    timeText = dateTime.format(globe.use24Time() ? "HH:mm" : "h:mm A");
                    dateText = dateTime.format("YYYY-MM-DD");
                    return dateText + " " + timeText;
                }
            }, this);

            //            
//            this.currentTimeScale.subscribe(function (newValue) {
//                // Skip updating the time if this is a synchronization action
//                if (!this.synchronizingTimeScale) {
//                    var selectedTime = this.wwLayer.timeSequence.getTimeForScale(newValue / 100);
//                    if (this.time() !== selectedTime) {
//                        // Update the time from the time scale
//                        this.time(selectedTime);
//                    }
//                }
//            }, this);


            /**
             * Returns the name annotated with the layer's current
             * time sequence, if this a time dimensioned layer.
             */
            this.annotatedName = ko.pureComputed(function () {
                if (this.currentTime()) {
                    return this.name() + " [" + this.currentTimeText() + "]";
                } else {
                    return this.name();
                }
            }, this);


            this.stepTimeForward = function () {
                var timeSequence = self.wwLayer.timeSequence;
                if (timeSequence) {
                    var nextTime = timeSequence.next() || timeSequence.next();
                    self.time(nextTime);
                }
            };


            this.stepTimeBackward = function () {
                var timeSequence = self.wwLayer.timeSequence;
                if (timeSequence) {
                    var previousTime = timeSequence.previous() || timeSequence.previous();
                    self.time(previousTime);
                }
            };

            //
            // Event handlers
            //

            /**
             * Forwards enabled state changes to the proxied layer object.
             * @param {Boolean} newValue - The new state
             */
            this.enabled.subscribe(function (newValue) {
                this.wwLayer.enabled = newValue;
            }, this);

            /**
             * Forwards opacity changes to the proxied layer object.
             * @param {Boolean} newValue - The new opacity
             */
            this.opacity.subscribe(function (newValue) {
                this.wwLayer.opacity = newValue;
            }, this);

            // Subscription to the globe's dateTime observable.
            // This subscription updates this layer's timeSequence
            // to the current time maintained by the globe.
            if (layer.timeSequence) {
                globe.dateTime.subscribe(function (newDateTime) {
                    // Update the time observable, which will
                    // select a frame from the time sequence
                    // and update the currentTime observable.
                    if (this.linkTimeToGlobe()) {
                        this.time(newDateTime);
                    }
                }, this);
            }
        };

        /**
         * The next ID to be assigned.
         * @type Number
         * @inner
         * @static
         */
        LayerProxy.nextLayerId = 0;

        return LayerProxy;
    }
);

