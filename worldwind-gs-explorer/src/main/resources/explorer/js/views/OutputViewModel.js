/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Output content module
 *
 * @param {type} ko
 * @param {type} $
 * @returns {OutputViewModel}
 */
define(['knockout', 
    'jquery'],
    function (ko, $) {

        /**
         * The view model for the Output panel.
         * @constructor
         */
        function OutputViewModel(globe) {
            var self = this;

            this.globe = globe;

            // Get a reference to the SelectController's selectedItem observable
            this.selectedItem = this.globe.selectController.lastSelectedItem;

            // The viewTemplate defines the content displayed in the output pane.
            this.viewTemplateName = ko.observable(null);

            // Update the view template from the selected object.
            this.selectedItem.subscribe(function (newItem) {
                // Determine if the new item has a view template
                if (newItem !== null) {
                    if (typeof newItem.viewTemplateName !== "undefined") {
                        self.viewTemplateName(newItem.viewTemplateName);
                    } else {
                        self.viewTemplateName(null);
                    }
                }
            });
        }

        return OutputViewModel;
    }
);
