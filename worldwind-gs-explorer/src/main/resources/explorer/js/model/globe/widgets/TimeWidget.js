/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, $, WorldWind */

/**
 * The TimeWidget module renders a composite WorldWind.Renderable representing time and sunlight data.
 *
 * @author Bruce Schubert
 */
define(['knockout',
        'moment',
        'model/Constants',
        'model/Events',
        'worldwind'],
    function (ko,
              moment,
              constants,
              events,
              ww) {
        "use strict";

        var TimeWidget = function (globe) {
            // Inherit Renderable properties
            WorldWind.Renderable.call(this);

            // Position in lower right corner
            var self = this,
                LEFT_MARGIN = 10,
                BOTTOM_MARGIN = 25,
                BG_HEIGHT = 104,
                DIAL_HEIGHT = 95,
                DIAL_RADIUS = DIAL_HEIGHT / 2,
                DIAL_MARGIN = (BG_HEIGHT - DIAL_HEIGHT) / 2,
                DIAL_ORIGIN_X = DIAL_RADIUS + LEFT_MARGIN - 2,
                DIAL_ORIGIN_Y = DIAL_RADIUS + BOTTOM_MARGIN - 2,
                MARKER_ORIGIN_X = DIAL_RADIUS + LEFT_MARGIN + 5,
                MARKER_ORIGIN_Y = DIAL_RADIUS + BOTTOM_MARGIN + 5,
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
                    WorldWind.OFFSET_PIXELS, -LEFT_MARGIN,
                    WorldWind.OFFSET_PIXELS, -BOTTOM_MARGIN),
                resetOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, -LEFT_MARGIN,
                    WorldWind.OFFSET_PIXELS, -BOTTOM_MARGIN - 100),
                dialOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, -LEFT_MARGIN - DIAL_MARGIN,
                    WorldWind.OFFSET_PIXELS, -BOTTOM_MARGIN - DIAL_MARGIN),
                faceOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, -LEFT_MARGIN - DIAL_MARGIN - 2.5,
                    WorldWind.OFFSET_PIXELS, -BOTTOM_MARGIN - DIAL_MARGIN - 2.5),
                dialOrigin = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, DIAL_ORIGIN_X,
                    WorldWind.OFFSET_PIXELS, DIAL_ORIGIN_Y),
                markerOrigin = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, MARKER_ORIGIN_X,
                    WorldWind.OFFSET_PIXELS, MARKER_ORIGIN_Y),
                timeOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, LEFT_MARGIN + 52,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN + 70),
                timeZoneOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, LEFT_MARGIN + 52,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN + 55),
                dateOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, LEFT_MARGIN + 52,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN + 30),
                riseOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, 0,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN - 25),
                setsOffset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, 72,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN - 25),
                rise2Offset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, -20,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN - 45),
                sets2Offset = new WorldWind.Offset(
                    WorldWind.OFFSET_PIXELS, -92,
                    WorldWind.OFFSET_PIXELS, BOTTOM_MARGIN - 45),
                textAttr = new WorldWind.TextAttributes(null),
                smallTextAttr = new WorldWind.TextAttributes(null);

            this.globe = globe;
            
            // Graphics

            this.background = new WorldWind.ScreenImage(lowerLeft, constants.IMAGE_PATH + "widget-circle-bg.png");
            this.background.imageOffset = backgroundOffset;

            this.daytime = new WorldWind.ScreenImage(lowerLeft, constants.IMAGE_PATH + "time-widget_day-sky.png");
            this.daytime.imageOffset = dialOffset;

            this.night = new WorldWind.ScreenImage(lowerLeft, constants.IMAGE_PATH + "time-widget_night-sky.png");
            this.night.imageOffset = dialOffset;

            this.clockface = new WorldWind.ScreenImage(lowerLeft, constants.IMAGE_PATH + "time-widget_clockface.png");
            this.clockface.imageOffset = faceOffset;

            this.sunIcon = new WorldWind.ScreenImage(dialOrigin, constants.IMAGE_PATH + "sun-icon.png");
            this.sunIcon.imageOffset = center;

            this.eclipseIcon = new WorldWind.ScreenImage(dialOrigin, constants.IMAGE_PATH + "sun-eclipsed-icon.png");
            this.eclipseIcon.imageOffset = center;

            this.sunriseMarker = new WorldWind.ScreenImage(markerOrigin, constants.IMAGE_PATH + "time-widget_sunrise-marker.png");
            this.sunriseMarker.imageOffset = center;

            this.sunsetMarker = new WorldWind.ScreenImage(markerOrigin, constants.IMAGE_PATH + "time-widget_sunset-marker.png");
            this.sunsetMarker.imageOffset = center;

            this.sunriseIcon = new WorldWind.ScreenImage(lowerLeft, constants.IMAGE_PATH + "time-widget_sunrise-icon.png");
            this.sunriseIcon.imageOffset = rise2Offset;

            this.sunsetIcon = new WorldWind.ScreenImage(lowerLeft, constants.IMAGE_PATH + "time-widget_sunset-icon.png");
            this.sunsetIcon.imageOffset = sets2Offset;

            // Text
            // Common Attributes
            textAttr.color = WorldWind.Color.WHITE;
            textAttr.font = new WorldWind.Font(18);
            textAttr.offset = center;
            smallTextAttr.color = WorldWind.Color.WHITE;
            smallTextAttr.font = new WorldWind.Font(12, "italic");
            smallTextAttr.offset = center;

            this.date = new WorldWind.ScreenText(dateOffset, "Date");
            this.date.alwaysOnTop = true;
            this.date.attributes = textAttr;

            this.timezone = new WorldWind.ScreenText(timeZoneOffset, "Time Zone");
            this.timezone.alwaysOnTop = true;
            this.timezone.attributes = smallTextAttr;

            this.time = new WorldWind.ScreenText(timeOffset, "Time");
            this.time.alwaysOnTop = true;
            this.time.attributes = textAttr;

            this.sunrise = new WorldWind.ScreenText(riseOffset, "Sunrise");
            this.sunrise.alwaysOnTop = true;
            this.sunrise.attributes = new WorldWind.TextAttributes(textAttr);
            this.sunrise.attributes.offset = lowerLeft;
            this.sunrise.attributes.color = new WorldWind.Color(249 / 255, 237 / 255, 50 / 255, 1);

            this.sunset = new WorldWind.ScreenText(setsOffset, "Sunset");
            this.sunset.alwaysOnTop = true;
            this.sunset.attributes = new WorldWind.TextAttributes(textAttr);
            this.sunset.attributes.offset = lowerLeft;
            this.sunset.attributes.color = new WorldWind.Color(241 / 255, 90 / 255, 41 / 255, 1);

            this.dateTime = null;
            this.timeZoneOffsetMs = 0;
            this.timeZoneName = "";
            this.sunlight = null;

            // Handles date/time changes in the Globe
            this.handleTimeChanged = function (newDateTime) {
                self.dateTime = newDateTime;
                self.updateDateTimeText();
                globe.redraw();
            };

            // Handles sunlight changes in the Globe
            this.handleSunlightChanged = function (newSunlight) {
                self.sunlight = newSunlight;
                self.updateSunlightText();
                globe.redraw();
            };

            // Handles time zone changes in the Globe
            this.handleTimeZoneChanged = function (newTimeZoneOffset) {
                self.timeZoneOffsetMs = newTimeZoneOffset * 3600000; // convert from hours to milliseconds
                self.timeZoneName = globe.timeZoneName();
                self.updateDateTimeText();
                self.updateSunlightText();
                globe.redraw();
            };

            this.isDstEnabled = function (date) {
                var jan = new Date(date.getFullYear(), 0, 1),
                    jul = new Date(date.getFullYear(), 6, 1),
                    stdTimeZoneOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

                return date.getTimezoneOffset() < stdTimeZoneOffset;
            };

            this.timeZoneTime = function (date) {
                // Convert current time to UTC milliseconds (must convert tz offset from minutes to milliseconds)
                // Then apply the time zone offset for the globe's current location
                var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
                return new Date(utc + this.timeZoneOffsetMs + (this.isDstEnabled(date) ? 3600000 : 0));
            };

            // Subscribe to Knockout observables in the Globe
            globe.dateTime.subscribe(this.handleTimeChanged);
            globe.sunlight.subscribe(this.handleSunlightChanged);
            globe.timeZoneOffsetHours.subscribe(this.handleTimeZoneChanged);

            // Load Initial values from the Globe observables
            this.handleTimeChanged(globe.dateTime());
            this.handleSunlightChanged(globe.sunlight());


        };
        // Inherit Renderable functions.
        TimeWidget.prototype = Object.create(WorldWind.Renderable.prototype);


        /**
         * Updates the date and time text with formatted strings.
         */
        TimeWidget.prototype.updateDateTimeText = function () {
            var localTime;
            if (this.dateTime) {
                localTime = moment(this.timeZoneTime(this.dateTime));
                this.time.text = localTime.format(this.globe.use24Time() ? "HH:mm" : "h:mm A")
                //this.date.text = localTime.format("MMM D, YY");
                this.date.text = localTime.format("YYYY-MM-DD");
                this.timezone.text = this.timeZoneName;
            }
        };


        /**
         * Updates the sunrise and sunset text with formatted strings.
         */
        TimeWidget.prototype.updateSunlightText = function () {
            var sunriseTime, sunsetTime;
            if (this.sunlight) {
                sunriseTime = moment(this.timeZoneTime(this.sunlight.sunriseTime));
                sunsetTime = moment(this.timeZoneTime(this.sunlight.sunsetTime));
                this.sunrise.text = sunriseTime.isValid() ? sunriseTime.format(this.globe.use24Time() ? "HH:mm" : "h:mmA") : "";
                this.sunset.text = sunsetTime.isValid() ? sunsetTime.format(this.globe.use24Time() ? "HH:mm" : "h:mmA") : "";
            }
        };

        /**
         * Render this TimeWidget.
         * @param {DrawContext} dc The current draw context.
         */
        TimeWidget.prototype.render = function (dc) {

            // HACK: Don't allow rotation values to go to zero
            // else z-ording gets confused with non-rotated images
            // appearing on top of rotated images.
            var localHour = WorldWind.Angle.normalizedDegrees(this.sunlight.localHourAngle),
                riseHourAngle = WorldWind.Angle.normalizedDegrees(-this.sunlight.sunriseHourAngle),
                setsHourAngle = WorldWind.Angle.normalizedDegrees(-this.sunlight.sunsetHourAngle),
                RADIUS = 50,
                solarPt = TimeWidget.rotatePoint(0, -RADIUS, 0, 0, -localHour); // rotate from 6 o'clock

            // Translate icons around the dial
            this.sunIcon.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_PIXELS, solarPt.x,
                WorldWind.OFFSET_PIXELS, solarPt.y);
            this.eclipseIcon.imageOffset = new WorldWind.Offset(
                WorldWind.OFFSET_PIXELS, solarPt.x,
                WorldWind.OFFSET_PIXELS, solarPt.y);

            // Rotate the marker arrow icons
            this.sunriseMarker.imageRotation = -riseHourAngle + 90;
            this.sunsetMarker.imageRotation = -setsHourAngle + 90;

            // Rotate the dials
            //  Rotate the these static images as a hack to force it behind the other rotated images
            this.background.imageRotation = 0.0001; // HACK
            this.clockface.imageRotation = 0.0001;
            this.daytime.imageRotation = 0.0001;

            // Graphics
            this.background.render(dc);
            this.daytime.render(dc);
            //this.night.render(dc);
            this.clockface.render(dc);
            this.sunriseMarker.render(dc);
            this.sunsetMarker.render(dc);
            if (localHour > riseHourAngle && localHour < setsHourAngle) {
                this.sunIcon.render(dc);
            } else {
                this.eclipseIcon.render(dc);
            }
            if (!isNaN(this.sunlight.sunriseTime.getTime()) && !isNaN(this.sunlight.sunsetTime.getTime())) {
                this.sunriseIcon.render(dc);
                this.sunsetIcon.render(dc);
            }

            //this.reset.render(dc);


            // Text
            this.date.render(dc);
            this.time.render(dc);
            this.timezone.render(dc);
            this.sunrise.render(dc);
            this.sunset.render(dc);
        };

        TimeWidget.rotatePoint = function (pointX, pointY, originX, originY, angle) {
            angle = angle * Math.PI / 180.0;
            return {
                x: Math.cos(angle) * (pointX - originX) - Math.sin(angle) * (pointY - originY) + originX,
                y: Math.sin(angle) * (pointX - originX) + Math.cos(angle) * (pointY - originY) + originY
            };
        };

        return TimeWidget;
    }
)
;
