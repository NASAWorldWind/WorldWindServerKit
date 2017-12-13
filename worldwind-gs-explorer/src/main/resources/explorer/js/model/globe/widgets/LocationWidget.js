/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

/**
 * The LocationWidget module renders a composite WorldWind.Renderable representing 
 * location, orientation, terrain and solar data.
 * 
 * @param {Formatter} formatter
 * @param {Viewpoint} Viewpoint
 * @param {Constants} constants
 * @param {WorldWind} ww
 * @returns {LocationWidget}
 * @author Bruce Schubert
 */
define([
    'model/Constants',
    'model/Events',
    'model/util/Formatter',
    'worldwind'],
    function (
        constants,
        events,
        formatter,
        ww) {
        "use strict";

        var LocationWidget = function (globe) {
            // Inherit Renderable properties
            WorldWind.Renderable.call(this);

            // Position in lower right corner
            var self = this,
                RIGHT_MARGIN = 10,
                BOTTOM_MARGIN = 25,
                BG_HEIGHT = 104,
                DIAL_HEIGHT = 95,
                DIAL_RADIUS = DIAL_HEIGHT / 2,
                DIAL_MARGIN = (BG_HEIGHT - DIAL_HEIGHT) / 2,
                DIAL_ORIGIN_X = DIAL_RADIUS + RIGHT_MARGIN + 10,
                DIAL_ORIGIN_Y = DIAL_RADIUS + BOTTOM_MARGIN - 2,
                center = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0.5,
                    WorldWind.OFFSET_FRACTION, 0.5),
                lowerLeft = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 0,
                    WorldWind.OFFSET_FRACTION, 0),
                lowerRight = new WorldWind.Offset(
                    WorldWind.OFFSET_FRACTION, 1,
                    WorldWind.OFFSET_FRACTION, 0),
                backgroundOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, -RIGHT_MARGIN,
                    WorldWind.OFFSET_INSET_PIXELS, BOTTOM_MARGIN + BG_HEIGHT),
                resetOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, -10,
                    WorldWind.OFFSET_INSET_PIXELS, BOTTOM_MARGIN + BG_HEIGHT + 30),
                dialOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, -RIGHT_MARGIN - DIAL_MARGIN,
                    WorldWind.OFFSET_INSET_PIXELS, BOTTOM_MARGIN + DIAL_MARGIN + DIAL_HEIGHT),
                dialOrigin = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, DIAL_ORIGIN_X,
                    WorldWind.OFFSET_PIXELS, DIAL_ORIGIN_Y),
