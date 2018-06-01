/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2017 Bruce Schubert.
 */

/*global WorldWind*/

/**
 * BookmarkDialog presents a dialog that displays a given url and 
 * provides a button that copies it to the clipboard.
 *  
 * @param {Knockout} ko
 * @param {JQuery} $
 * @returns {BookmarkDialog}
 */
define(['knockout', 'jquery', 'jqueryui', 'jquery-growl'],
    function (ko, $) {
        "use strict";
        /**
         * @constructor
         * @param {Object} viewFragment
         * @returns {BookmarkDialog}
         */
        function BookmarkDialog(viewFragment) {
            var self = this;
            this.bookmark = ko.observable("");

            // Load the view fragment into the DOM's body.
            // Wrap the view in a hidden div for use in a JQuery UI dialog.
            var $view = $('<div style="display: none"></div>')
                .append(viewFragment)
                .appendTo($('body'));
            this.view = $view.children().first().get(0);

            /**
             * Opens a dialog used to copy a URL to the clipboard
             * @param {String} url URL to display/edit
             */
            this.open = function (url) {
                self.bookmark(url);
                // Open the  copy-bookmark dialog
                var $view = $(self.view);
                $view.dialog({
                    autoOpen: false,
                    title: "Bookmark"
                });
                $view.dialog("open");
            };
            /**
             * 
             * Copies the text from the dialogs bookmark-url input element 
             * to the clipboard
             */
            this.copyUrlToClipboard = function () {
                var $bookmarkUrl = $("#bookmark-url");

                // Select the URL text so it can be copied
                $bookmarkUrl.select();
                try {
                    // Copy the current selection to the clipboard
                    var successful = document.execCommand('copy');
                    if (successful) {
                        $.growl({
                            title: "Bookmark Copied",
                            message: "The link was copied to the clipboard"});
                        $(self.view).dialog("close");
                    } else {
                        $.growl.warning({
                            title: "Bookmark Not Copied!",
                            message: "The link could not be copied"});
                    }
                } catch (err) {
                    console.error('Unable to copy bookmark link.', err.message);
                    $.growl.error({
                        title: "Error",
                        message: "Unable to copy link"});
                }

            };

            // Bind the view to this view model
            ko.applyBindings(this, this.view);

        }

        return BookmarkDialog;
    }
);