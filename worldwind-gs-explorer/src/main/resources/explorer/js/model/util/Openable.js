/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */
/*global define*/

/**
 * Openable is a mix-in module that adds the "Open" capabilities to an object.
 * @param {Publisher} publisher Extends the object by adding the event generator
 * @param {Explorer
 * @returns {Openable}
 * 
 * @author Bruce Schubert
 */
define([
    'knockout',
    'model/util/Publisher', 
    'model/Events'],
    function (ko, publisher, events) {
        "use strict";
        
        var Openable = {
            open: function (params) {
                if (this.isOpenable()) {
                    if (this.openMe(params)) {
                        // Fire the opened event if we succeeded.
                        this.fire(events.EVENT_OBJECT_OPENED, this);
                    }
                }
            },
            /**
             * Adds the the Openable capabilities to the given object.
             * @param {Object} o The object that will become openable.
             * @param {Boolean Function()} openCallback The function that performs the edit.
             */
            makeOpenable: function (o, openCallback) {
                // Ensure we don't duplicate 
                if (o.open) {
                    return; // o is already openable
                }
                // Add the function(s)
                var i;
                for (i in Openable) {
                    if (Openable.hasOwnProperty(i) && typeof Openable[i] === 'function') {
                        if (Openable[i] === this.makeOpenable) {
                            continue;
                        }
                        o[i] = Openable[i];
                    }
                }
                // Add the properties
                o.isOpenable = ko.observable(true);
                o.openMe = openCallback;
                
                // Add the Publisher capability so that events can be generated.
                publisher.makePublisher(o);
            }
        };
        return Openable;
    }
);

