/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WebGLRenderingContext, WorldWind */

define(['milsymbol', 'worldwind'],
    function (ms) {
        "use strict";

        /**
         * 
         * @param {WorldWind.Position} position
         * @param {String} symbolCode
         * @param {Object} symbolModifiers
         * @returns {TacticalSymbolPlacemark}
         */
        var TacticalSymbolPlacemark = function (position, symbolCode, symbolModifiers) {

            var normalAttributes = TacticalSymbolPlacemark.getPlacemarkAttributes(
                symbolCode, symbolModifiers, TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL);

            WorldWind.Placemark.call(this, position, true, normalAttributes);
            this.eyeDistanceScalingThreshold = 5000000;
            this.lastLevelOfDetail = TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL;

            this.updateSymbol(symbolCode, symbolModifiers);
        };
        TacticalSymbolPlacemark.prototype = Object.create(WorldWind.Placemark.prototype);

        /**
         * Copies the contents of a specified placemark to this placemark.
         * @param {TacticalSymbolPlacemark} that The placemark to copy.
         */
        TacticalSymbolPlacemark.prototype.copy = function (that) {

            // Delegate to the super function
            WorldWind.Placemark.prototype.copy.call(this, that);

            this.symbolCode = that.symbolCode;
            this.symbolModifiers = that.symbolModifiers;
            this.lastLevelOfDetail = that.levelOfDetail;
            return this;
        };

        /**
         * Creates a new placemark that is a copy of this placemark.
         * @returns {TacticalSymbolPlacemark} The new placemark.
         */
        TacticalSymbolPlacemark.prototype.clone = function () {
            var clone = new EnhancedPlacemark(this.position);

            clone.copy(this);
            clone.pickDelegate = this.pickDelegate || this;

            return clone;
        };

        /**
         * 
         * @param {String} symbolCode
         * @param {Object} symbolModifiers
         */
        TacticalSymbolPlacemark.prototype.updateSymbol = function (symbolCode, symbolModifiers) {
            this.symbolCode = symbolCode;
            this.symbolModifiers = symbolModifiers;

            this.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
            if (symbolCode.substring(2, 3) === "A") {
                // Air
                this.position.altitude = 15000;
            } else if (symbolCode.substring(2, 3) === "P") {
                // Space
                this.position.altitude = 150000;
            } else {
                // Ground/Sea/Subsurface
                this.position.altitude = 0;
            }

            switch (this.symbolCode.substring(0, 2)) {
                case "SF" :
                    this.declutterGroup = 100;
                    break;
                case "SH" :
                    this.declutterGroup = 101;
                    break;
                case "SN" :
                    this.declutterGroup = 102;
                    break;
                case "SU" :
                    this.declutterGroup = 103;
                    break;
            }
        };

        /**
         * Render this TacticalSymbol.
         * @param {DrawContext} dc The current draw context.
         */
        TacticalSymbolPlacemark.prototype.render = function (dc) {
            this.selectLevelOfDetail(dc);
            WorldWind.Placemark.prototype.render.call(this, dc);
        };

        TacticalSymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL = 0;
        TacticalSymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL = 1;
        TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL = 2;
        /**
         * Sets the far distance threshold; camera distances greater than this value use the low level of detail, and
         * distances less than this value but greater than the near threshold use the medium level of detail.
         */
        TacticalSymbolPlacemark.FAR_THRESHOLD = 5000000;
        /**
         * The near distance threshold; camera distances greater than this value but less that the far threshold use
         * the medium level of detail, and distances less than this value use the high level of detail.
         */
        TacticalSymbolPlacemark.NEAR_THRESHOLD = 3000000;

        /**
         * Sets the active attributes for the current distance to the camera and highlighted state.
         *
         * @param {DrawContext} dc The current draw context.
         */
        TacticalSymbolPlacemark.prototype.selectLevelOfDetail = function (dc) {

            var highlightChanged = this.lastHighlightState !== this.highlighted;

            // Determine the normal attributes based on the distance from the camera to the placemark
            if (this.eyeDistance > TacticalSymbolPlacemark.FAR_THRESHOLD) {
                // Low-fidelity: use a simplified SIDC code (without status) and no modifiers
                if (this.lastLevelOfDetail !== TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL || highlightChanged) {
                    this.attributes = TacticalSymbolPlacemark.getPlacemarkAttributes(
                        this.symbolCode, this.symbolModifiers, TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL);
                    this.lastLevelOfDetail = TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL;
                }
            } else if (this.eyeDistance > TacticalSymbolPlacemark.NEAR_THRESHOLD) {
                // Medium-fidelity: use the regulation SIDC code but without modifiers
                if (this.lastLevelOfDetail !== TacticalSymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL || highlightChanged) {
                    this.attributes = TacticalSymbolPlacemark.getPlacemarkAttributes(
                        this.symbolCode, this.symbolModifiers, TacticalSymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL);
                    this.lastLevelOfDetail = TacticalSymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL;
                }
            } else {
                // High-fidelity: use the regulation SIDC code and the modifiers
                if (this.lastLevelOfDetail !== TacticalSymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL || highlightChanged) {
                    this.attributes = TacticalSymbolPlacemark.getPlacemarkAttributes(
                        this.symbolCode, this.symbolModifiers, TacticalSymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL);
                    this.lastLevelOfDetail = TacticalSymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL;
                }
            }

            if (highlightChanged) {
                // Use a distinct set of attributes when highlighted, otherwise use the shared attributes
                if (this.highlighted) {
                    // Create a copy of the shared attributes bundle and increase the scale
                    var largeScale = this.attributes.imageScale * 1.2;
                    this.attributes = new WorldWind.PlacemarkAttributes(this.attributes);
                    this.attributes.imageScale = largeScale;
                }
            }
            this.lastHighlightState = this.highlighted;
        };


        /**
         * Returns an attibutes bundle for the given symbol code and modifiers.
         * @param {String} symbolCode
         * @param {Object} symbolModifiers bundle
         * @param {Number} levelOfDetail
         * @returns {WorldWind.PlacemarkAttributes}
         */
        TacticalSymbolPlacemark.getPlacemarkAttributes = function (symbolCode, symbolModifiers, levelOfDetail) {
            var symbol,
                basicModifiers = {size: symbolModifiers.size},
                attributes,
                size,
                anchor;

            // TODO create cache and retrieve from cache

            switch (levelOfDetail) {
                case TacticalSymbolPlacemark.HIGHEST_LEVEL_OF_DETAIL:
                    // Use the full version of the SIDC code and the given modifiers
                    symbol = new ms.Symbol(symbolCode, symbolModifiers || basicModifiers);
                    break;
                case TacticalSymbolPlacemark.MEDIUM_LEVEL_OF_DETAIL:
                    // Use the full version of the SIDC code but with only basic modifiers
                    symbol = new ms.Symbol(symbolCode, basicModifiers);
                    break;
                case TacticalSymbolPlacemark.LOW_LEVEL_OF_DETAIL:
                // fall through to default
                default:
                    // Use a simplified version of the SIDC code and basid modifiers
                    symbol = new ms.Symbol(symbolCode.slice(0, 5) + "-----*****", basicModifiers);
            }
            size = symbol.getSize();
            anchor = symbol.getAnchor();

            attributes = new WorldWind.PlacemarkAttributes(null);
            attributes.imageSource = new WorldWind.ImageSource(symbol.asCanvas());
            if (symbolCode.slice(2, 3) === "U") {
                // Subsurface
                attributes.imageOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, anchor.x, // x offset
                    WorldWind.OFFSET_PIXELS, size.height); // Anchor at top    
            } else {
                attributes.imageOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, anchor.x, // x offset
                    WorldWind.OFFSET_PIXELS, 0); // Anchor at bottom    
                // Achor at center 
                // WorldWind.OFFSET_PIXELS, size.height - anchor.y); // y offset converted to lower-left origin       
            }

            attributes.depthTest = false;
            attributes.imageScale = 1.0;
            attributes.imageColor = WorldWind.Color.WHITE;

            attributes.drawLeaderLine = true;
            attributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;
            attributes.leaderLineAttributes.outlineWidth = 2;

//            switch (symbolCode.substring(1, 2)) {
//                case "F" :
//                    attributes.imageColor = new WorldWind.Color(0, 0, 1, 1);
//                    break;
//                case "H" :
//                    attributes.imageColor = WorldWind.Color.RED;
//                    break;
//                case "N" :
//                    attributes.imageColor = new WorldWind.Color(0, 1, 0, 1);
//                    break;
//                case "U" :
//                    break;
//                    attributes.imageColor = WorldWind.Color.YELLOW;
//                default:
//                    attributes.imageColor = WorldWind.Color.WHITE;
//            }
            return attributes;
        };



        return TacticalSymbolPlacemark;
    });