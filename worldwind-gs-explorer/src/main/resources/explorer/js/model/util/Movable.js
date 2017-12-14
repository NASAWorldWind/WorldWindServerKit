/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define*/

/**
 * Movable is a mix-in module that adds "move" capabilites to an object.
 *
 * @param {Publisher} publisher Extends the object with publish event capabilites.
 * @param {WmtUtil} utils Utilties.
 * @param {Events} events Constants.
 * @returns {Movable}
 *
 * @author Bruce Schubert
 */
define(['knockout',
        'model/util/Publisher',
        'model/util/WmtUtil',
        'model/Events'],
    function (ko,
              publisher,
              utils,
              events) {
        "use strict";
        var Movable = {
            moveStarted: function () {
                if (this.isMovable) {
                    this.fire(events.EVENT_OBJECT_MOVE_STARTED, this);
                }
            },
            moveToLatLon: function (latitude, longitude) {
                if (this.isMovable) {
                    if (ko.isObservable(this.latitude)) {
                        this.latitude(latitude);
                    } else {
                        this.latitude = latitude;
                    }
                    if (ko.isObservable(this.longitude)) {
                        this.longitude(longitude);
                    } else {
                        this.longitude = longitude;
                    }
                    this.fire(events.EVENT_OBJECT_MOVED, this);
                }
            },
            moveFinished: function () {
                if (this.isMovable) {
                    this.fire(events.EVENT_OBJECT_MOVE_FINISHED, this);
                }
            },
            /**
             * Adds the the movable capabilities to the given object.
             * @param {Object} o The object that will become movable.
             */
            makeMovable: function (o) {
                // Ensure we don't duplicate 
                if (o.moveToLatLon) {
                    return; // o is already movable
                }
                // Add the functions
                var i;
                for (i in Movable) {
                    if (Movable.hasOwnProperty(i) && typeof Movable[i] === 'function') {
                        if (Movable[i] === this.makeMovable) {
                            continue;
                        }
                        o[i] = Movable[i];
                    }
                }
                // Add the properties
                o.isMovable = ko.observable(true);
                if (typeof o.latitude === 'undefined') {
                    o.latitude = ko.observable();
                }
                if (typeof o.longitude === 'undefined') {
                    o.longitude = ko.observable();
                }
                // Add the Publisher capability so that events can be generated.
                publisher.makePublisher(o);
            }
        };
        return Movable;
    }
);

