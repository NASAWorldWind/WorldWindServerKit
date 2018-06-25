/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */
/*global define*/

/**
 * Removable is a mix-in module that adds "remove" capabilites to an object.
 * 
 * @param {Publisher} publisher Extends the object with publish event capabilites.
 * @param {Events} events Constants.
 * @returns {Removable}
 * 
 * @author Bruce Schubert
 */
define([
    'knockout',
    'model/util/Publisher',
    'model/Events'],
    function (
        ko,
        publisher,
        events) {
        "use strict";
        var Removable = {
            remove: function () {
                var success = false;
                if (this.isRemovable()) {
                    success = this.removeMe();
                    if (success) {
                        this.fire(events.EVENT_OBJECT_REMOVED, this);
                    }
                }
                return success;
            },
            /**
             * Adds the the movable capabilities to the given object.
             * @param {Object} o The object that will become removable.
             * @param {Boolean Function()} removeCallback The function that performs the remove.
             */
            makeRemovable: function (o, removeCallback) {
                // Ensure we don't duplicate 
                if (o.removeMe) {
                    return; // o is already removable
                }
                // Add the function(s)
                var i;
                for (i in Removable) {
                    if (Removable.hasOwnProperty(i) && typeof Removable[i] === 'function') {
                        if (Removable[i] === this.makeRemovable) {
                            continue;
                        }
                        o[i] = Removable[i];
                    }
                }
                // Add the properties
                o.isRemovable = ko.observable(true);
                o.removeMe = removeCallback;

                // Add the Publisher capability so that events can be generated.
                publisher.makePublisher(o);
            }
        };
        return Removable;
    }
);

