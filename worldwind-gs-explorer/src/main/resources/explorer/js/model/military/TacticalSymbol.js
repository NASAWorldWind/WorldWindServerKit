/* 
 * The MIT License
 * Copyright (c) 2016, Bruce Schubert.
 */

/*global WorldWind*/

define([
    'model/military/TacticalSymbolPlacemark',
    'model/util/ContextSensitive',
    'model/util/Formatter',
    'model/util/Openable',
    'model/util/Movable',
    'model/util/Removable',
    'model/util/Selectable',
    'model/util/WmtUtil',
    'milsymbol',
    'knockout',
    'jquery',
    'jquery-growl',
    'worldwind'],
    function (
        TacticalSymbolPlacemark,
        contextSensitive,
        formatter,
        openable,
        movable,
        removable,
        selectable,
        util,
        ms,
        ko,
        $) {
        "use strict";

        /**
         * Constructs a TacticalSymbol wrapper around a Placemark and Layer.
         * @param {SymbolManager} manager
         * @param {Position} position
         * @param {Object} params Parameters object containing:
         * {    
         *      id: optional, must be unique, will be assigned if missing
         *      name: optional, will be assigned if missing
         *      isMovable: optional, will be set to true if missing
         *      editor: 
         *  }
         * @constructor
         */
        var TacticalSymbol = function (manager, position, params) {
            var self = this,
                args = params || {};

            this.globe = manager.globe;

            // ---------------------------
            // Add the mix-in capabilites
            // ---------------------------

            // Make movable by the PickController: adds the isMovable, latitude and longitude
            // observables. The SymbolManager toggles the isMovable state when a symbol is selected.
            movable.makeMovable(this);

            // Make selectable via picking (see PickController): adds the "select" method
            selectable.makeSelectable(this, function (params) {   // define the callback that selects this symbol
                this.isMovable(params.selected);
                this.placemark.highlighted = params.selected;
                return true;    // return true to fire a EVENT_OBJECT_SELECTED event
            });

            // Make openable via menus: adds the isOpenable member and the "open" method
            openable.makeOpenable(this, function () {   // define the callback that "opens" this symbol
                // TODO: get the symbol editor ID from parameters
                // TODO: add error checking for existance of editor
                // TOOD: set openable false if no editor element defined in options/params
                // TODO: symbol editor should be assigned in the constructor
                var $editor = $("#symbol-editor"),
                    symbolEditor = ko.dataFor($editor.get(0));
                symbolEditor.open(this);
                return true; // return true to fire EVENT_OBJECT_OPENED event.
            });

            // Make deletable via menu: adds the isRemovable member and the "remove" method
            removable.makeRemovable(this, function () {     // define the callback that "removes" this symbol
                // TODO: Could ask for confirmation; return false if veto'd
                manager.removeSymbol(self);     // Removes the symbol from the manager's observableArray
                return true;    // return true to fire a EVENT_OBJECT_REMOVED
            });

            // Make context sensitive by the PickController: adds the isContextSensitive member
            contextSensitive.makeContextSensitive(this, function () {    // define the function that shows the context sentive memnu
                $.growl({
                    title: self.name(),
                    message: "Location: " + self.toponym() + ", " + self.location()});
            });

            // ------------
            // Observables
            // ------------

            /** The unique id used to identify this particular symbol object */
            this.id = ko.observable(args.id || util.guid());
            /** The name of this symbol */
            this.name = ko.observable(args.name || "Symbol");
            /** The movable mix-in state */
            this.isMovable(args.isMovable === undefined ? false : args.isMovable);
            /** The latitude of this symbol -- set be by the Movable interface during pick/drag operations. See PickController */
            this.latitude(position.latitude);
            /** The longitude of this symbol -- may be set by the Movable interface during pick/drag operations See PickController */
            this.longitude(position.longitude);
            /** The lat/lon location string of this symbol */
            this.location = ko.computed(function () {
                return formatter.formatDecimalDegreesLat(self.latitude(), 3) + ", " + formatter.formatDecimalDegreesLon(self.longitude(), 3);
            });

            this.symbolCode = ko.observable(args.symbolCode || "SUG------------"); // Default to  Warfighting. Unknown. Ground.
            this.modifiers = ko.observable({size: 30}); // Set the default size


//            this.symbolCode = ko.observable("sfgpewrh--mt");
//            this.modifiers = ko.observable({
//                size: 30,
//                quantity: 200,
//                staffComments: "for reinforcements".toUpperCase(),
//                additionalInformation: "added support for JJ".toUpperCase(),
//                direction: (750 * 360 / 6400),
//                type: "machine gun".toUpperCase(),
//                dtg: "30140000ZSEP97",
//                location: "0900000.0E570306.0N"
//            });


            // ----------
            // Internals
            // ----------
            /** The image source url, stored/recalled in the persistant store */
            this.source = args.imageSource;
            /** DOM element id to display view when this symbol is selected. */
            this.viewTemplateName = 'tactical-symbol-view-template';

            this.placemark = new TacticalSymbolPlacemark(position, this.symbolCode(), this.modifiers());

            //this.placemark.label = this.name();

            // Configure the placemark to return this symbol object when the placemark is picked, 
            // See: PickController
            this.placemark.pickDelegate = this;

            // --------------
            // Event handlers
            // --------------

            // Update the placemark when the symbol code changes
            this.symbolCode.subscribe(function (newSymbolCode) {
                self.name(newSymbolCode);
                self.placemark.updateSymbol(newSymbolCode, self.modifiers());
                self.placemark.attributes = TacticalSymbolPlacemark.getPlacemarkAttributes(
                    newSymbolCode, self.modifiers(), self.placemark.lastLevelOfDetail);
            });

            this.latitude.subscribe(function (newLat) {
                self.placemark.position.latitude = newLat;
            });
            this.longitude.subscribe(function (newLon) {
                self.placemark.position.longitude = newLon;
            });

        };


        TacticalSymbol.imagePath = 'js/model/images/milstd2525c/';
        TacticalSymbol.templates = [
            {name: "Air ", symbolCode: "SFAP-----------", imageSource: TacticalSymbol.imagePath + "sfap-----------.png"},
            {name: "Ground ", symbolCode: "SFGP-----------", imageSource: TacticalSymbol.imagePath + "sfgp-----------.png"},
            {name: "SOF Unit ", symbolCode: "SFFP-----------", imageSource: TacticalSymbol.imagePath + "sffp-----------.png"},
            {name: "Sea Surface ", symbolCode: "SFSP-----------", imageSource: TacticalSymbol.imagePath + "sfsp-----------.png"},
            {name: "Sea Sub Surface ", symbolCode: "SFUP-----------", imageSource: TacticalSymbol.imagePath + "sfup-----------.png"},
            {name: "Neutral ", symbolCode: "SNZP-----------", imageSource: TacticalSymbol.imagePath + "snzp-----------.png"},
            {name: "Hostile ", symbolCode: "SHZP-----------", imageSource: TacticalSymbol.imagePath + "shzp-----------.png"},
            {name: "Unknown ", symbolCode: "SUZP-----------", imageSource: TacticalSymbol.imagePath + "suzp-----------.png"},
            {name: "EMS Operations", symbolCode: "EFOPA----------", imageSource: TacticalSymbol.imagePath + "efopa----------.png"},
            {name: "Emergency Operations", symbolCode: "EFOPB----------", imageSource: TacticalSymbol.imagePath + "efopb----------.png"},
            {name: "FF Operations", symbolCode: "EFOPC----------", imageSource: TacticalSymbol.imagePath + "efopc----------.png"},
            {name: "Law Enforement Unit", symbolCode: "EFOPDA---------", imageSource: TacticalSymbol.imagePath + "efopda---------.png"},
            {name: "Fire Incident", symbolCode: "EHIPC----------", imageSource: TacticalSymbol.imagePath + "ehipc----------.png"},
            {name: "HazMat Incident", symbolCode: "EHIPD----------", imageSource: TacticalSymbol.imagePath + "ehipd----------.png"}
        ];

        return TacticalSymbol;
    }
);

