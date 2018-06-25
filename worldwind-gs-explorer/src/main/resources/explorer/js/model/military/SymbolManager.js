/*
 * The MIT License
 * Copyright (c) 2016 Bruce Schubert.
 */

/*global WorldWind*/

define([
    'model/military/TacticalSymbol',
    'knockout',
    'model/Constants',
    'worldwind'],
    function (
        TacticalSymbol,
        ko,
        constants) {

        "use strict";
        /**
         * Constructs a SymbolManager that manages a collection of TacticalSymbols.
         * @param {Globe} globe
         * @param {RenderableLayer} layer Optional.
         * @constructor
         */
        var SymbolManager = function (globe, layer) {
            var self = this;
            this.globe = globe;
            this.layer = layer || globe.findLayer(constants.LAYER_NAME_TACTICAL_SYMBOLS);
            this.symbols = ko.observableArray();
            this.symbolCount = ko.observable(0);


            // Subscribe to "arrayChange" events ...
            // documented here: http://blog.stevensanderson.com/2013/10/08/knockout-3-0-release-candidate-available/
            this.symbols.subscribe(function (changes) {
                changes.forEach(function (change) {
                    if (change.status === 'added' && change.moved === undefined) {
                        // Ensure the name is unique by appending a suffix if reqd.
                        // (but not if the array reordered -- i.e., moved items)
                        self.doEnsureUniqueName(change.value);
                        self.doAddSymbolToLayer(change.value);
                    } else if (change.status === 'deleted' && change.moved === undefined) {
                        // When a symbol is removed we must remove the placemark,
                        // (but not if the array reordered -- i.e., moved items)
                        self.doRemoveSymbolFromLayer(change.value);
                    }
                });
                self.symbolCount(self.symbols().length);

            }, null, "arrayChange");

            /**
             * Adds a TacticalSymbol to this manager.
             * @param {TacticalSymbol} symbol The symbol to be managed.
             */
            this.addSymbol = function (symbol) {
                self.symbols.push(symbol);  // observable
            };
            
            this.gotoSymbol = function (marker) {
                self.globe.goto(marker.latitude(), marker.longitude());
            };

            /**
             * Finds the symbol with the given id.
             * @param {String} id System assigned id for the symbol.
             * @returns {SymbolNode} The symbol object if found, else null.
             */
            this.findSymbol = function (id) {
                var symbol, i, len;
                for (i = 0, len = self.symbols.length(); i < len; i += 1) {
                    symbol = self.symbols()[i];
                    if (symbol.id === id) {
                        return symbol;
                    }
                }
                return null;
            };

            /**
             * Removes the given symbol from the symbols array and from the symbol's renderable layer.
             * @param {TacticalSymbol} symbol The symbol to be removed
             */
            this.removeSymbol = function (symbol) {
                self.symbols.remove(symbol);
            };

            // Internal method to ensure the name is unique by appending a suffix if reqd.
            this.doEnsureUniqueName = function (symbol) {
                symbol.name(self.generateUniqueName(symbol));
            };

            // Internal method to remove the placemark from its layer.
            this.doAddSymbolToLayer = function (symbol) {
                self.layer.addRenderable(symbol.placemark);
            };

            // Internal method to remove the placemark from its layer.
            this.doRemoveSymbolFromLayer = function (symbol) {
                var i, max, placemark = symbol.placemark;
                // Remove the placemark from the renderable layer
                for (i = 0, max = self.layer.renderables.length; i < max; i++) {
                    if (self.layer.renderables[i] === placemark) {
                        self.layer.renderables.splice(i, 1);
                        break;
                    }
                }
                this.globe.selectController.doDeselect(symbol);
            };

            /**
             * Saves the symbols list to local storage.
             */
            this.saveSymbols = function () {
                var validSymbols = [],
                    symbolsString,
                    i, len, symbol;

                // Knockout's toJSON can fail on complex objects... it appears
                // to recurse and a call stack limit can be reached. So here we
                // create a simplfied version of the object here to pass to toJSON.
                for (var i = 0, len = self.symbols().length; i < len; i++) {
                    symbol = self.symbols()[i];
                    if (!symbol.invalid) {
                        validSymbols.push({
                            id: symbol.id,
                            name: symbol.name,
                            symbolCode: symbol.symbolCode,
                            latitude: symbol.latitude,
                            longitude: symbol.longitude,
                            isMovable: symbol.isMovable
                        });
                    }
                }
                symbolsString = ko.toJSON(validSymbols, ['id', 'name', 'symbolCode', 'latitude', 'longitude', 'isMovable']);
                localStorage.setItem(constants.STORAGE_KEY_TACTICAL_SYMBOLS, symbolsString);
            };

            /**
             * Restores the symbols list from local storage.
             */
            this.restoreSymbols = function () {
                var string = localStorage.getItem(constants.STORAGE_KEY_TACTICAL_SYMBOLS),
                    array, max, i,
                    position, params;

                // Convert JSON array to array of objects
                array = JSON.parse(string);
                if (array && array.length !== 0) {
                    for (i = 0, max = array.length; i < max; i++) {
                        position = new WorldWind.Position(array[i].latitude, array[i].longitude, 0);
                        params = {id: array[i].id, name: array[i].name, symbolCode: array[i].symbolCode, isMovable: array[i].isMovable};

                        this.addSymbol(new TacticalSymbol(self, position, params));
                    }
                }
            };


            /**
             * Generates a unique name by appending a suffix '(n)'.
             * @param {TacticalSymbol} symbol
             * @returns {String}
             */
            this.generateUniqueName = function (symbol) {
                var uniqueName = symbol.name().trim(),
                    otherSymbol,
                    isUnique,
                    suffixes,
                    seqNos,
                    n, i, len;

                // Loop while name not unique
                do {
                    // Assume uniqueness, set to false if we find a matching name
                    isUnique = true;

                    // Test the name for uniqueness with the other symbols
                    for (i = 0, len = self.symbols().length; i < len; i += 1) {
                        otherSymbol = self.symbols()[i];
                        if (otherSymbol === symbol) {
                            continue; // Don't test with self
                        }
                        if (otherSymbol.name() === uniqueName) {
                            isUnique = false;

                            // check for existing suffix '(n)' and increment
                            suffixes = uniqueName.match(/[(]\d+[)]$/);
                            if (suffixes) {
                                // increment an existing suffix's sequence number
                                seqNos = suffixes[0].match(/\d+/);
                                n = parseInt(seqNos[0], 10) + 1;
                                uniqueName = uniqueName.replace(/[(]\d+[)]$/, '(' + n + ')');
                            } else {
                                // else if no suffix, create one
                                uniqueName += ' (2)';   // The first duplicate is #2
                            }
                            // Break out of the for loop and recheck uniqueness
                            break;
                        }
                    }
                } while (!isUnique);

                return uniqueName;
            };
        };

        return SymbolManager;
    }
);

