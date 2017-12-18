/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Header content module
 *
 * @param {type} ko
 * @returns {HeaderViewModel}
 */
define(['knockout'],
    function (ko) {
        "use strict";
        /**
         * The view model for the Header panel.
         * @constructor
         */
        function OutputViewModel() {
            var self = this;
            self.appName = ko.observable("NASA WorldWind");
        }

        return OutputViewModel;
    }
);
