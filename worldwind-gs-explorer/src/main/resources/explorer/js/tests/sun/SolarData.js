/* 
 * Copyright (c) 2015, Bruce Schubert <bruce@emxsys.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     - Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *
 *     - Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 *     - Neither the name of Bruce Schubert, Emxsys nor the names of its 
 *       contributors may be used to endorse or promote products derived
 *       from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
define([],
    function () {
        "use strict";
        /**
         * 
         * @param {Date} localTime
         * @param {type} observer
         * @param {type} terrain
         * @param {type} temperature
         * @param {type} pressure
         * @returns {SolarData}
         */
        var SolarData = function (localTime, utcOffset, observer, terrain, temperature, pressure) {

            //-----------------INPUT VALUES--------------------
            /** 
             * 4-digit year; valid range = -2000 to 6000 
             */
            this.year = localTime ? localTime.getFullYear() : undefined;
            /** 
             * 2-digit month; valid range = 1 to 12 
             */
            this.month = localTime ? localTime.getMonth() + 1 : undefined; // convert from zero-based month
            /** 
             * 2-digit day; valid range = 1 to 31 
             */
            this.day = localTime ? localTime.getDate() : undefined;
            /** 
             * Observer local hour; valid range = 0 to 24 
             */
            this.hour = localTime ? localTime.getHours() : undefined;
            /** 
             * Observer local minute; valid range = 0 to 59 
             */
            this.minute = localTime ? localTime.getMinutes() : undefined;
            /** 
             * Observer local second; valid range = 0 to 59 
             */
            this.second = localTime ? localTime.getSeconds() : undefined;
            /** 
             * Observer time zone (negative west of Greenwich)
             */
            this.timezone = utcOffset || 0; // hours
            /** 
             * Difference between earth rotation time and terrestrial time. 
             * It is derived from observation only and is reported in this 
             * bulletin: http://maia.usno.navy.mil/ser7/ser7.dat; 
             * where delta_t * = 32.184 + (TAI-UTC) + DUT1. 
             * Valid range = -8000 to 8000 seconds */
            this.delta_t = 67; // Beginning 1 July 2012 = TAI-UTC = 35.000 000 seconds  
            /** 
             * Observer longitude (negative west of Greenwich). 
             * Valid range = -180 to 180 degrees 
             */
            this.longitude = observer ? observer.longitude : undefined;
            /** 
             * Observer latitude (negative south of equator). 
             * Valid range = -90 to 90 degrees 
             */
            this.latitude = observer ? observer.latitude : undefined;
            /** 
             * Observer elevation [meters]. 
             * Valid range = -6500000 or higher meters 
             */
            this.elevation = observer ? observer.elevation : undefined;
            /** 
             * Annual average local pressure [millibars]. 
             * Valid range = 0 to 5000 millibars 
             * */
            this.pressure = (pressure === undefined) ? 1013.25 : pressure; // 29.92 hg standard pressure - aviation
            /** 
             * Annual average local temperature [degrees Celsius]. 
             * Valid range = -273 to 6000 degrees Celsius 
             */
            this.temperature = (temperature === undefined) ? 15 : temperature; // 59 F standard pressure - aviation
            /** 
             * Surface slope (measured from the horizontal plane). 
             * Valid range = -360 to 360 degrees 
             */
            this.slope = terrain ? terrain.slope : 0;
            /** 
             * Surface azimuth rotation (measured from south to projection of 
             * surface normal on horizontal plane; negative west) 
             */
            this.azm_rotation = terrain ? terrain.aspect : 0;
            /** 
             * Atmospheric refraction at sunrise and sunset (0.5667 deg is typical). 
             * Valid range = -5 to 5 degrees. 
             */
            this.atmos_refract = 0.5667;
            /** Switch to choose functions for desired output (from enumeration) */
            //int function;
            //-----------------Intermediate OUTPUT VALUES--------------------
            /** 
             * Julian day. 
             */
            this.jd = undefined;
            /** 
             * Julian century. 
             */
            this.jc = undefined;
            /** 
             * Julian ephemeris day. 
             */
            this.jde = undefined;
            /** 
             * Julian ephemeris century. 
             */
            this.jce = undefined;
            /** 
             * Julian ephemeris millennium. 
             */
            this.jme = undefined;
            /** 
             * Earth heliocentric longitude on the celestial sphere [degrees]. 
             * “Heliocentric” means that the Earth position is calculated with 
             * respect to the center of the sun.
             */
            this.l = undefined;
            /** 
             * Earth heliocentric latitude on the celestial sphere [degrees]. 
             * “Heliocentric” means that the Earth position is calculated with 
             * respect to the center of the sun.
             */
            this.b = undefined;
            /** 
             * Earth radius vector [Astronomical Units; AU] 
             */
            this.r = undefined;
            /** 
             * Geocentric longitude on the celestial sphere [degrees]. 
             * “Geocentric” means that the sun position is calculated with respect 
             * to the Earth center.
             */
            this.theta = undefined;
            /** 
             * Geocentric latitude on the celestial sphere [degrees]. 
             * “Geocentric” means that the sun position is calculated with respect 
             * to the Earth center.
             */
            this.beta = undefined;
            /** 
             * Mean elongation (moon-sun) [degrees] 
             */
            this.x0 = undefined;
            /** 
             * Mean anomaly (sun) [degrees] 
             */
            this.x1 = undefined;
            /** 
             * Mean anomaly (moon) [degrees] 
             */
            this.x2 = undefined;
            /** 
             * Argument latitude (moon) [degrees] 
             */
            this.x3 = undefined;
            /** 
             * Ascending longitude (moon) [degrees] 
             */
            this.x4 = undefined;
            /** 
             * Nutation longitude [degrees] 
             */
            this.del_psi = undefined;
            /** 
             * Nutation obliquity [degrees] 
             */
            this.del_epsilon = undefined;
            /** 
             * Ecliptic mean obliquity [arc seconds] 
             */
            this.epsilon0 = undefined;
            /** 
             * Ecliptic true obliquity [degrees] 
             */
            this.epsilon = undefined;
            /** 
             * Aberration correction [degrees] 
             */
            this.del_tau = undefined;
            /** 
             * Apparent sun longitude on the celestial sphere [degrees] 
             */
            this.lamda = undefined;
            /** 
             * Greenwich mean sidereal time [degrees] 
             */
            this.nu0 = undefined;
            /** 
             * Greenwich sidereal time [degrees] 
             */
            this.nu = undefined;
            /** 
             * Geocentric sun right ascension on the celestial sphere [degrees]. 
             * “Geocentric” means that the sun position is calculated with respect 
             * to the Earth center.
             */
            this.alpha = undefined;
            /** 
             * Geocentric sun declination on the celestial sphere [degrees].
             * “Geocentric” means that the sun position is calculated with 
             * respect to the Earth center.
             */
            this.delta = undefined;
            /** 
             * Observer hour angle [degrees] 
             */
            this.h = undefined;
            /** 
             * Sun equatorial horizontal parallax [degrees] 
             */
            this.xi = undefined;
            /** 
             * Sun right ascension parallax [degrees] 
             */
            this.del_alpha = undefined;
            /** 
             * Topocentric sun declination [degrees] 
             */
            this.delta_prime = undefined;
            /** 
             * Topocentric sun right ascension [degrees] 
             */
            this.alpha_prime = undefined;
            /** 
             * Topocentric local hour angle [degrees] 
             */
            this.h_prime = undefined;
            /** 
             * Topocentric elevation angle (uncorrected) [degrees] 
             */
            this.e0 = undefined;
            /** 
             * Atmospheric refraction correction [degrees] 
             */
            this.del_e = undefined;
            /** 
             * Topocentric elevation angle (corrected) [degrees] 
             */
            this.e = undefined;
            /** 
             * Equation of time [minutes] 
             */
            this.eot = undefined;
            /** 
             * Sunrise hour angle [degrees] 
             */
            this.srha = undefined;
            /** 
             * Sunset hour angle [degrees] 
             */
            this.ssha = undefined;
            /** 
             * Sun transit altitude [degrees] 
             */
            this.sta = undefined;
            //---------------------Final OUTPUT VALUES------------------------
            /**
             * Topocentric zenith angle [degrees]. This is the angle between the 
             * observer's zenith  and the sun. “Topocentric” means that the sun 
             * position is calculated with respect to the observer's local position 
             * on the Earth surface.
             */
            this.zenith = undefined;
            /** 
             * Topocentric azimuth angle (westward from south) [-180 to 180 degrees]. 
             * “Topocentric” means that the sun position is calculated with respect 
             * to the observer's local position on the Earth surface.
             */
            this.azimuth180 = undefined;
            /** 
             * Topocentric azimuth angle (eastward from north) [ 0 to 360 degrees]. 
             * “Topocentric” means that the sun position is calculated with respect 
             * to the observer's local position on the Earth surface.
             */
            this.azimuth = undefined;
            /** 
             * Surface incidence angle [degrees] 
             */
            this.incidence = undefined;
            /* 
             * Local sun transit time (or solar noon) [fractional hour].
             */
            this.suntransit = undefined;
            /** 
             * Local sunrise time (+/- 30 seconds) [fractional hour] 
             */
            this.sunrise = undefined;
            /** 
             * Local sunset time (+/- 30 seconds) [fractional hour] 
             */
            this.sunset = undefined;
//        public SolarData(ZonedDateTime time, Coord3D observer) {
//            this(time, observer, new BasicTerrain(0, 0, 0));
//        }
//
//        public SolarData(ZonedDateTime time, Coord3D observer, Terrain terrain) {
//        this(time, observer, terrain, new Real(15), new Real(1013.25));
//        }
//
//        public SolarData(ZonedDateTime time, Coord3D observer, Terrain terrain, Real temperature, Real pressure) {
//        try {
//        this.year = time.getYear();
//            this.month = time.getMonthValue();
//            this.day = time.getDayOfMonth();
//            this.hour = time.getHour();
//            this.minute = time.getMinute();
//            this.second = time.getSecond();
//            this.timezone = time.getOffset().getTotalSeconds() / 3600.;
//            this.latitude = observer.getLatitudeDegrees();
//            this.longitude = observer.getLongitudeDegrees();
//            this.elevation = observer.getAltitudeMeters();
//            this.slope = terrain.getSlopeDegrees();
//            this.azm_rotation = terrain.getAspectDegrees();
//            this.temperature = temperature.getValue(GeneralUnit.degC);
//            this.pressure = pressure.getValue(CommonUnit.promiscuous);
//        } catch (VisADException ex) {
//        Exceptions.printStackTrace(ex);
//        }
//        }
//
//        getYear = function() {
//        return year;
//        }
//
//        public void setYear(int year) {
//        this.year = year;
//        }
//
//        public int getMonth() {
//        return month;
//        }
//
//        public void setMonth(int month) {
//        this.month = month;
//        }
//
//        public void setDay(int day) {
//        this.day = day;
//        }
//
//        public int getDay() {
//        return day;
//        }
//
//        public int getHour() {
//        return hour;
//        }
//
//        public void setHour(int hour) {
//        this.hour = hour;
//        }
//
//        public int getMinute() {
//        return minute;
//        }
//
//        public void setMinute(int minute) {
//        this.minute = minute;
//        }
//
//        public int getSecond() {
//        return second;
//        }
//
//        public void setSecond(int second) {
//        this.second = second;
//        }
//
//        public double getTimezone() {
//        return timezone;
//        }
//
//        public void setTimezone(double timezone) {
//        this.timezone = timezone;
//        }
//
//        public double getDelta_t() {
//        return delta_t;
//        }
//
//        public void setDelta_t(double delta_t) {
//        this.delta_t = delta_t;
//        }
//
//        public double getLongitude() {
//        return longitude;
//        }
//
//        public void setLongitude(double longitude) {
//        this.longitude = longitude;
//        }
//
//        public double getLatitude() {
//        return latitude;
//        }
//
//        public void setLatitude(double latitude) {
//        this.latitude = latitude;
//        }
//
//        /**
//         * Gets the observer elevation.
//         * @return elevation
//         */
//        public double getElevation() {
//        return elevation;
//        }
//
//        public void setElevation(double elevation) {
//        this.elevation = elevation;
//        }
//
//        public double getPressure() {
//        return pressure;
//        }
//
//        public void setPressure(double pressure) {
//        this.pressure = pressure;
//        }
//
//        public double getTemperature() {
//        return temperature;
//        }
//
//        public void setTemperature(double temperature) {
//        this.temperature = temperature;
//        }
//
//        public double getSlope() {
//        return slope;
//        }
//
//        public void setSlope(double slope) {
//        this.slope = slope;
//        }
//
//        public double getAzmRotation() {
//        return azm_rotation;
//        }
//
//        public void setAzmRotation(double azm_rotation) {
//        this.azm_rotation = azm_rotation;
//        }
//
//        /** Atmospheric refraction at sunrise and sunset (0.5667 deg is typical). Valid range: -5 to 5
//         * degrees */
//        public double getAtmosphericRefraction() {
//        return atmos_refract;
//        }
//
//        public void setAtmosphericRefraction(double atmos_refract) {
//        this.atmos_refract = atmos_refract;
//        }
//
//        /**
//         * Gets the Julian day.
//         * @return jd
//         */
//        public double getJulianDay() {
//        return jd;
//        }
//
//        /**
//         * Gets the Julian century.
//         * @return jc
//         */
//        public double getJulianCentury() {
//        return jc;
//        }
//
//        /**
//         * Gets the Julian ephemeris day.
//         * @return jde
//         */
//        public double getJulianEphemerisDay() {
//        return jde;
//        }
//
//        /**
//         * Gets the Julian ephemeris century.
//         * @return jce
//         */
//        public double getJulianEphemerisCentury() {
//        return jce;
//        }
//
//        /**
//         * Gets the Julian ephemeris millennium.
//         * @return jme
//         */
//        public double getJulianEphemerisMillennium() {
//        return jme;
//        }
//
//        /**
//         * Gets the earth heliocentric longitude on the celestial sphere [degrees]. “Heliocentric” means
//         * that the Earth position is calculated with respect to the center of the sun.
//         *
//         * @return l
//         */
//        public double getEarthHeliocentricLongitude() {
//        return l;
//        }
//
//        /**
//         * Gets the earth heliocentric latitude on the celestial sphere [degrees]. “Heliocentric” means
//         * that the Earth position is calculated with respect to the center of the sun.
//         *
//         * @return b
//         */
//        public double getEarthHeliocentricLatitude() {
//        return b;
//        }
//
//        /**
//         * Gets the earth radius vector [Astronomical Units, AU].
//         *
//         * @return r
//         */
//        public double getEarthRadiusVector() {
//        return r;
//        }
//
//        /**
//         * Gets the geocentric longitude on the celestial sphere [degrees]. “Geocentric” means that the
//         * sun position is calculated with respect to the Earth center.
//         *
//         * @return theta
//         */
//        public double getGeocentricLongitude() {
//        return theta;
//        }
//
//        /**
//         * Gets the geocentric latitude on the celestial sphere [degrees]. “Geocentric” means that the
//         * sun position is calculated with respect to the Earth center.
//         *
//         * @return beta
//         */
//        public double getGeocentricLatitude() {
//        return beta;
//        }
//
//        public double getX0() {
//        return x0;
//        }
//
//        public double getX1() {
//        return x1;
//        }
//
//        public double getX2() {
//        return x2;
//        }
//
//        public double getX3() {
//        return x3;
//        }
//
//        public double getX4() {
//        return x4;
//        }
//
//        public double getDel_psi() {
//        return del_psi;
//        }
//
//        public double getDel_epsilon() {
//        return del_epsilon;
//        }
//
//        /** ecliptic mean obliquity [arc seconds] */
//        public double getEclipticMeanObliquity() {
//        return epsilon0;
//        }
//
//        /** ecliptic true obliquity [degrees] */
//        public double getEclipticTrueObliquity() {
//        return epsilon;
//        }
//
//        /** aberration correction [degrees] */
//        public double getAberrationCorrection() {
//        return del_tau;
//        }
//
//        /** apparent sun longitude on the celestial sphere [degrees]. */
//        public double getApparentSunLongitude() {
//        return lamda;
//        }
//
//        /** Greenwich mean sidereal time [degrees] */
//        public double getGreenwichMeanSiderealTime() {
//        return nu0;
//        }
//
//        /** Greenwich sidereal time [degrees] */
//        public double getGreenwichSiderealTime() {
//        return nu;
//        }
//
//        /**
//         * Geocentric sun right ascension on the celestial sphere [degrees]. “Geocentric” means that the
//         * sun position is calculated with respect to the Earth center.
//         */
//        public double getGeocentricSunRightAscension() {
//        return alpha;
//        }
//
//        /**
//         * Geocentric sun declination on the celestial sphere [degrees]. “Geocentric” means that the sun
//         * position is calculated with respect to the Earth center.
//         */
//        public double getGeocentricSunDeclination() {
//        return delta;
//        }
//
//        /**
//         * Gets the observer hour angle [degrees]
//         *
//         * @return h
//         */
//        public double getObserverHourAngle() {
//        return h;
//        }
//
//        public double getXi() {
//        return xi;
//        }
//
//        /** sun right ascension parallax [degrees] */
//        public double getSunRightAscensionParallax() {
//        return del_alpha;
//        }
//
//        /**
//         * Gets the topocentric sun declination [degrees]. “Topocentric” means that the sun position is
//         * calculated with respect to the observer local position at the Earth surface.
//         *
//         * @return delta_prime
//         */
//        public double getTopocentricSunDeclination() {
//        return delta_prime;
//        }
//
//        /**
//         * Gets the topocentric sun right ascension [degrees]. “Topocentric” means that the sun position
//         * is calculated with respect to the observer local position at the Earth surface.
//         *
//         * @return alpha_prime
//         */
//        public double getTopocentricSunRightAscension() {
//        return alpha_prime;
//        }
//
//        /**
//         * Gets the topocentric local hour angle [degrees]. “Topocentric” means that the sun position is
//         * calculated with respect to the observer local position at the Earth surface.
//         *
//         * @return h_prime
//         */
//        public double getTopocentricLocalHourAngle() {
//        return h_prime;
//        }
//
//        /**
//         * Gets the topocentric elevation angle (uncorrected) [degrees]. “Topocentric” means that the
//         * sun position is calculated with respect to the observer local position at the Earth surface.
//         *
//         * @return e0
//         */
//        public double getTopocentricElevationAngle() {
//        return e0;
//        }
//
//        /** atmospheric refraction correction [degrees] */
//        public double getAtmosphericRefractionCorrection() {
//        return del_e;
//        }
//
//        /**
//         * Gets the topocentric elevation angle (corrected for atmospheric refraction) [degrees].
//         * “Topocentric” means that the sun position is calculated with respect to the observer local
//         * position at the Earth surface.
//         *
//         * @return e
//         */
//        public double getTopocentricElevationAngleCorrected() {
//        return e;
//        }
//
//        /** equation of time [minutes] */
//        public double getEquationOfTime() {
//        return eot;
//        }
//
//        /**
//         * Gets the sunrise hour angle [degrees].
//         *
//         * @return srha
//         */
//        public double getSunriseHourAngle() {
//        return srha;
//        }
//
//        /**
//         * Gets the sunset hour angle [degrees].
//         *
//         * @return ssha
//         */
//        public double getSunsetHourAngle() {
//        return ssha;
//        }
//
//        /**
//         * Gets the sun transit altitude [degrees] .
//         */
//        public double getSunTransitAltitude() {
//        return sta;
//        }
//
//        /**
//         * Gets the topocentric zenith angle [degrees]. This is the angle between the observer's zenith
//         * and the sun. “Topocentric” means that the sun position is calculated with respect to the
//         * observer local position at the Earth surface.
//         *
//         * @return zenith
//         */
//        public double getZenith() {
//        return zenith;
//        }
//
//        /**
//         * Gets the topocentric azimuth angle (westward from south) [-180 to 180 degrees]. “Topocentric”
//         * means that the sun position is calculated with respect to the observer local position at the
//         * Earth surface.
//         *
//         * @return azimuth180
//         */
//        public double getAzimuth180() {
//        return azimuth180;
//        }
//
//        /**
//         * Gets the topocentric azimuth angle (eastward from north) [ 0 to 360 degrees]. “Topocentric”
//         * means that the sun position is calculated with respect to the observer local position at the
//         * Earth surface.
//         *
//         * @return azimuth
//         */
//        public double getAzimuth() {
//        return azimuth;
//        }
//
//        /** surface incidence angle [degrees] */
//        getIncidence  = function() {
//        return incidence;
//        }
//
//        /**
//         * Gets the local sun transit time (or solar noon) [fractional hour].
//         *
//         * @return suntransit
//         */
//        getSunTransit  = function() {
//        return suntransit;
//        }
//
//        /**
//         * Gets the local sunrise time (+/- 30 seconds) [fractional hour].
//         *
//         * @return sunrise
//         */
//        getSunrise  = function() {
//        return sunrise;
//        }
//
//        /**
//         * Gets the local sunset time (+/- 30 seconds) [fractional hour].
//         *
//         * return sunset
//         */
//        public double getSunset() {
//        return sunset;
//        }
//
            this.toString = function () {
                return "SolarPosition{" + "jd=" + jd + ", l=" + l + ", b=" + b + ", r=" + r + ", del_psi=" + del_psi + ", del_epsilon=" + del_epsilon + ", epsilon=" + epsilon + ", h=" + h + ", zenith=" + zenith + ", azimuth=" + azimuth + ", incidence=" + incidence + ", sunrise=" + sunrise + ", sunset=" + sunset + '}';
            };

            this.copy = function (copy) {
                this.year = copy.year;
                this.month = copy.month;
                this.day = copy.day;
                this.hour = copy.hour;
                this.minute = copy.minute;
                this.second = copy.second;
                this.timezone = copy.timezone;
                this.delta_t = copy.delta_t;
                this.longitude = copy.longitude;
                this.latitude = copy.latitude;
                this.elevation = copy.elevation;
                this.pressure = copy.pressure;
                this.temperature = copy.temperature;
                this.slope = copy.slope;
                this.azm_rotation = copy.azm_rotation;
                this.atmos_refract = copy.atmos_refact;
                this.jd = copy.jd;
                this.jc = copy.jc;
                this.jde = copy.jde;
                this.jce = copy.jce;
                this.jme = copy.jme;
                this.l = copy.l;
                this.b = copy.b;
                this.r = copy.r;
                this.theta = copy.theta;
                this.beta = copy.beta;
                this.x0 = copy.x0;
                this.x1 = copy.x1;
                this.x2 = copy.x2;
                this.x3 = copy.x3;
                this.x4 = copy.x4;
                this.del_psi = copy.del_psi;
                this.del_epsilon = copy.del_epsilon;
                this.epsilon0 = copy.epsilon0;
                this.epsilon = copy.epsilon;
                this.del_tau = copy.del_tau;
                this.lamda = copy.lamda;
                this.nu0 = copy.nu0;
                this.nu = copy.nu;
                this.alpha = copy.alpha;
                this.delta = copy.delta;
                this.h = copy.h;
                this.xi = copy.xi;
                this.del_alpha = copy.del_alpha;
                this.delta_prime = copy.delta_prime;
                this.alpha_prime = copy.alpha_prime;
                this.h_prime = copy.h_prime;
                this.e0 = copy.e0;
                this.del_e = copy.del_e;
                this.e = copy.e;
                this.eot = copy.eot;
                this.srha = copy.srha;
                this.ssha = copy.ssha;
                this.sta = copy.sta;
                this.zenith = copy.zenith;
                this.azimuth180 = copy.azimuth180;
                this.azimuth = copy.azimuth;
                this.incidence = copy.incidence;
                this.suntransit = copy.suntransit;
                this.sunrise = copy.sunrise;
                this.sunset = copy.sunset;

                return this;
            }
        };
        return SolarData;
    }
);

