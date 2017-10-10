/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2017 Bruce Schubert.
 */

/*global WorldWind*/

/**
 * * The BookmarkViewModel opens dialog with a bookmark URL ready for copying to the clipboard.
 * 
 * @param {object} ko  
 * @param {object} $ JQuery
 * @param {class} BookmarkDialog 
 * @returns {BookmarkViewModel}
 */
define(['knockout', 'jquery', 'views/BookmarkDialog'],
        function (ko, $, BookmarkDialog) {
            "use strict";
            /**
             * @constructor
             * @param {Globe} globe
             * @returns BookmarkViewModel
             */
            function BookmarkViewModel(globe) {
                var self = this;

                self.globe = globe;

                // Create bookmakr dialog object and bind it to the DOM
                self.dialog = new BookmarkDialog();
                ko.applyBindings(self.dialog, document.getElementById('bookmark-dialog'));


                self.onBookmark = function () {
                    
                    // Generate a bookmark for the current scene
                    var bookmark = window.origin + "/geoserver/explorer/index.html?" 
                            + globe.layerManager.getWmsLayersParam() + "&"
                            + globe.getCameraParams();
                    // TODO: The bookmark should be generated from Bookmark class

                    // Open the copy-bookmark dialog
                    self.dialog.open(bookmark);
                };

            }

            return BookmarkViewModel;
        }
);