/* 
 * The MIT License.
 * Copyright (c) 2015, 2016 Bruce Schubert
 */

/*global define, $, WorldWind */

/**
 * The WeatherMapSymbol module renders a composite WorldWind.Renderable representing a weather station.
 * A WeatherMapSymbol object is a "view" of a WeatherScout "model" object.
 *
 * @param {type} AirTemperature
 * @param {type} controller
 * @param {type} ForecastTime
 * @param {type} RelativeHumidity
 * @param {type} SkyCover
 * @param {type} WindBarb
 * @param {type} wmt
 * @param {type} ww
 * @returns {WeatherMapSymbol}
 *
 * @author Bruce Schubert
 */
define(['model/weather/symbols/AirTemperature',
        'model/weather/symbols/Background',
        'model/weather/symbols/ForecastTime',
        'model/weather/symbols/RelativeHumidity',
        'model/weather/symbols/SkyCover',
        'model/weather/symbols/WindBarb',
        'model/Config',
        'model/Constants',
        'model/Events',
        'worldwind'],
    function (
              AirTemperature,
              Background,
              ForecastTime,
              RelativeHumidity,
              SkyCover,
              WindBarb,
              config,
              constants,
              events,
              ww) {
        "use strict";

        var WeatherMapSymbol = function (wxScout) {

            // Inherit Renderable properties
            WorldWind.Renderable.call(this);

            var self = this,
                wx, i, max,
                timeOptions = {"hour": "2-digit", "minute": "2-digit", "timeZoneName": "short"};

            // Maintain a reference to the weather object this symbol represents
            this.wxScout = wxScout;

            // Create the composite weather map symbol components
            this.background = new Background(wxScout.latitude(), wxScout.longitude());
            this.skyCover = new SkyCover(wxScout.latitude(), wxScout.longitude());
            this.windBarb = new WindBarb(wxScout.latitude(), wxScout.longitude());
            this.airTemperature = new AirTemperature(wxScout.latitude(), wxScout.longitude(), 'F');
            this.relHumidity = new RelativeHumidity(wxScout.latitude(), wxScout.longitude(), '%');
            this.forecastTime = new ForecastTime(wxScout.latitude(), wxScout.longitude(), ' ');

            // Add a reference to our wx model object to the principle renderables.
            // The "movable" wxScoute will generate EVENT_OBJECT_MOVED events. 
            // See the SelectController.
            this.background.pickDelegate = wxScout;
            this.skyCover.pickDelegate = wxScout;
            this.windBarb.pickDelegate = wxScout;
            this.airTemperature.pickDelegate = wxScout;
            this.relHumidity.pickDelegate = wxScout;
            this.forecastTime.pickDelegate = wxScout;

            this.skyCover.label = wxScout.name();   // TODO: could be configured for place or lat/lon


            // EVENT_OBJECT_MOVED handler that synchronizes the composite renderables with the model's location
            this.handleObjectMovedEvent = function (wxScout) {
                self.background.position.latitude = wxScout.latitude();
                self.background.position.longitude = wxScout.longitude();
                self.skyCover.position.latitude = wxScout.latitude();
                self.skyCover.position.longitude = wxScout.longitude();
                self.windBarb.position.latitude = wxScout.latitude();
                self.windBarb.position.longitude = wxScout.longitude();
                self.airTemperature.position.latitude = wxScout.latitude();
                self.airTemperature.position.longitude = wxScout.longitude();
                self.relHumidity.position.latitude = wxScout.latitude();
                self.relHumidity.position.longitude = wxScout.longitude();
                self.forecastTime.position.latitude = wxScout.latitude();
                self.forecastTime.position.longitude = wxScout.longitude();
            };

            // EVENT_WEATHER_CHANGED handler that updates the symbology
            this.handleWeatherChangedEvent = function (wxScout) {
                wx = wxScout.getForecastAtTime(wxScout.globe.dateTime());
                // Update the values
                self.skyCover.updateSkyCoverImage(wx.skyCoverPct);
                self.windBarb.updateWindBarbImage(wx.windSpeedKts, wx.windDirectionDeg);
                self.airTemperature.text = wx.airTemperatureF + 'F';
                self.relHumidity.text = wx.relaltiveHumidityPct + '%';
                self.forecastTime.text = '@ ' + wx.time.toLocaleTimeString('en', timeOptions);
            };

            // EVENT_PLACE_CHANGED handler that updates the label
            this.handlePlaceChangedEvent = function (wxScout) {
                
                if (config.weatherScoutLabels === constants.WEATHER_SCOUT_LABEL_PLACE) {
                    // Display the place name
                    self.skyCover.label = wxScout.toponym || null;
                } else if (config.weatherScoutLabels === constants.WEATHER_SCOUT_LABEL_LATLON) {
                    // Display "Lat Lon"
                    self.skyCover.label = wxScout.latitude.toFixed(3) + ' ' + wxScout.longitude.toFixed(3);
                }
            };

            //EVENT_TIME_CHANGED handler that updates the label and symbology
            this.handleTimeChangedEvent = function (time) {
                wx = self.wxScout.getForecastAtTime(time);
                // Update the values
                self.skyCover.updateSkyCoverImage(wx.skyCoverPct);
                self.windBarb.updateWindBarbImage(wx.windSpeedKts, wx.windDirectionDeg);
                self.airTemperature.text = wx.airTemperatureF + 'F';
                self.relHumidity.text = wx.relaltiveHumidityPct + '%';
                if (wx.time.getTime() === 0) { // See: WeatherScout.INVALID_WX.time
                    self.forecastTime.text = '-'; // empty labels not allowed
                } else {
                    self.forecastTime.text = '@ ' + wx.time.toLocaleTimeString('en', timeOptions);
                }
            };

            // Establish the Publisher/Subscriber relationship between this symbol and the wx scout
            wxScout.on(events.EVENT_OBJECT_MOVED, this.handleObjectMovedEvent, this);
            wxScout.on(events.EVENT_PLACE_CHANGED, this.handlePlaceChangedEvent, this);
            wxScout.on(events.EVENT_WEATHER_CHANGED, this.handleWeatherChangedEvent, this);
            wxScout.on(events.EVENT_TIME_CHANGED, this.handleTimeChangedEvent, this);

            // Set the initial values to the current application time
            this.handleTimeChangedEvent(wxScout.globe.dateTime());
        };
        // Inherit Renderable functions.
        WeatherMapSymbol.prototype = Object.create(WorldWind.Renderable.prototype);

        /**
         * Render this WeatherMapSymbol.
         * @param {DrawContext} dc The current draw context.
         */
        WeatherMapSymbol.prototype.render = function (dc) {

            // Rotate the wind barb to match the view
            this.windBarb.imageRotation = dc.navigatorState.heading;
            // Tilt the wind barb to match the view
            //this.windBarb.imageTilt = dc.navigatorState.tilt; -- Disabled: visbility diminished when tilted

            //this.background.enabled = this.highlighted;
            this.background.highlighted = this.highlighted;

            this.background.render(dc);
            this.skyCover.render(dc);
            this.airTemperature.render(dc);
            this.relHumidity.render(dc);
            this.forecastTime.render(dc);
            this.windBarb.render(dc);
        };

        return WeatherMapSymbol;
    }
);
