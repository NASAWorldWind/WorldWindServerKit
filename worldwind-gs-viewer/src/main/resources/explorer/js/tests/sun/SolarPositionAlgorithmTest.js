/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

define([
    'model/sun/SolarData',
    'model/sun/SolarPositionAlgorithm'],
    function (
        SolarData,
        spa) {
        "use strict";
        var SolarPositionAlgorithmTest = {
            //    spa.year          = 2003;
            //    spa.month         = 10; (October)
            //    spa.day           = 17;
            //    spa.hour          = 12;
            //    spa.minute        = 30;
            //    spa.second        = 30;
            //    spa.timezone      = -7.0;
            //    spa.delta_ut1     = 0;
            //    spa.delta_t       = 67;
            //    spa.longitude     = -105.1786;
            //    spa.latitude      = 39.742476;
            //    spa.elevation     = 1830.14;
            //    spa.pressure      = 820;
            //    spa.temperature   = 11;
            //    spa.slope         = 30;
            //    spa.azm_rotation  = -10;
            //    spa.atmos_refract = 0.5667;
            sunlight: spa.calculate(new SolarData(
                new Date(2003, 9, 17, 12, 30, 30),
                -7,
                {latitude: 39.742476, longitude: -105.1786, elevation: 1830.14},
                {aspect: -10, slope: 30},
                11,
                820)),
        };
        /////////////////////////////////////////////
        // The output of this test should be:
        //
        //Julian Day:    2452930.312847
        //L:             2.401826e+01 degrees
        //B:             -1.011219e-04 degrees
        //R:             0.996542 AU
        //H:             11.105902 degrees
        //Delta Psi:     -3.998404e-03 degrees
        //Delta Epsilon: 1.666568e-03 degrees
        //Epsilon:       23.440465 degrees
        //Zenith:        50.111622 degrees
        //Azimuth:       194.340241 degrees
        //Incidence:     25.187000 degrees
        //Sunrise:       06:12:43 Local Time
        //Sunset:        17:20:19 Local Time
        //
        /////////////////////////////////////////////     
        //display the results inside the SolarPositionAlgorithms structure
//        System.out.print(String.format("Julian Day:    %.6f\n", spa.jd));
//        System.out.print(String.format("L:             %.6e degrees\n", spa.l));
//        System.out.print(String.format("B:             %.6e degrees\n", spa.b));
//        System.out.print(String.format("R:             %.6f AU\n", spa.r));
//        System.out.print(String.format("H:             %.6f degrees\n", spa.h));
//        System.out.print(String.format("Delta Psi:     %.6e degrees\n", spa.del_psi));
//        System.out.print(String.format("Delta Epsilon: %.6e degrees\n", spa.del_epsilon));
//        System.out.print(String.format("Epsilon:       %.6f degrees\n", spa.epsilon));
//        System.out.print(String.format("Zenith:        %.6f degrees\n", spa.zenith));
//        System.out.print(String.format("Azimuth:       %.6f degrees\n", spa.azimuth));
//        System.out.print(String.format("Incidence:     %.6f degrees\n", spa.incidence));
        var sun = SolarPositionAlgorithmTest.sunlight;
        window.console.log("Julian Day:    " + sun.jd);
        window.console.log("L:             " + sun.l);
        window.console.log("B:             " + sun.b);
        window.console.log("R:             " + sun.r);
        window.console.log("H:             " + sun.h);
        window.console.log("Delta Psi:     " + sun.del_psi);
        window.console.log("Delta Epsilon: " + sun.del_epsilon);
        window.console.log("Epsilon:       " + sun.epsilon);
        window.console.log("Zenith:        " + sun.zenith);
        window.console.log("Azimuth:       " + sun.azimuth);
        window.console.log("Incidence:     " + sun.incidence);
//        var min = 60.0 * (spa.sunrise - Math.floor(spa.sunrise));
//        var sec = 60.0 * (min - Math.floor(min));
//                window.console.log("Sunrise:       %02d:%02d:%02d Local Time\n", (int) (spa.sunrise), (int) min, (int) sec));
//            System.out.println(ZonedDateTime.of(
//                LocalDate.of(spa.year, spa.month, spa.day),
//                LocalTime.ofSecondOfDay((long)(spa.sunrise * 3600)),
//                ZoneId.ofOffset("", ZoneOffset.ofTotalSeconds((int)(spa.timezone * 3600)))));
//
//        min = 60.0 * (spa.sunset - (int) (spa.sunset));
//            sec = 60.0 * (min - (int) min);
//            System.out.print(String.format("Sunset:        %02d:%02d:%02d Local Time\n", (int) (spa.sunset), (int) min, (int) sec));
//            assertEquals("JD", 2452930.312847, spa.getJulianDay(), .000001);

        var assertEquals = function (msg, a, b, epsilon) {
            if (a === b) {
                return true;
            }
            console.assert(Math.abs(a - b) < Math.abs(epsilon), msg + ": " + a + " != " + b );
        };
        assertEquals("L", 2.401826e+01, sun.l, .0001);
        assertEquals("B", -1.011219e-04, sun.b, .00000001);
        assertEquals("R", 0.996542, sun.r, .000001);
        assertEquals("H", 11.105902, sun.h, .000001);
        assertEquals("Delta Psi", -3.998404e-03, sun.del_psi, .00000001);
        assertEquals("Delta Epsilon", 1.666568e-03, sun.del_epsilon, .0000001);
        assertEquals("Epsilon", 23.440465, sun.epsilon, .000001);
        assertEquals("Zenith", 50.111622, sun.zenith, .000001);
        assertEquals("Azimuth", 194.340241, sun.azimuth, .000001);
        assertEquals("Incidence", 25.187000, sun.incidence, .000001);
        
        return SolarPositionAlgorithmTest;
    }
);