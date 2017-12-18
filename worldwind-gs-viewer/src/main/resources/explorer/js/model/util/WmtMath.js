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

/*global define, WorldWind*/

/**
 * Math utiltities module for WMT.
 * @author Bruce Schubert
 * @module {util/WmtMath}
 * @param {Object} WorldWind
 */
define(['worldwind'],
    function (ww) {
        "use strict";
        var WmtMath = {
            /**
             * Computes the angle between two Vec3 objects.
             * @param {Vec3} a
             * @param {Vec3} b
             * @returns {Number} Degrees.
             */
            angleBetween: function (a, b) {
                if (!a || !b) {
                    throw new WorldWind.ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE,
                            "Terrain", "projectOnty", "missingVector"));
                }
                var dot = a.dot(b),
                    length = a.magnitude() * b.magnitude();
                // Normalize the dot product, if necessary.
                if (!(length === 0) && (length !== 1.0)) {
                    dot /= length;
                }
                // The normalized dot product should be in the range [-1, 1]. Otherwise the result is an error from floating
                // point roundoff. So if a_dot_b is less than -1 or greater than +1, we treat it as -1 and +1 respectively.
                if (dot < -1.0) {
                    dot = -1.0;
                }
                else if (dot > 1.0) {
                    dot = 1.0;
                }
                // Angle is arc-cosine of normalized dot product ack.
                return Math.acos(dot) * WorldWind.Angle.RADIANS_TO_DEGREES;
            },
            /**
             * 
             * @param {Vec3} a
             * @param {Vec3} b
             * @param {Vec3} result
             * @returns {Vec3} result
             */
            projectOnto: function (a, b, result) {
                if (!a || !b || !result) {
                    throw new WorldWind.ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "Terrain", "projectOnty", "missingVector"));
                }
                var dot = a.dot(b),
                    length = b.magnitude();
                // Normalize the dot product, if necessary
                if (!(length === 0) && (length !== 1.0)) {
                    dot /= length;
                }
                result.copy(b).multiply(dot);
                return result;
            },
            /**
             * 
             * @param {Vec3} a
             * @param {Vec3} b
             * @param {Vec3} result
             * @returns {Vec3}
             */
            perpendicularTo: function (a, b, result) {
                if (!a || !b || !result) {
                    throw new WorldWind.ArgumentError(
                        WorldWind.Logger.logMessage(WorldWind.Logger.LEVEL_SEVERE, "Terrain", "projectOnty", "missingVector"));
                }
                var projected = new WorldWind.Vec3();
                this.projectOnto(a, b, projected);
                result.copy(a).subtract(projected);
                return result;
            }
        };
        return WmtMath;
    }
);

