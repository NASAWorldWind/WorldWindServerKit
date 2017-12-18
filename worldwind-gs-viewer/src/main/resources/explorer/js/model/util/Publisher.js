/* 
 * Copyright (c) 2015, Bruce Schubert <bruce@emxsys.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     - Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     - Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     - Neither the name of Bruce Schubert, Emxsys nor the names of its 
 *       contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*global define*/

/**
 * The Publisher module provides the publish/subscribe pattern via a mix-in style.
 * This implementation is from the "JavaScript Patterns" book by Stoyan Stefanov.
 * 
 * @param {Log} log
 * @returns {Publisher}
 */
define(['model/util/Log'],
    function (log) {
        "use strict";
        var Publisher = {
            subscribers: {
                any: []
            },
            /**
             * Creates a subscription on the given event type.
             * @param {String} type The event type.
             * @param {Function} fn The handler for the event.
             * @param {Object} context The context for the handler. Optional.
             */
            on: function (type, fn, context) {
                if ((typeof type) === 'undefined') {
                    var caller_line = (new Error()).stack.split("\n")[4];
                    log.error('Publisher', 'on', 'type arg is "undefined", is this really the intent? ' + caller_line);
//                    throw new (log.error('Publisher', 'on', 'type arg is "undefined", is this really the intent?'));
                }
                type = type || 'any';
                fn = (typeof fn === "function") ? fn : context[fn];

                if ((typeof this.subscribers[type]) === 'undefined') {
                    this.subscribers[type] = [];
                }
                this.subscribers[type].push({
                    fn: fn,
                    context: context || this});
            },
            /**
             * Cancels the subscription to the given event.  This function is the opposite of on(...) and it's 
             * arguments must match those passed to on(...)
             * @param {String} type The event type.
             * @param {Function} fn The handler for the event.
             * @param {Object} context The context for the handler. Optional.
             */
            cancelSubscription: function (type, fn, context) {
                this.visitSubscribers('unsubscribe', type, fn, context);
            },
            /**
             * Fires the event by calling each of the subscribers event handler.
             * @param {String} type The event type.
             * @param {Object} publication The event payload, often "this".
             */
            fire: function (type, publication) {
                if ((typeof type) === 'undefined') {
                    throw new TypeError(log.error('Publisher', 'fire', 'Event type is "undefined".'));
                }
                this.visitSubscribers('publish', type, publication);
            },
            /**
             * Internal function the 
             * @param {type} action
             * @param {type} type
             * @param {type} arg
             * @param {type} context
             * @returns {undefined}
             */
            visitSubscribers: function (action, type, arg, context) {
                var pubtype = type || 'any',
                    subscribers = this.subscribers[pubtype],
                    i,
                    max = subscribers ? subscribers.length : 0;

                for (i = 0; i < max; i += 1) {
                    if (action === 'publish') {
                        subscribers[i].fn.call(subscribers[i].context, arg);
                    } else {
                        if (subscribers[i].fn === arg && subscribers[i].context === context) {
                            subscribers.splice(i, 1);
                        }
                    }
                }
            },
            /**
             * Makes the given object a Publisher by adding the this object's functions and properties to it.
             * @param {Object} o The object that becomes a publisher.
             */
            makePublisher: function (o) {
                if (o.subscribers) {
                    return; // o is already a Publisher
                }
                var i;
                for (i in Publisher) {
                    if (Publisher.hasOwnProperty(i) && typeof Publisher[i] === 'function') {
                        o[i] = Publisher[i];
                    }
                }
                o.subscribers = {any: []};
            }
        };
        return Publisher;
    }
);

