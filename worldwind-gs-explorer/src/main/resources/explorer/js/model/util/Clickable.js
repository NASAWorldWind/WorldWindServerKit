/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */
/*global define*/

/**
 * Clickable is a mix-in module that adds the "click" capabilities to an object.
 * @param {Publisher} publisher Extends the object by adding the event generator.
 * @param {Events} events Event constants.
 * @returns {Clickable}
 * 
 * @author Bruce Schubert
 */
define([
    'knockout',
    'model/util/Publisher', 
    'model/Events'],
    function (ko, publisher, events) {
        "use strict";
        
        var Clickable = {
            // 'click' function template added to Clickable instances
            click: function (params) {
                if (this.isClickable()) {
                    this.clickCallback(params);
                }
            },
            /**
             * Adds the the Clickable capabilities to the given object.
             * @param {Object} o The object that will become clickable.
             * @param {Boolean Function()} clickCallback The function that performs the click.
             */
            makeClickable: function (o, clickCallback) {
                // Ensure we don't duplicate 
                if (o.click) {
                    // TODO: log warning
                    return; // o is already selectable
                }
                // Add the function(s)
                var i;
                for (i in Clickable) {
                    if (Clickable.hasOwnProperty(i) && typeof Clickable[i] === 'function') {
                        if (Clickable[i] === this.makeClickable) {
                            continue;
                        }
                        o[i] = Clickable[i];
                    }
                }
                // Add the properties
                o.isClickable = ko.observable(true);
                o.clickCallback = clickCallback;
                
                // Add the Publisher capability so that events can be generated.
                publisher.makePublisher(o);
            }
        };
        return Clickable;
    }
);

