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
 * @module Log.
 * @returns {Log}
 */
define([],
    function () {
        "use strict";
        var Log = {
            /**
             * Logs an error message.
             * @param {String} className - The name of the class/object generating the log entry.
             * @param {String} functionName - The name of the function generating the log entry.
             * @param {String} message - The message or a name of a predefined message (see messageTable).
             * @returns {String} The message that was logged.
             */
            error: function (className, functionName, message) {
                var msg = this.makeMessage(className, functionName, message);
                console.error(msg);
                return msg;
            },
            /**
             * Logs a warning message.
             * @param {String} className - The name of the class/object generating the log entry.
             * @param {String} functionName - The name of the function generating the log entry.
             * @param {String} message - The message or a name of a predefined message (see messageTable).
             * @returns {String} The message that was logged.
             */
            warning: function (className, functionName, message) {
                var msg = this.makeMessage(className, functionName, message);
                console.warn(msg);
                return msg;
            },
            /**
             * Logs an information message.
             * @param {String} className - The name of the class/object generating the log entry.
             * @param {String} functionName - The name of the function generating the log entry.
             * @param {String} message - The message or a name of a predefined message (see messageTable).
             * @returns {String} The message that was logged.
             */
            info: function (className, functionName, message) {
                var msg = this.makeMessage(className, functionName, message);
                console.info(msg);
                return msg;
            },
            /**
             * @returns {String}
             */
            makeMessage: function (className, functionName, message) {
                var msg = this.messageTable[message] || message;

                return className + (functionName ? "." : "") + functionName + ": " + msg;
            },
            /**
             * Predefined message strings.
             */
            messageTable: {// KEEP THIS TABLE IN ALPHABETICAL ORDER
                constructor: "Constructing the object.",
                missingTerrain: "The specified terrain is null or undefined."
            }
        };
        return Log;
    }

);

