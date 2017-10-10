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
/*global define, $ */

/**
 * The Real module wraps and transforms a JSON Real object into an immutable representation
 * of a VisAD Real.
 * @module {util/Real}
 * @author Bruce Schubert
 */
define(['model/util/Log'],
    function (log) {
        "use strict";
        /**
         * @constructor
         * @exports Real
         */
        var Real = function (json) {
            if (json === undefined || json === null) {
                throw new Error(log.error('Real', 'constructor', 'json is undefined or null.'));
            }
            this._type = json.type;
            this._unit = json.unit;
            this._value = parseFloat(json.value);
        };
        Object.defineProperties(Real.prototype, {
            /**
             * RealType
             */
            type: {
                get: function () {
                    return this._type;
                }
            },
            /**
             * Unit of measure.
             */
            unit: {
                get: function () {
                    return this._unit;
                }
            },
            /**
             * Floating point value.
             */
            value: {
                /**
                 * @returns {Number}
                 */
                get: function () {
                    return this._value;
                }
            },
            isMissing: {
                get: function () {
                    return isNaN(this._value);
                }
            }
        });
        Real.prototype.getValue = function (unit) {
            if (unit === undefined || unit === null) {
                return this._value;
            }
            if (unit === this._unit) {
                return this._value;
            }
            throw new Error(log.error('Real', 'getValue', 'unit conversion not implemented yet.'));
        };
        Real.prototype.toString = function () {
            if (this.isMissing()) {
                return 'missing';
            }
            return this._value.toString();
        };
        Real.prototype.toValueString = function () {
            if (this.isMissing()) {
                return 'missing';
            }
            return this._value.toString() + (this._unit === undefined || this._unit === null ? '' : ' ' + this._unit);
        };
        Real.prototype.longString = function (pre) {
            if (this.isMissing()) {
                return pre + 'missing';
            }
            return pre + "Real: Value = " + this._value + "  (TypeName: " + this._type + ")";
        };

    });


