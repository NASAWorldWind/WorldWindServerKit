/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/* global define, WorldWind */

/**
 * A ShapefileLayer.
 *
 * @exports ShapefileLayer
 * @author Bruce Schubert
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        /**
         * Constructs a layer for a shapefile.
         * @constructor
         */
        var ShapefileLayer = function (shapefileUrl, layerName, shapeConfigurationCallback) {

            WorldWind.RenderableLayer.call(this, layerName || shapefileUrl);

            this._opacity = 0.25;

            var shapefilePath = shapefileUrl,
                shapefile = new WorldWind.Shapefile(shapefilePath);

            if (shapeConfigurationCallback === undefined) {
                shapeConfigurationCallback = function (attributes, record) {
                    var configuration = {};
                    configuration.name = attributes.values.name || attributes.values.Name || attributes.values.NAME;
                    configuration.attributes = new WorldWind.ShapeAttributes(null);
                    // Fill the polygon with a random pastel color.
                    configuration.attributes.interiorColor = new WorldWind.Color(
                        0.375 + 0.5 * Math.random(),
                        0.375 + 0.5 * Math.random(),
                        0.375 + 0.5 * Math.random(),
                        0.25);

                    // Paint the outline in a darker variant of the interior color.
                    configuration.attributes.outlineColor = new WorldWind.Color(
                        0.5 * configuration.attributes.interiorColor.red,
                        0.5 * configuration.attributes.interiorColor.green,
                        0.5 * configuration.attributes.interiorColor.blue,
                        0.5);

                    // Make the DBaseRecord and Layer available to picked objects
                    configuration.userProperties = {record: attributes, layer: record.shapefile.layer};

                    return configuration;
                };
            }


            // Create renderables for all the features in the shapefile
            // and add them to this layer.
            shapefile.load(null, shapeConfigurationCallback, this);


        };

        // Inherit the RenderableLayer methods
        ShapefileLayer.prototype = Object.create(WorldWind.RenderableLayer.prototype);


        /**
         * Overrides the RenderableLayer opacity member to set the alpha channel on the shapefile's feature colors.
         */
        Object.defineProperties(ShapefileLayer.prototype, {
            opacity: {
                get: function () {
                    return this._opacity;
                },
                set: function (value) {
                    this._opacity = value;
                    if (this.renderables) {
                        for (var i = 0, len = this.renderables.length; i < len; i++) {
                            if (this.renderables[i].attributes) {
                                this.renderables[i].attributes.interiorColor.alpha = this._opacity;
                                // We must set the SurfaceShape's stateKeyInvalid flag to true when attributes change
                                this.renderables[i].attributes.stateKeyInvalid = true;
                            }
                        }
                    }
                }
            }

        });

        return ShapefileLayer;
    }
);