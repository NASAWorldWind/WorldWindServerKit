/* 
 * Copyright (c) 2016 Bruce Schubert <bruce@emxsys.com>.
 * Released under the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Info content module
 *
 * @param {Formatter} formatter utility
 * @param {Knockout} ko library
 * @param {JQuery} $ library
 * @returns {InfoViewModel}
 */
define([
    'model/util/Formatter',
    'knockout', 
    'jquery', 
    'bootstrap'],
    function (formatter, ko, $) {
        "use strict";

        /**
         * 
         * @constructor
         * @param {Globe} globe
         * @param {String} viewFragment HTML
         * @param {String} appendToId View element parent id
         * @returns {InfoViewModel}
         */
        function InfoViewModel(globe, viewFragment, appendToId) {
            var self = this,
                domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            this.globe = globe;
            this.formatter = formatter;
            
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

            // Binds the view fragment to this view model.
            ko.applyBindings(this, this.view);

            // HACK! Bootstrap nav-tabs workaround.
            // The previous tab's hide.bs.tab event is not being fired. Thus it  
            // remains in the 'active' state after another tab is selected.
            // This hack removes the 'active' class from the previous tab.
            // Note, the event.target is the <a/> element, not the <li/> element containing the <a/>
            $('.nav-tabs>li').on('shown.bs.tab', function (e) {
                // Remove the active class from all the <li> elements except the target's parent
                $(".nav-tabs>li.active").not($(e.target).parent()).removeClass("active");
            });

        }

        return InfoViewModel;
    }
);
