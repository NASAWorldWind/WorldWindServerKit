jQuery Growl
============

jQuery Growl is a Growl like notification plugin for jQuery

*THIS DOCUMENT IS OUT OF DATE*

## DEMO

Check out a live demo here: 

http://projects.zoulcreations.com/jquery/growl

## USAGE
```javascript
$.growl('notify', { title: strTitle, message: strMessage, image: strImage, priority: strPriority });
// image is optional assuming that growl.jpg is available
// priority is optional, and can be used in templates to change notice appearances through CSS
//  <div class="%priority%"></div>
```

## THEMES

You can override the default look and feel by updating these objects:
```javascript
$.growl({
	displayTimeout: 4000,
	noticeTemplate: ''
		+ '<div>'
		+ '<div style="float: right; background-image: url(my.growlTheme/normalTop.png); position: relative; width: 259px; height: 16px; margin: 0pt;"></div>'
		+ '<div style="float: right; background-image: url(my.growlTheme/normalBackground.png); position: relative; display: block; color: #ffffff; font-family: Arial; font-size: 12px; line-height: 14px; width: 259px; margin: 0pt;">' 
		+ '  <img style="margin: 14px; margin-top: 0px; float: left;" src="%image%" />'
		+ '  <h3 style="margin: 0pt; margin-left: 77px; padding-bottom: 10px; font-size: 13px;">%title%</h3>'
		+ '  <p style="margin: 0pt 14px; margin-left: 77px; font-size: 12px;">%message%</p>'
		+ '</div>'
		+ '<div style="float: right; background-image: url(my.growlTheme/normalBottom.png); position: relative; width: 259px; height: 16px; margin-bottom: 10px;"></div>'
		+ '</div>',
	noticeCss = {
		position: 'relative'
	}
});
```
To change the 'dock' look, and position: 
```javascript
$.growl({
	dockTemplate: '<div></div>',
	dockCss: {
		position: 'absolute',
		top: '10px',
		right: '10px',
		width: '300px'
	},
});
```  
The dockCss will allow you to 'dock' the notifications to a specific area
on the page, such as TopRight (the default) or TopLeft, perhaps even in a
smaller area with "overflow: scroll" enabled?

## AVAILABLE SETTINGS

	var settings = {
		dockTemplate: '<div></div>',
		//reserved, use dockCss to override*
		dockDefaultCss: {
			position: 'fixed',
			top: '10px',
			right: '10px',
			width: '300px',
			zIndex: 50000
		},
		dockCss: {},
		noticeTemplate: 
			'<div class="notice">' +
			' <h3 style="margin-top: 15px"><a rel="close">%title%</a></h3>' +
			' <p>%message%</p>' +
			'</div>',
		//reserved, use noticeCss to override	
		noticeDefaultCss: {
			backgroundColor: 'rgba(100, 100, 100, 0.75)',
			color: '#ffffff'
		},
		noticeCss: {},
		noticeDisplay: function(notice) {
			notice.css({'opacity':'0'}).fadeIn(settings.noticeFadeTimeout);
		},
		noticeRemove: function(notice, callback) {
			notice.animate({opacity: '0', height: '0px'}, {duration:settings.noticeFadeTimeout, complete: callback});
		},
		noticeFadeTimeout: 'slow',
		displayTimeout: 3500,
		defaultImage: 'growl.jpg',
		defaultStylesheet: null,
		noticeElement: function(el) {
			settings.noticeTemplate = $(el);
		},
	}


## CHANGELOG

### 2013-04-21
* Updated code to 1.1.0
* Example now uses jQuery 1.9.1
* NOT BACKWARDS COMPATIBLE
	* $.growl(settingsObject); // calls 'init'
	* $.growl('notify', notifyObject); 
	
			notifyObject = { title:strTitle, message: strMessage, image: strImageUrl, priority: strPriority };
			// notifyObject can override settingsObject and defaults as well
			notifyObject = { 
				title:strTitle, 
				message: strMessage, 
				image: strImageUrl, 
				priority: strPriority,
				noticeCss: {
					backgroundColor: '#f00',
				}
			};

### 2008-09-04
* Added the 'noticeDisplay' function so you can override the display functionality
* Added the 'noticeRemove' function so you can override the remove functionality
* Added the 'displayTimeout > 0' functionality, so notices can be 'permanent' if so desired.

### 2008-04-20
* Added a 'slide up' style effect, by shrinking the notification as it fades out.

### 2008-04-19
* Released as 1.0.0-preview, and 1.0.0-b2