//                dialOrigin = new WorldWind.Offset(
//                    WorldWind.OFFSET_INSET_PIXELS, -RIGHT_MARGIN - DIAL_MARGIN - DIAL_RADIUS,
//                    WorldWind.OFFSET_INSET_PIXELS, BOTTOM_MARGIN + DIAL_MARGIN + DIAL_RADIUS),
                latOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, 65,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN + 65),
                lonOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, 65,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN + 35),
                elvOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, RIGHT_MARGIN,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN - 25),
                slpOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_INSET_PIXELS, RIGHT_MARGIN + 110,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN - 25),
                textAttr = new WorldWind.TextAttributes(null);
            
            // Graphics
            this.reset = new WorldWind.ScreenImage(lowerRight, constants.IMAGE_PATH + "reset-button.png");
            this.reset.imageOffset = resetOffset;
                        
            this.background = new WorldWind.ScreenImage(lowerRight, constants.IMAGE_PATH + "widget-circle-bg.png");
            this.background.imageOffset = backgroundOffset;

            this.inclinometer = new WorldWind.ScreenImage(lowerRight, constants.IMAGE_PATH + "location-widget_inclinometer.png");
            this.inclinometer.imageOffset = dialOffset;

            this.compass = new WorldWind.ScreenImage(lowerRight, constants.IMAGE_PATH + "location-widget_compass.png");
            this.compass.imageOffset = dialOffset;
            
            this.aspectIcon = new WorldWind.ScreenImage(dialOrigin, constants.IMAGE_PATH + "location-widget_aspect-icon.png");
            this.aspectIcon.imageOffset = center;

            this.sunIcon = new WorldWind.ScreenImage(dialOrigin, constants.IMAGE_PATH + "sun-icon.png");
            this.sunIcon.imageOffset = center;

            this.eclipseIcon = new WorldWind.ScreenImage(dialOrigin, constants.IMAGE_PATH + "sun-eclipsed-icon.png");
            this.eclipseIcon.imageOffset = center;


            // Text
            // Common Attributes
            textAttr.color = WorldWind.Color.WHITE;
            textAttr.font = new WorldWind.Font(18);
            textAttr.offset = center;

            this.latitude = new WorldWind.ScreenText(latOffset, "Latitude");
            this.latitude.alwaysOnTop = true;
            this.latitude.attributes = textAttr;

            this.longitude = new WorldWind.ScreenText(lonOffset, "Longitude");
            this.longitude.alwaysOnTop = true;
            this.longitude.attributes = textAttr;

            this.elevation = new WorldWind.ScreenText(elvOffset, "Elevation");
            this.elevation.alwaysOnTop = true;
            this.elevation.attributes = new WorldWind.TextAttributes(textAttr);
            this.elevation.attributes.offset = lowerRight;

            this.slope = new WorldWind.ScreenText(slpOffset, "Slope");
            this.slope.alwaysOnTop = true;
            this.slope.attributes = new WorldWind.TextAttributes(textAttr);
            this.slope.attributes.offset = lowerLeft;

            this.viewpoint = null;
            this.sunlight = null;


            /** Handles viewpoint changes. */
            this.handleViewpointChanged = function (newViewpoint) {
                self.viewpoint = newViewpoint;
                self.updateLocationText();
                globe.redraw();
            };

            /** Handles sunlight changes. */
            this.handleSunlightChanged = function (newLunlight) {
                self.sunlight = newLunlight;
                globe.redraw();
            };

            // Subscribe to Knockout observables in the Globe
            globe.viewpoint.subscribe(this.handleViewpointChanged);
            globe.sunlight.subscribe(this.handleSunlightChanged);

            // Load initial values
            this.handleViewpointChanged(globe.viewpoint());
            this.handleSunlightChanged(globe.sunlight());
            
        };
        // Inherit Renderable functions.
        LocationWidget.prototype = Object.create(WorldWind.Renderable.prototype);

        // Updates the text components
        LocationWidget.prototype.updateLocationText = function () {
            this.latitude.text = formatter.formatDecimalDegreesLat(this.viewpoint.target.latitude, 3);
            this.longitude.text = formatter.formatDecimalDegreesLon(this.viewpoint.target.longitude, 3);
            this.elevation.text = formatter.formatAltitude(this.viewpoint.target.elevation, 'm');
            this.slope.text = formatter.formatPercentSlope(this.viewpoint.target.slope, 0);
        };

        /**
         * Render this LocationWidget. 
         * @param {DrawContext} dc The current draw context.
         */
        LocationWidget.prototype.render = function (dc) {

            // HACK: Don't allow rotation values to go to zero 
            // else z-ording gets confused with non-rotated images
            // appearing on top of rotated images.
            var RADIUS = 50,
                localHour = WorldWind.Angle.normalizedDegrees(this.sunlight.localHourAngle),
                riseHourAngle = -this.sunlight.sunriseHourAngle,
                setsHourAngle = -this.sunlight.sunsetHourAngle,
                heading = dc.navigatorState.heading || 0.001,
                slope = this.viewpoint.target.slope || 0.001,
                aspect = this.viewpoint.target.aspect || 0.001,
                aspectPt = LocationWidget.rotatePoint(0, -RADIUS, 0, 0, heading - aspect), // rotate from 6 o'clock
                azimuth = this.sunlight.azimuthAngle,
                solarPt = LocationWidget.rotatePoint(0, -RADIUS, 0, 0, heading - azimuth); // rotate from 6 o'clock

            // Translate icons around the dial
            this.aspectIcon.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_PIXELS, aspectPt.x,
                WorldWind.OFFSET_PIXELS, aspectPt.y);
            this.sunIcon.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_PIXELS, solarPt.x,
                WorldWind.OFFSET_PIXELS, solarPt.y);
            this.eclipseIcon.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_PIXELS, solarPt.x,
                WorldWind.OFFSET_PIXELS, solarPt.y);
            // Rotate the aspect "diamond" icon
            // No need to rotate the solar icon - it's a circle
            this.aspectIcon.imageRotation = 180 + heading - aspect;

            // Rotate the dials
            //  Rotate the background as a hack to force it behind the other layers
            this.background.imageRotation = 0.001; // HACK
            this.compass.imageRotation = heading;
            this.inclinometer.imageRotation = slope;

            this.background.render(dc);
            this.inclinometer.render(dc);
            this.compass.render(dc);
            this.aspectIcon.render(dc);
            if (localHour > riseHourAngle && localHour < setsHourAngle) {
                this.sunIcon.render(dc);
            } else {
                this.eclipseIcon.render(dc);
            }
            this.latitude.render(dc);
            this.longitude.render(dc);
            this.elevation.render(dc);
            this.slope.render(dc);
            this.reset.render(dc);
        };

        LocationWidget.rotatePoint = function (pointX, pointY, originX, originY, angle) {
            angle = angle * Math.PI / 180.0;
            return {
                x: Math.cos(angle) * (pointX - originX) - Math.sin(angle) * (pointY - originY) + originX,
                y: Math.sin(angle) * (pointX - originX) + Math.cos(angle) * (pointY - originY) + originY};
        };

        return LocationWidget;
    }
);
