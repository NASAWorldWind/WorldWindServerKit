/* 
 * The MIT License.
 * Copyright (c) 2015-2017 Bruce Schubert.
 */

/*global define*/

/**
 * The WeatherScout module.
 * 
 * @param {Constants} constants Constants singleton
 * @param {ContextSensitive} constextSensitive Adds context menu capability.
 * @param {Openable} openable Adds open capability.
 * @param {Log} log Logger singleton.
 * @param {Movable} movable Adds move capabilities.
 * @param {PlaceService} PlaceService Gets place names.
 * @param {Removable} removable Adds remove capability.
 * @param {WeatherService} WeatherService Gets weather forecasts.
 * @param {WmtUtil} util Utilities.
 * @returns {WeatherScout}
 * 
 * @author Bruce Schubert
 */
define([
    'knockout',
    'd3',
    'model/Constants',
    'model/util/ContextSensitive',
    'model/Events',
    'model/util/Openable',
    'model/util/Log',
    'model/util/Movable',
    'model/services/PlaceService',
    'model/util/Publisher',
    'model/util/Removable',
    'model/util/Selectable',
    'model/weather/symbols/WeatherMapSymbol',
    'model/services/WeatherService',
    'model/util/WmtUtil'],
    function (
        ko,
        d3,
        constants,
        contextSensitive,
        events,
        openable,
        log,
        movable,
        PlaceService,
        publisher,
        removable,
        selectable,
        WeatherMapSymbol,
        WeatherService,
        util) {
        "use strict";

        /**
         * 
         * @param {Object} params Parameters object containing:
         * {    
         *      id: optional, must be unique, will be assigned if missing
         *      name: optional, will be assigned if missing
         *      isMovable: optional, will be set to true if missing
         *      duration: hours
         *      editor: 
         *  }
         * @returns {WeatherScout_L33.WeatherScout}
         */
        var WeatherScout = function (manager, position, params) {
            var args = params || {},
                self = this;
                
            publisher.makePublisher(this);
            
            /** A reference to the globe; used by the WeatherMapSymbol. */
            this.globe = manager.globe;
            
            // TODO: assert that the params object contains the required members, e.g. lat, lon.
            
            // Make movable by the SelectController: Establishes the isMovable member.
            // Fires the EVENT_OBJECT_MOVE... events.
            movable.makeMovable(this);

            // Make selectable via picking (see SelectController): adds the "select" method
            selectable.makeSelectable(this, function (params) {   // define the callback that selects this marker
                this.isMovable(params.selected);
                this.renderable.highlighted = params.selected;
                return true;    // return true to fire a EVENT_OBJECT_SELECTED event
            });

            
            // Make openable via menus: Establishes the isOpenable member.
            openable.makeOpenable(this, function () { // define the function that opens the editor
                   var $element = $("#weather-scout-editor"),        
                        wxScoutEditor = ko.dataFor($element.get(0)); // get the view model bound to the element
                    
                    if (wxScoutEditor) {
                        wxScoutEditor.open(this);
                        return true; // return true to fire EVENT_OBJECT_OPENED event.
                    }
                    log.warning("WeatherScout","constructor","#weather-scout-editor element was not found.")
                    return false; 
             });
            
            // Make deletable via menu: Establishes the isRemovable member.
            removable.makeRemovable(this, function () {
                    // TODO: Could ask for confirmation; return false if veto'd
                    // 
                    // =================================
                    // TODO: Unsubscribe to observables!
                    // =================================
                    
                    manager.removeScout(self); // Removes the marker from the manager's observableArray
                    return true;    // return true to fire a EVENT_OBJECT_REMOVED
            });
            
            // Make context sensiive by the SelectController: shows the context menu.
            contextSensitive.makeContextSensitive(this, function () {
                $.growl({title: "TODO", message: "Show menu with delete, open, and lock/unlock"});
            });

            // Observables:
            
            /** The display name */
            this.name = ko.observable(args.name || 'Wx Scout');
            /** The movable mix-in state */
            this.isMovable(args.isMovable === undefined ? false : args.isMovable);
            /** The latitude of this marker -- set be by the Movable interface during pick/drag operations. See SelectController */
            this.latitude(position.latitude)
            /** The longitude of this marker -- may be set by the Movable interface during pick/drag operations See SelectController */
            this.longitude (position.longitude);
            /** The lat/lon location string of this scout */
            this.location = ko.computed(function () {
                return "Lat " + self.latitude().toPrecision(4).toString() + ", " + "Lon " + self.longitude().toPrecision(5).toString();
            });
            /** Weather forecast duration */
            this.duration = ko.observable(72); // hours

            // Properties:
            
            /** The unique id used to identify this particular weather object */
            this.id = args.id || util.guid();
            /** The renderable, symbolic representation of this object */
            this.renderable = new WeatherMapSymbol(this); // a composite renderable of several placemark components
            this.renderable.pickDelgate = this;
            /** DOM element id to display when this object is selected in the globe. */
            this.viewTemplateName = 'weather-scout-view-template';
            // Synchronize the renderable to the observable properties of this weatehr scout

//            this.name.subscribe(function (newName) {
//                self.renderable.skyCover.label = newName;
//            });
//            this.latitude.subscribe(function (newLat) {
//                self.renderable.handleObjectMovedEvent(self);
//            });
//            this.longitude.subscribe(function (newLon) {
//                self.renderable.handleObjectMovedEvent(self);
//            });          
            
            this.globe.dateTime.subscribe(this.renderable.handleTimeChangedEvent);
            
            // Self subscribe to move operations so we can update the forecast and place
            // when the move is finished. We don't want to update during the move itself.
            this.on(events.EVENT_OBJECT_MOVE_FINISHED, this.refresh);

            this.refresh();
        };
        
        /**
         * Invalid Weather object
         */
        WeatherScout.INVALID_WX = {
            time: new Date(0),
            airTemperatureF: Number.NaN,
            relaltiveHumidityPct: Number.NaN,
            windSpeedKts: Number.NaN,
            windDirectionDeg: Number.NaN,
            skyCoverPct: Number.NaN
        };

        /**
         * Gets the earlies forecast entry.
         * @returns {Object} A fire weather object 
         *  {
         *      time: Date,
         *      airTemperatureF: Number,
         *      relaltiveHumidityPct: Number,
         *      windSpeedKts: Number, 
         *      windDirectionDeg: Number,
         *      skyCoverPct: Number
         *  }
         */
        WeatherScout.prototype.getFirstForecast = function () {
            return this.getForecastAtTime(null);
        };

        /**
         * Returns the forecast nearest the given time.
         * @param {Date} time The date/time used to select the forecast. If null, the first forecast is returned.
         * @returns {Object} Fire weather forecast. Example:
         *   {
         *       time: Date,
         *       airTemperatureF: Number,
         *       relaltiveHumidityPct: Number,
         *       windSpeedKts: Number,
         *       windDirectionDeg: Number,
         *       skyCoverPct: Number
         *   }
         */
        WeatherScout.prototype.getForecastAtTime = function (time) {
            if (!this.temporalWx || this.temporalWx.length === 0) {
                log.warning('WeatherScout', 'getForecastAtTime', 'missingWeatherData');
                return WeatherScout.INVALID_WX;
            }
            var wxTime,
                wxTimeNext,
                minutesSpan,
                minutesElapsed,
                forecast,
                i, max;

            // Use the earliest forecast if time arg is not provided
            if (!time) {
                forecast = this.temporalWx[0];
            }
            else {
                for (i = 0, max = this.temporalWx.length; i < max; i++) {
                    wxTime = this.temporalWx[i].time;
                    if (time.getTime() < wxTime.getTime()) {    // compare millisecs from epoch
                        break;
                    }
                    if (i === max - 1) {
                        // This is the last wx entry. Use it!
                        break;
                    }
                    // Take a peek at the next entry's time 
                    wxTimeNext = this.temporalWx[i + 1].time;
                    minutesSpan = util.minutesBetween(wxTime, wxTimeNext);
                    minutesElapsed = util.minutesBetween(wxTime, time);
                    if (minutesElapsed < (minutesSpan / 2)) {
                        break;
                    }
                }
                forecast = this.temporalWx[i];
            }
            return {
                time: new Date(forecast.time),
                airTemperatureF: parseInt(forecast.values[0], 10),
                relaltiveHumidityPct: parseInt(forecast.values[1], 10),
                windSpeedKts: parseInt(forecast.values[2], 10),
                windDirectionDeg: parseInt(forecast.values[3], 10),
                skyCoverPct: parseInt(forecast.values[4], 10)
            };
        };
        /**
         * Returns all the forecasts in an array.
         * @returns {Array} Example:
         *   [{
         *       time: Date,
         *       airTemperatureF: Number,
         *       relaltiveHumidityPct: Number,
         *       windSpeedKts: Number,
         *       windDirectionDeg: Number,
         *       skyCoverPct: Number
         *   }]
         */
        WeatherScout.prototype.getForecasts = function () {
            var array = [],
                forecast,
                i, max;
            
            if (!this.temporalWx) {
                log.error('WeatherScout', 'getForecasts', 'missingWeatherData');
                return array;
            }

            for (i = 0, max = this.temporalWx.length; i < max; i++) {
                forecast = this.temporalWx[i];
                array.push({
                    time: new Date(forecast.time),
                    airTemperatureF: parseInt(forecast.values[0], 10),
                    relaltiveHumidityPct: parseInt(forecast.values[1], 10),
                    windSpeedKts: parseInt(forecast.values[2], 10),
                    windDirectionDeg: parseInt(forecast.values[3], 10),
                    skyCoverPct: parseInt(forecast.values[4], 10)
                });
            }
            return array;
        };

        /**
         * Updates the weather lookout's weather forecast and location. 
         */
        WeatherScout.prototype.refresh = function () {
            this.refreshForecast();
            this.refreshPlace();
        };

        /**
         * Updates this object's weather attribute. 
         */
        WeatherScout.prototype.refreshForecast = function (deferred) {
            if (!this.latitude || !this.longitude || !this.duration) {
                return;
            }
            var self = this;

            // Get the weather forecast at this location
            WeatherService.pointForecast(
                this.latitude(),
                this.longitude(),
                this.duration(),
                function (json) { // Callback to process JSON result
                    self.processForecast(json);
                    log.info('WeatherScout', 'refreshForecast', self.name() + ': EVENT_WEATHER_CHANGED');
                    self.fire(events.EVENT_WEATHER_CHANGED, self);
                    if (deferred) {
                        deferred.resolve(self);
                    }
                }
            );
        };

        /**
         * Updates this object's place attributes. 
         */
        WeatherScout.prototype.refreshPlace = function (deferred) {
            
            if (!this.latitude || !this.longitude) {
                return;
            }
            var self = this,
                i, max, item, place = [], 
                placename = '';

            // Get the place name(s) at this location
            PlaceService.places(
                this.latitude(),
                this.longitude(),
                function (json) { // Callback to process YQL Geo.Places result

                    // Load all the places into a place object array
                    if (!json.query.results) {
                        log.error("WeatherScout", "refreshPlace", "json.query.results is null");
                        return;
                    }
                    if (json.query.count === 1) {
                        item = json.query.results.place;
                        place[0] = {"name": item.name, "type": item.placeTypeName.content};
                    } else {
                        for (i = 0, max = json.query.results.place.length; i < max; i++) {
                            item = json.query.results.place[i];
                            place[i] = {"name": item.name, "type": item.placeTypeName.content};
                        }
                    }
                    self.place = place; // Saving the place results for testing... not currently used

                    // Find the first place name (they're ordered by granularity) that's not a zip code
                    for (i = 0, max = place.length; i < max; i++) {
                        if (place[i].type !== "Zip Code") {
                            placename = place[i].name;
                            break;
                        }
                    }
                    // Update the placename property: toponym
                    self.toponym = placename;
                    
                    log.info('WeatherScout', 'refreshPlace', self.name() + ': EVENT_PLACE_CHANGED');
                    self.fire(events.EVENT_PLACE_CHANGED, self);
                    if (deferred) {
                        deferred.resolve(self);
                    }
                }
            );
        };

        /**
         * 
         * @param {type} json
         */
        WeatherScout.prototype.processForecast = function (json) {
            //Log.info('WeatherScout', 'processForecast', JSON.stringify(json));

            var isoTime, i, max;

            this.wxForecast = json;
            this.temporalWx = this.wxForecast.spatioTemporalWeather.spatialDomain.temporalDomain.temporalWeather;
            this.range = this.wxForecast.spatioTemporalWeather.range;

            // Add a Date object to each temporal entry
            for (i = 0, max = this.temporalWx.length; i < max; i++) {
                // .@time doesn't work because of the '@', so we use ['@time']
                isoTime = this.temporalWx[i]['@time'];
                this.temporalWx[i].time = new Date(isoTime);
            }
        };

        return WeatherScout;

    }

);

