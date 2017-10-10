/* 
 * The MIT License.
 * Copyright (c) 2015, 2016 Bruce Schubert.
 */

/*global define, $ */

define(['model/util/Log',
        'model/util/WmtUtil'],
    function (log,
              util) {
        "use strict";
        var PlaceService = {
            /**
             * Gets places near the given lat/lon from the Yahoo GeoPlanet geo.places table.
             *
             * @param {Number} latitude
             * @param {Numnber} longitude
             * @param {Function} callback Function that accepts the JSON result.
             *
             * Note important lat/lon coordinate formatting discoveries in the following see also:
             * @see https://bitbucket.org/emxsys/wildfire-management-tool-web/issues/104/yahoo-placename-query-to-geoplaces-stopped
             *
             * JSON example (note, place object is not an array if count == 1):
             * {
             *  "query": {
             *   "count": 10,
             *   "created": "2015-07-26T13:20:24Z",
             *   "lang": "en-US",
             *   "results": {
             *    "place": [
             *     {
             *      "lang": "en-US",
             *      "uri": "http://where.yahooapis.com/v1/place/56574623",
             *      "woeid": "56574623",
             *      "placeTypeName": {
             *       "code": "22",
             *       "content": "Suburb"
             *      },
             *      "name": "Oxnard Airport",
             *      "country": {
             *       "code": "US",
             *       "type": "Country",
             *       "woeid": "23424977",
             *       "content": "United States"
             *      },
             *      "admin1": {
             *       "code": "US-CA",
             *       "type": "State",
             *       "woeid": "2347563",
             *       "content": "California"
             *      },
             *      "admin2": {
             *       "code": "",
             *       "type": "County",
             *       "woeid": "12587725",
             *       "content": "Ventura"
             *      },
             *      "admin3": null,
             *      "locality1": {
             *       "type": "Town",
             *       "woeid": "2467212",
             *       "content": "Oxnard"
             *      },
             *      "locality2": {
             *       "type": "Suburb",
             *       "woeid": "56574623",
             *       "content": "Oxnard Airport"
             *      },
             *      "postal": {
             *       "type": "Zip Code",
             *       "woeid": "12796704",
             *       "content": "93030"
             *      },
             *      "centroid": {
             *       "latitude": "34.200260",
             *       "longitude": "-119.207932"
             *      },
             *      "boundingBox": {
             *       "southWest": {
             *        "latitude": "34.197441",
             *        "longitude": "-119.221138"
             *       },
             *       "northEast": {
             *        "latitude": "34.203091",
             *        "longitude": "-119.194633"
             *       }
             *      },
             *      "areaRank": "1",
             *      "popRank": "0",
             *      "timezone": {
             *       "type": "Time Zone",
             *       "woeid": "56043663",
             *       "content": "America/Los_Angeles"
             *      }
             *     },
             *     {...}
             *    ]
             *   }
             *  }
             * }
             */
            places: function (latitude, longitude, callback) {
                // TODO: assert input values
                // See: https://developer.yahoo.com/yql/console/#h=desc+geo.places
                // And: http://real.developer.yahoo.com/geo/geoplanet/guide/yql-tables.html#geo-places
                var url = 'https://query.yahooapis.com/v1/public/yql',
                    query = 'q=select * from geo.places where '
                        + 'text="(' + latitude + ',' + longitude + ')"'
                        + '&format=json'
                        + '&diagnostics=true'
                        + '&callback=';
                console.log(url + '?' + query);
                $.get(url, query, callback);
            },
            /**
             * Gets the reverse geocode address for the given lat/lon from the Yahoo GeoPlanet geo.placefinder table.
             * @param {type} latitude
             * @param {type} longitude
             * @param {Function(JSON)} callback Function that recieves the JSON results.
             *
             * YQL console example:
             *  Query: select * from geo.placefinder where text="34.2 -119.2" and gflags="R"
             *  Result:
             * {
             *  "query": {
             *   "count": 1,
             *   "created": "2015-07-26T13:31:28Z",
             *   "lang": "en-US",
             *   "results": {
             *    "Result": {
             *     "quality": "72",
             *     "latitude": "34.2",
             *     "longitude": "-119.2",
             *     "offsetlat": "34.2",
             *     "offsetlon": "-119.2",
             *     "radius": "400",
             *     "name": "34.2 -119.2",
             *     "line1": "Mallard Way",
             *     "line2": "Oxnard, CA 93030",
             *     "line3": null,
             *     "line4": "United States",
             *     "house": null,
             *     "street": "Mallard Way",
             *     "xstreet": null,
             *     "unittype": null,
             *     "unit": null,
             *     "postal": "93030",
             *     "neighborhood": "Teal Club",
             *     "city": "Oxnard",
             *     "county": "Ventura County",
             *     "state": "California",
             *     "country": "United States",
             *     "countrycode": "US",
             *     "statecode": "CA",
             *     "countycode": null,
             *     "uzip": "93030",
             *     "hash": null,
             *     "woeid": "12796704",
             *     "woetype": "11"
             *    }
             *   }
             *  }
             * }
             */
            placefinder: function (latitude, longitude, callback) {
                // TODO: assert input values
                // Yahoo Query Language (YQL) API call
                // https://developer.yahoo.com/yql/console/#h=desc+geo.placefinder
                var url = 'https://query.yahooapis.com/v1/public/yql',
                    query = 'q=select * from geo.placefinder where '
                        + 'text="' + latitude + ' ' + longitude + '" and gflags="R"'
                        + '&format=json'
                        + '&diagnostics=true'
                        + '&callback=';
                console.log(url + '?' + query);
                $.get(url, query, callback);
            },
            /**
             * Gets a lat/lon for the given place name, address, airport code or coordinates.
             * @param {String} Address, place name, airport code, or coordinates.
             * @param {Function(JSON)} callback Function that recieves the JSON results.
             */
            gazetteer: function (place, callback) {
                // TODO: assert input values
                // https://developer.yahoo.com/yql/console/#h=desc+geo.placefinder
                var url = 'https://query.yahooapis.com/v1/public/yql',
                    query = 'q=select * from geo.placefinder where '
                        + 'text="' + place + '"'
                        + '&format=json'
                        + '&diagnostics=true'
                        + '&callback=';
                console.log(url + '?' + query);
                $.get(url, query, callback);
            }
        };
        return PlaceService;
    }
);