/*
 * NOAA Solar Calculator
 * ---------------------
 * Source: http://www.esrl.noaa.gov/gmd/grad/solcalc/
 * Date: 06/04/2016
 *
 * U.S. Department of Commerce | National Oceanic and Atmospheric Administration
 * Earth System Research Laboratory | Global Monitoring Division
 *
 * The information contained herein is provided as a public service, with the understanding that the
 * NOAA/ESRL Global Monitoring Division makes no warranties, either expressed or implied, concerning 
 * the accuracy, completeness, reliability, or suitability of the information.
 *
 * The information on government servers are in the public domain, unless specifically annotated 
 * otherwise, and may be used freely by the public so long as you do not 1) claim it is your own 
 * (e.g. by claiming copyright for NOAA information – see next paragraph), 2) use it in a manner 
 * that implies an endorsement or affiliation with NOAA, or 3) modify it in content and then present
 * it as official government material. You also cannot present information of your own in a way that 
 * makes it appear to be official government information.
 *
 * Please provide acknowledgement of the NOAA ESRL Global Monitoring Division in use of any of our
 * web products as: Data/Image provided by NOAA ESRL Global Monitoring Division, Boulder, Colorado, USA 
 * (http://esrl.noaa.gov/gmd/)
 */

/**
 * The SolarCalculator module is an independent derivative work of the online NOAA Solar Calculator
 * located at http://www.esrl.noaa.gov/gmd/grad/solcalc/
 *
 * The original work was modified to:
 * 1) accept input arguments rather than read document elements,
 * 2) output to an object instead of writing to document elements,
 * 3) provide method level documentation.
 *
 * @author Updated by Bruce Schubert
 *
 * @returns {SolarCalculator}
 */
