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
 *     - Neither the name of Bruce Schubert,  nor the names of its 
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
 * Provides utilities for working with cookies.
 * 
 * @module {Cookie}
 */
define([],
    function () {
        "use strict";
        var Cookie = {
            /**
             * Saves the name/value pair in a cookie.
             * @param {String} cookieName The value to be formatted.
             * @param {String} cookieValue The number decimal places.
             * @param {Number} expirationDays The number days before the cookie expires.
             */
            save: function (cookieName, cookieValue, expirationDays) {
                var d = new Date(),
                    expires;
                d.setTime(d.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
                expires = "expires=" + d.toUTCString();
                document.cookie = cookieName + "=" + cookieValue + "; " + expires;
            },
            /**
             * Gets the value for the given cookie name.
             * @param {String) cookieName The cookie name to search for.
             * @returns {String} The cookie value or an empty string if not found.
             */
            read: function (cookieName) {
                var name,
                    cookies,
                    cookieKeyValue,
                    i;
                // Establish the text to search for
                name = cookieName + "=";
                // Split the cookie property into an array 
                cookies = document.cookie.split(';');
                for (i = 0; i < cookies.length; i++) {
                    cookieKeyValue = cookies[i];
                    // Strip/trim spaces
                    while (cookieKeyValue.charAt(0) === ' ') {
                        cookieKeyValue = cookieKeyValue.substring(1);
                    }
                    // Return the value associated with the name
                    if (cookieKeyValue.indexOf(name) === 0) {
                        return cookieKeyValue.substring(name.length, cookieKeyValue.length);
                    }
                }
                return "";
            }

        };

        return Cookie;
    }
);
