/* 
 * Copyright (c) 2015, Bruce Schubert <bruce@emxsys.com>
 * All rights reserved.
 */

/*global define, $ */

define([
    'model/Constants',
    'model/util/Log',
    'model/util/WmtUtil'],
    function (constants,
        log,
        util) {
        "use strict";
        var WeatherService = {
            /**
             * Creates a weather tuple that is compatible with the SurfaceFireResource.
             *
             * @param {Object} wx A weather object from the WeatherScout
             * @return {JSON} Example:
             *  {
             *      "airTemperature":{"type":"air_temp:F","value":"65.0","unit":"fahrenheit"},
             *      "relativeHumidity":{"type":"rel_humidity:%","value":"20.0","unit":"%"},
             *      "windSpeed":{"type":"wind_speed:kts","value":"15.0","unit":"kt"},
             *      "windDirection":{"type":"wind_dir:deg","value":"270.0","unit":"deg"},
             *      "cloudCover":{"type":"cloud_cover:%","value":"10.0","unit":"%"}
             *  }
             */
            makeTuple: function (wx) {
                return JSON.parse('{' +
                    '"airTemperature":{"type":"air_temp:F","value":"' + wx.airTemperatureF + '","unit":"fahrenheit"},' +
                    '"relativeHumidity":{"type":"rel_humidity:%","value":"' + wx.relaltiveHumidityPct + '","unit":"%"},' +
                    '"windSpeed":{"type":"wind_speed:kts","value":"' + wx.windSpeedKts + '","unit":"kt"},' +
                    '"windDirection":{"type":"wind_dir:deg","value":"' + wx.windDirectionDeg + '","unit":"deg"},' +
                    '"cloudCover":{"type":"cloud_cover:%","value":"' + wx.skyCoverPct + '","unit":"%"}' +
                    '}');
            },
            /**
             * Gets a weather tuple that is compatible with the SurfaceFireResource.
             *
             * @param {Number} airTempF Air temperature in Fahrenheit.
             * @param {Number} relHum Relative Humidity in percent.
             * @param {Number} windSpdKts Wind speed in knots.
             * @param {Number} windDir Wind direction in degrees
             * @param {Number} clouds Cloud/sky cover in percent
             * @param {Function(JSON)} callback Receives a WeatherTuple JSON object.
             * Example:
             *  {
             *      "airTemperature":{"type":"air_temp:F","value":"65.0","unit":"fahrenheit"},
             *      "relativeHumidity":{"type":"rel_humidity:%","value":"20.0","unit":"%"},
             *      "windSpeed":{"type":"wind_speed:kts","value":"15.0","unit":"kt"},
             *      "windDirection":{"type":"wind_dir:deg","value":"270.0","unit":"deg"},
             *      "cloudCover":{"type":"cloud_cover:%","value":"10.0","unit":"%"}
             *  }
             */
            weatherTuple: function (airTempF, relHum, windSpdKts, windDir, clouds, callback) {
                // TODO: assert input values
                var url = constants.WEATHER_REST_SERVICE,
                    query = "mime-type=application/json"
                    + "&airTemperature=" + airTempF
                    + "&relativeHumidity=" + relHum
                    + "&windSpeed=" + windSpdKts
                    + "&windDirection=" + windDir
                    + "&cloudCover=" + clouds;
                console.log(url + '?' + query);
                $.get(url, query, callback);
            },
            /**
             *
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Number} duration
             * @param {Function(JSON)} callback Receives a weather forecast JSON object.
             */
            pointForecast: function (latitude, longitude, duration, callback) {
                // TODO: assert input values
                var url = constants.WEATHER_REST_SERVICE + '/pointforecast',
                    query = "mime-type=application/json"
                    + "&latitude=" + latitude
                    + "&longitude=" + longitude
                    + "&duration=" + duration;
                console.log(url + '?' + query);
                $.get(url, query, callback);
            }
        };
        return WeatherService;
    }
);