define([],
    function () {
        "use strict";
        var SolarCalculator = function () {
            // TODO: define intermediate and final output properties

            /**
             *
             * @param {Number} jd
             * @returns {Number}
             */
            var calcTimeJulianCent = function (jd) {
                var T = (jd - 2451545.0) / 36525.0;
                return T;
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcJDFromJulianCent = function (t) {
                var JD = t * 36525.0 + 2451545.0;
                return JD;
            };
            /**
             *
             * @param {Number} yr
             * @returns {Boolean}
             */
            var isLeapYear = function (yr) {
                return ((yr % 4 == 0 && yr % 100 != 0) || yr % 400 == 0);
            };
            /**
             *
             * @param {Number} jd
             * @returns {Number}
             */
            var calcDoyFromJD = function (jd) {
                var z = Math.floor(jd + 0.5);
                var f = (jd + 0.5) - z;
                if (z < 2299161) {
                    var A = z;
                } else {
                    var alpha = Math.floor((z - 1867216.25) / 36524.25);
                    var A = z + 1 + alpha - Math.floor(alpha / 4);
                }
                var B = A + 1524;
                var C = Math.floor((B - 122.1) / 365.25);
                var D = Math.floor(365.25 * C);
                var E = Math.floor((B - D) / 30.6001);
                var day = B - D - Math.floor(30.6001 * E) + f;
                var month = (E < 14) ? E - 1 : E - 13;
                var year = (month > 2) ? C - 4716 : C - 4715;

                var k = (isLeapYear(year) ? 1 : 2);
                var doy = Math.floor((275 * month) / 9) - k * Math.floor((month + 9) / 12) + day - 30;
                return doy;
            };
            /**
             *
             * @param {Number} angleRad
             * @returns {Number}
             */
            var radToDeg = function (angleRad) {
                return (180.0 * angleRad / Math.PI);
            };
            /**
             *
             * @param {Number} angleDeg
             * @returns {Number}
             */
            var degToRad = function (angleDeg) {
                return (Math.PI * angleDeg / 180.0);
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcGeomMeanLongSun = function (t) {
                var L0 = 280.46646 + t * (36000.76983 + t * (0.0003032));
                while (L0 > 360.0) {
                    L0 -= 360.0;
                }
                while (L0 < 0.0) {
                    L0 += 360.0;
                }
                return L0;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcGeomMeanAnomalySun = function (t) {
                var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
                return M;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcEccentricityEarthOrbit = function (t) {
                var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
                return e;		// unitless
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcSunEqOfCenter = function (t) {
                var m = calcGeomMeanAnomalySun(t);
                var mrad = degToRad(m);
                var sinm = Math.sin(mrad);
                var sin2m = Math.sin(mrad + mrad);
                var sin3m = Math.sin(mrad + mrad + mrad);
                var C = sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
                return C;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcSunTrueLong = function (t) {
                var l0 = calcGeomMeanLongSun(t);
                var c = calcSunEqOfCenter(t);
                var O = l0 + c;
                return O;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcSunTrueAnomaly = function (t) {
                var m = calcGeomMeanAnomalySun(t);
                var c = calcSunEqOfCenter(t);
                var v = m + c;
                return v;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcSunRadVector = function (t) {
                var v = calcSunTrueAnomaly(t);
                var e = calcEccentricityEarthOrbit(t);
                var R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(degToRad(v)));
                return R;		// in AUs
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcSunApparentLong = function (t) {
                var o = calcSunTrueLong(t);
                var omega = 125.04 - 1934.136 * t;
                var lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
                return lambda;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number}
             */
            var calcMeanObliquityOfEcliptic = function (t) {
                var seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
                var e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
                return e0;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number} degrees
             */
            var calcObliquityCorrection = function (t) {
                var e0 = calcMeanObliquityOfEcliptic(t);
                var omega = 125.04 - 1934.136 * t;
                var e = e0 + 0.00256 * Math.cos(degToRad(omega));
                return e;		// in degrees
            };
            /**
             *
             * @param {Number} t
             * @returns {Number} degrees
             */
            var calcSunRtAscension = function (t) {
                var e = calcObliquityCorrection(t);
                var lambda = calcSunApparentLong(t);
                var tananum = (Math.cos(degToRad(e)) * Math.sin(degToRad(lambda)));
                var tanadenom = (Math.cos(degToRad(lambda)));
                var alpha = radToDeg(Math.atan2(tananum, tanadenom));
                return alpha;		// in degrees
            };
            /**
             *
             * @param {Number} t Julian date century
             * @returns {Number} degrees
             */
            var calcSunDeclination = function (t) {
                var e = calcObliquityCorrection(t);
                var lambda = calcSunApparentLong(t);

                var sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
                var theta = radToDeg(Math.asin(sint));
                return theta;		// in degrees
            };
            /**
             * Computes the equation of time.
             * @param {Number} t
             * @returns {Number} minutes
             */
            var calcEquationOfTime = function (t) {
                var epsilon = calcObliquityCorrection(t);
                var l0 = calcGeomMeanLongSun(t);
                var e = calcEccentricityEarthOrbit(t);
                var m = calcGeomMeanAnomalySun(t);

                var y = Math.tan(degToRad(epsilon) / 2.0);
                y *= y;

                var sin2l0 = Math.sin(2.0 * degToRad(l0));
                var sinm = Math.sin(degToRad(m));
                var cos2l0 = Math.cos(2.0 * degToRad(l0));
                var sin4l0 = Math.sin(4.0 * degToRad(l0));
                var sin2m = Math.sin(2.0 * degToRad(m));

                var Etime = y * sin2l0 - 2.0 * e * sinm + 4.0 * e * y * sinm * cos2l0 - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
                return radToDeg(Etime) * 4.0;	// in minutes of time
            };
            /**
             * Returns the hour angle [radians] at sunrise; negate teh value for sunset.
             * @param {Number} lat Observer latitude
             * @param {Number} solarDec Declination
             * @returns {Number} radians
             */
            var calcHourAngleSunrise = function (lat, solarDec) {
                var latRad = degToRad(lat);
                var sdRad = degToRad(solarDec);
                var HAarg = (Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
                var HA = Math.acos(HAarg);
                return HA;		// in radians (for sunset, use -HA)
            };
            /**
             *
             * @param {Object} inputVal
             * @returns {Boolean}
             */
            var isNumber = function (inputVal) {
                var oneDecimal = false;
                var inputStr = "" + inputVal;
                for (var i = 0; i < inputStr.length; i++) {
                    var oneChar = inputStr.charAt(i);
                    if (i == 0 && (oneChar == "-" || oneChar == "+")) {
                        continue;
                    }
                    if (oneChar == "." && !oneDecimal) {
                        oneDecimal = true;
                        continue;
                    }
                    if (oneChar < "0" || oneChar > "9") {
                        return false;
                    }
                }
                return true;
            }
            /**
             * Gets the Julian date for the given calendar date at 00:00 UTC.
             * @param {Number} year
             * @param {Number} month
             * @param {Number} day
             * @returns {Number} Fractional julian date at 00:00 UTC (e.g. the Julian date for
             * 2016 June 7 00:00:00.0 UT is JD 2457546.5)
             */
            this.getJD = function (year, month, day) {
                if (month <= 2) {
                    year -= 1;
                    month += 12;
                }
                var A = Math.floor(year / 100);
                var B = 2 - A + Math.floor(A / 4);
                var JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
                return JD;
            };
            /**
             * Converts the given hours, minutes, seconds to minutes.
             * @param {Number} hour
             * @param {Number} minute
             * @param {Number} second
             * @returns {Number} Fractional minutes
             */
            var getTimeLocal = function (hour, minute, second) {
                var mins = hour * 60 + minute + second / 60.0;
                return mins;
            };
            /**
             *
             * @param {type} output
             * @param {Number} T
             * @param {Number} localtime
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Number} zone
             * @returns {Number}
             */
            var calcAzEl = function (output, T, localtime, latitude, longitude, zone) {
                var eqTime = calcEquationOfTime(T);
                var theta = calcSunDeclination(T);
//                    if (output) {
//                        document.getElementById("eqtbox").value = Math.floor(eqTime * 100 + 0.5) / 100.0
//                        document.getElementById("sdbox").value = Math.floor(theta * 100 + 0.5) / 100.0
//                    }
                var solarTimeFix = eqTime + 4.0 * longitude - 60.0 * zone;
                var earthRadVec = calcSunRadVector(T);
                var trueSolarTime = localtime + solarTimeFix;
                while (trueSolarTime > 1440) {
                    trueSolarTime -= 1440;
                }
                var hourAngle = trueSolarTime / 4.0 - 180.0;
                if (hourAngle < -180) {
                    hourAngle += 360.0;
                }
                var haRad = degToRad(hourAngle);
                var csz = Math.sin(degToRad(latitude)) * Math.sin(degToRad(theta)) + Math.cos(degToRad(latitude)) * Math.cos(degToRad(theta)) * Math.cos(haRad);
                if (csz > 1.0) {
                    csz = 1.0
                } else if (csz < -1.0) {
                    csz = -1.0
                }
                var zenith = radToDeg(Math.acos(csz));
                var azDenom = (Math.cos(degToRad(latitude)) * Math.sin(degToRad(zenith)));
                if (Math.abs(azDenom) > 0.001) {
                    var azRad = ((Math.sin(degToRad(latitude)) * Math.cos(degToRad(zenith))) - Math.sin(degToRad(theta))) / azDenom;
                    if (Math.abs(azRad) > 1.0) {
                        if (azRad < 0) {
                            azRad = -1.0;
                        } else {
                            azRad = 1.0;
                        }
                    }
                    var azimuth = 180.0 - radToDeg(Math.acos(azRad));
                    if (hourAngle > 0.0) {
                        azimuth = -azimuth;
                    }
                } else {
                    if (latitude > 0.0) {
                        azimuth = 180.0;
                    } else {
                        azimuth = 0.0;
                    }
                }
                if (azimuth < 0.0) {
                    azimuth += 360.0;
                }
                var exoatmElevation = 90.0 - zenith;

                // Atmospheric Refraction correction

                var refractionCorrection = 0.0;
                if (exoatmElevation > 85.0) {
                    refractionCorrection = 0.0;
                } else {
                    var te = Math.tan(degToRad(exoatmElevation));
                    if (exoatmElevation > 5.0) {
                        refractionCorrection = 58.1 / te - 0.07 / (te * te * te) + 0.000086 / (te * te * te * te * te);
                    } else if (exoatmElevation > -0.575) {
                        refractionCorrection = 1735.0 + exoatmElevation * (-518.2 + exoatmElevation * (103.4 + exoatmElevation * (-12.79 + exoatmElevation * 0.711)));
                    } else {
                        refractionCorrection = -20.774 / te;
                    }
                    refractionCorrection = refractionCorrection / 3600.0;
                }

                var solarZen = zenith - refractionCorrection;
//                    if ((output) && (solarZen > 108.0)) {
//                        document.getElementById("azbox").value = "dark"
//                        document.getElementById("elbox").value = "dark"
//                    } else if (output) {
//                        document.getElementById("azbox").value = Math.floor(azimuth * 100 + 0.5) / 100.0
//                        document.getElementById("elbox").value = Math.floor((90.0 - solarZen) * 100 + 0.5) / 100.0
//                        if (document.getElementById("showae").checked) {
//                            showLineGeodesic2("azimuth", "#ffff00", azimuth)
//                        }
//                    }
                var result = {
                    eot: eqTime,
                    theta: theta,
                    azimuth: azimuth,
                    zenith: solarZen
                };
                return result;
            };
            /**
             *
             * @param {Number} jd
             * @param {Number} longitude
             * @param {Number} timezone
             * @param {type} dst
             * @returns {Number}
             */
            var calcSolNoon = function (jd, longitude, timezone, dst) {
                var tnoon = calcTimeJulianCent(jd - longitude / 360.0);
                var eqTime = calcEquationOfTime(tnoon);
                var solNoonOffset = 720.0 - (longitude * 4) - eqTime; // in minutes
                var newt = calcTimeJulianCent(jd + solNoonOffset / 1440.0);
                eqTime = calcEquationOfTime(newt);
                var solNoonLocal = 720 - (longitude * 4) - eqTime + (timezone * 60.0); // in minutes
                if (dst)
                    solNoonLocal += 60.0;
                while (solNoonLocal < 0.0) {
                    solNoonLocal += 1440.0;
                }
                while (solNoonLocal >= 1440.0) {
                    solNoonLocal -= 1440.0;
                }
                return solNoonLocal;
            };
            /**
             *
             * @param {type} rise
             * @param {Number} JD
             * @param {Number} latitude
             * @param {Number} longitude
             * @returns {Object} Result containing timeUTC and hourAngle
             */
            var calcSunriseSetUTC = function (rise, JD, latitude, longitude) {
                var t = calcTimeJulianCent(JD);
                var eqTime = calcEquationOfTime(t);
                var solarDec = calcSunDeclination(t);
                var hourAngle = calcHourAngleSunrise(latitude, solarDec);
                //alert("HA = " + radToDeg(hourAngle));
                if (!rise)
                    hourAngle = -hourAngle;
                var delta = longitude + radToDeg(hourAngle);
                var timeUTC = 720 - (4.0 * delta) - eqTime;	// in minutes
                var result = {
                    timeUTC: timeUTC,
                    hourAngle: radToDeg(hourAngle)
                };
                return result
            };
            /**
             *
             * @param {type} rise 1 for sunrise, 0 for sunset
             * @param {Number} JD
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Number} timezone
             * @param {type} dst
             * @returns {Object} Result containing timeLocal, timeUTC and hourAngle
             */
            var calcSunriseSet = function (rise, JD, latitude, longitude, timezone, dst) {
//                    var id = ((rise) ? "risebox" : "setbox")
                var result = calcSunriseSetUTC(rise, JD, latitude, longitude);
                var timeUTC = result.timeUTC;
                var newResult = calcSunriseSetUTC(rise, JD + result.timeUTC / 1440.0, latitude, longitude);
                if (isNumber(newResult.timeUTC)) {
                    var timeLocal = newResult.timeUTC + (timezone * 60.0);
//                        if (document.getElementById(rise ? "showsr" : "showss").checked) {
//                            var riseT = calcTimeJulianCent(JD + newTimeUTC / 1440.0)
//                            var riseAz = calcAzEl(0, riseT, timeLocal, latitude, longitude, timezone)
//                            if (rise) {
//                                showLineGeodesic2("sunrise", "#00aa00", riseAz);
//                            } else {
//                                showLineGeodesic2("sunset", "#ff0000", riseAz);
//                            }
//                        }
                    timeLocal += ((dst) ? 60.0 : 0.0);
                    if ((timeLocal >= 0.0) && (timeLocal < 1440.0)) {
//                            document.getElementById(id).value = timeString(timeLocal, 2)
                    } else {
                        var jday = JD;
                        var increment = ((timeLocal < 0) ? 1 : -1);
                        while ((timeLocal < 0.0) || (timeLocal >= 1440.0)) {
                            timeLocal += increment * 1440.0;
                            jday -= increment
                        }
//                            document.getElementById(id).value = timeDateString(jday, timeLocal)
                    }
                } else { // no sunrise/set found
                    var doy = calcDoyFromJD(JD);
                    var jdy;
                    if (((latitude > 66.4) && (doy > 79) && (doy < 267)) ||
                        ((latitude < -66.4) && ((doy < 83) || (doy > 263)))) {   //previous sunrise/next sunset
                        if (rise) { // find previous sunrise
                            jdy = calcJDofNextPrevRiseSet(0, rise, JD, latitude, longitude, timezone, dst)
                        } else { // find next sunset
                            jdy = calcJDofNextPrevRiseSet(1, rise, JD, latitude, longitude, timezone, dst)
                        }
//                            document.getElementById(((rise) ? "risebox" : "setbox")).value = dayString(jdy, 0, 3)
                    } else {   //previous sunset/next sunrise
                        if (rise == 1) { // find previous sunrise
                            jdy = calcJDofNextPrevRiseSet(1, rise, JD, latitude, longitude, timezone, dst)
                        } else { // find next sunset
                            jdy = calcJDofNextPrevRiseSet(0, rise, JD, latitude, longitude, timezone, dst)
                        }
//                            document.getElementById(((rise) ? "risebox" : "setbox")).value = dayString(jdy, 0, 3)
                    }
                }
                // Add the local time to the result
                result.timeLocal = timeLocal;
                return result;
            };
            /**
             *
             * @param {type} next
             * @param {Number} rise
             * @param {Number} JD
             * @param {Number} latitude
             * @param {Number} longitude
             * @param {Number} tz
             * @param {type} dst
             * @returns {Number}
             */
            var calcJDofNextPrevRiseSet = function (next, rise, JD, latitude, longitude, tz, dst) {
                var julianday = JD;
                var increment = ((next) ? 1.0 : -1.0);

                var result = calcSunriseSetUTC(rise, julianday, latitude, longitude);
                var time = result.timeUTC;
                while (!isNumber(time)) {
                    julianday += increment;
                    result = calcSunriseSetUTC(rise, julianday, latitude, longitude);
                    time = result.timeUTC;
                }
                var timeLocal = time + tz * 60.0 + ((dst) ? 60.0 : 0.0);
                while ((timeLocal < 0.0) || (timeLocal >= 1440.0)) {
                    var incr = ((timeLocal < 0) ? 1 : -1);
                    timeLocal += (incr * 1440.0);
                    julianday -= incr
                }
                return julianday;
            };
            /**
             *
             * @param {Date} localTime
             * @param {Number} utcOffset
             * @param {Number} lat
             * @param {Number} lng
             * @returns {undefined}
             */
            this.calculate = function (localTime, utcOffset, lat, lng) {

                // 4-digit year; valid range = -2000 to 6000
                var year = localTime ? localTime.getFullYear() : undefined;
                // 2-digit month; valid range = 1 to 12
                var month = localTime ? localTime.getMonth() + 1 : undefined; // convert from zero-based month
                // 2-digit day; valid range = 1 to 31
                var day = localTime ? localTime.getDate() : undefined;
                // Observer local hour; valid range = 0 to 24
                var hour = localTime ? localTime.getHours() : undefined;
                // Observer local minute; valid range = 0 to 59
                var minute = localTime ? localTime.getMinutes() : undefined;
                // Observer local second; valid range = 0 to 59
                var second = localTime ? localTime.getSeconds() : undefined;
                // Observer time zone (negative west of Greenwich)
                var tz = utcOffset || 0; // hours

                var jday = this.getJD(year, month, day);
                var tl = getTimeLocal(hour, minute, second);
                var julianDay = jday + tl / 1440.0 - tz / 24.0;
                var T = calcTimeJulianCent(julianDay);

                var eqTime = calcEquationOfTime(T);
                var theta = calcSunDeclination(T);

                var solarTimeFix = eqTime + 4.0 * lng - 60.0 * tz;
                var earthRadVec = calcSunRadVector(T);
                var trueSolarTime = tl + solarTimeFix;
                while (trueSolarTime > 1440) {
                    trueSolarTime -= 1440;
                }
                var hourAngle = trueSolarTime / 4.0 - 180.0;
                if (hourAngle < -180) {
                    hourAngle += 360.0;
                }
                var haRad = degToRad(hourAngle);
                var csz = Math.sin(degToRad(lat)) * Math.sin(degToRad(theta)) + Math.cos(degToRad(lat)) * Math.cos(degToRad(theta)) * Math.cos(haRad);
                if (csz > 1.0) {
                    csz = 1.0
                } else if (csz < -1.0) {
                    csz = -1.0
                }
                var zenith = radToDeg(Math.acos(csz));
                var azDenom = (Math.cos(degToRad(lat)) * Math.sin(degToRad(zenith)));
                if (Math.abs(azDenom) > 0.001) {
                    var azRad = ((Math.sin(degToRad(lat)) * Math.cos(degToRad(zenith))) - Math.sin(degToRad(theta))) / azDenom;
                    if (Math.abs(azRad) > 1.0) {
                        if (azRad < 0) {
                            azRad = -1.0;
                        } else {
                            azRad = 1.0;
                        }
                    }
                    var azimuth = 180.0 - radToDeg(Math.acos(azRad));
                    if (hourAngle > 0.0) {
                        azimuth = -azimuth;
                    }
                } else {
                    if (lat > 0.0) {
                        azimuth = 180.0;
                    } else {
                        azimuth = 0.0;
                    }
                }
                if (azimuth < 0.0) {
                    azimuth += 360.0;
                }
                var exoatmElevation = 90.0 - zenith;

                // Atmospheric Refraction correction

                var refractionCorrection = 0.0;
                if (exoatmElevation > 85.0) {
                    refractionCorrection = 0.0;
                } else {
                    var te = Math.tan(degToRad(exoatmElevation));
                    if (exoatmElevation > 5.0) {
                        refractionCorrection = 58.1 / te - 0.07 / (te * te * te) + 0.000086 / (te * te * te * te * te);
                    } else if (exoatmElevation > -0.575) {
                        refractionCorrection = 1735.0 + exoatmElevation * (-518.2 + exoatmElevation * (103.4 + exoatmElevation * (-12.79 + exoatmElevation * 0.711)));
                    } else {
                        refractionCorrection = -20.774 / te;
                    }
                    refractionCorrection = refractionCorrection / 3600.0;
                }
                var solarZen = zenith - refractionCorrection;

                //var azEl = calcAzEl(1, T, tl, lat, lng, tz);

                calcSolNoon(jday, lng, tz);
                var rise = calcSunriseSet(1, jday, lat, lng, tz);
                var set = calcSunriseSet(0, jday, lat, lng, tz);
                var midnight = new Date(localTime.getFullYear(), localTime.getMonth(), localTime.getDate());
                var sunriseTime = new Date(midnight.getTime() + rise.timeLocal * 60000);
                var sunsetTime =  new Date(midnight.getTime() + set.timeLocal * 60000);

                var alpha = calcSunRtAscension(T);

                // TODO: create limitDegrees360
                while (alpha < 0)
                    alpha += 360;

                // TODO: create calcGreenwichMeanSiderealTime()
                var elapsedJulianDays = julianDay - 2451545.0;
                var greenwichMeanSiderealTime = (18.697374558 + 24.06570982441908 * elapsedJulianDays) % 24;
                var longitude = alpha - (greenwichMeanSiderealTime * 15.0);

                // TODO: create limitDegrees180()
                while (longitude > 180)
                    longitude -= 360;
                while (longitude < -180)
                    longitude += 360;
                while (azimuth > 180)
                    azimuth -= 360;
                while (longitude < -180)
                    azimuth += 360;


                // TODO: return a new Sunlight object
                var sunlight = {
                    year: year,
                    month: month,
                    day: day,
                    hour: hour,
                    minute: minute,
                    second: second,
                    utcOffset: tz,
                    julianDate: julianDay,
                    observerLatitude: lat,
                    observerLongitude: lng,
                    subsolarLatitude: theta,
                    subsolarLongitude: longitude,
                    azimuth: azimuth,
                    zenith: zenith,
                    rightAscension: alpha,
                    hourAngle: hourAngle,
                    sunriseHourAngle: rise.hourAngle,
                    sunsetHourAngle: set.hourAngle,
                    sunrise: sunriseTime,
                    sunset: sunsetTime
                };
                return sunlight;
            };
        };
        return SolarCalculator;
    }
);