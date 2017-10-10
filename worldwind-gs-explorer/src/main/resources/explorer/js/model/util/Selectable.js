/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */
/*global define*/

/**
 * Selectable is a mix-in module that adds the "select" capabilities to an object.
 * @param {Publisher} publisher Extends the object by adding the event generator.
 * @param {Events} events Event constants.
 * @returns {Selectable}
 * 
 * @author Bruce Schubert
 */
define([
    'knockout',
    'model/util/Publisher', 
    'model/Events'],
    function (ko, publisher, events) {
        "use strict";
        
        var Selectable = {
            // select function template added to Selectable instances
            select: function (params) {
                if (this.isSelectable()) {
                    if (this.selectMe(params)) {
                        // Fire the selected event if we succeeded.
                        this.fire(events.EVENT_OBJECT_SELECTED, this);
                    }
                }
            },
            /**
             * Adds the the Selectable capabilities to the given object.
             * @param {Object} o The object that will become selectable.
             * @param {Boolean Function()} selectCallback The function that performs the edit.
             */
            makeSelectable: function (o, selectCallback) {
                // Ensure we don't duplicate 
                if (o.select) {
                    return; // o is already selectable
                }
                // Add the function(s)
                var i;
                for (i in Selectable) {
                    if (Selectable.hasOwnProperty(i) && typeof Selectable[i] === 'function') {
                        if (Selectable[i] === this.makeSelectable) {
                            continue;
                        }
                        o[i] = Selectable[i];
                    }
                }
                // Add the properties
                o.isSelectable = ko.observable(true);
                o.selectMe = selectCallback;
                
                // Add the Publisher capability so that events can be generated.
                publisher.makePublisher(o);
            }
        };
        return Selectable;
    }
);

