/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2017 Bruce Schubert.
 */

/*global WorldWind*/

/**
 * * The BookmarkViewModel opens dialog with a bookmark URL ready for copying to the clipboard.
 * 
 * @param {BookmarkDialog} BookmarkDialog module
 * @param {Object} bookmarkDialogHtml HTML view fragment
 * @param {Knockout} ko  
 * @param {JQuery} $ 
 * @returns {BookmarkViewModel}
 */
define([
    'viewmodels/BookmarkDialog',
    'text!views/bookmark-dialog.html',
    'knockout',
    'jquery'],
    function (BookmarkDialog, bookmarkDialogHtml, ko, $) {
        "use strict";
        /**
         * @constructor
         * @param {Globe} globe
         * @param {String} viewFragment HTML
         * @param {String} appendToId The ID of the element to which the view fragment is appended
         * @returns BookmarkViewModel
         */
        function BookmarkViewModel(globe, viewFragment, appendToId) {
            var self = this,
                domNodes = $.parseHTML(viewFragment);

            // Load the view html into the specified DOM element
            $("#" + appendToId).append(domNodes);
            this.view = domNodes[0];

            // Create a bookmark dialog object
            this.dialog = new BookmarkDialog(bookmarkDialogHtml);

            /**
             * Creates a URL on the current view and opens a dialog for viewing/copying.
             */
            this.onBookmark = function () {
                // Generate a bookmark for the current scene
                var bookmark = window.location.origin
                    + window.location.pathname + "?"
                    + globe.layerManager.getWmsLayersParam() + "&"
                    + globe.getCameraParams();
                // TODO: The bookmark should be generated from Bookmark class

                // Open the copy-bookmark dialog
                self.dialog.open(bookmark);
            };

            // Binds the view to this view model.
            ko.applyBindings(this, this.view);
        }

        return BookmarkViewModel;
    }
);