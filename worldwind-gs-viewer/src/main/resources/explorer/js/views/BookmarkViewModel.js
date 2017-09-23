/*
 * The MIT License - http://www.opensource.org/licenses/mit-license
 * Copyright (c) 2017 Bruce Schubert.
 */

/*global WorldWind*/

/**
 * * The BookmarkViewModel opens dialog with a bookmark URL.
 * 
 * @param {type} ko
 * @param {type} $
 * @param {type} BookmarkDialog
 * @returns {BookmarkViewModelL#12.BookmarkViewModel}
 */
define(['knockout', 'jquery', 'views/BookmarkDialog'],
        function (ko, $, BookmarkDialog) {
            "use strict";
            /**
             * @constructor
             */
            function BookmarkViewModel(globe) {
                var self = this;

                self.globe = globe;

                // Create bookmakr dialog object and bind it to the DOM
                self.dialog = new BookmarkDialog();
                ko.applyBindings(self.dialog, document.getElementById('bookmark-dialog'));


                self.onBookmark = function () {
                    // Genrate a bookmark for the current scene
                    var bookmark = "anywhere-but-here";

                    // Open the  copy-bookmark dialog
                    self.dialog.open(bookmark);
                };

            }

            return BookmarkViewModel;
        }
);