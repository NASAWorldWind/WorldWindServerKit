/*
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/**
 * This module contains "Solar Position Algorithms for Data-Processing Software" 
 * ported to JavaScript.
 * 
 * Reda, Ibrahim and Afshin Andreas, 2008: Solar Position Algorithm for
 * Solar Radiation Applications. National Renewable Energy Laboratory. 
 * Revised 2008. {@link  http://www.nrel.gov/docs/fy08osti/34302.pdf}
 * 
 * This module is a derivative of SPA.C. Following is the copyright 
 * notice that accompanies SPA.C.
 * *********************************************************************
 * SPA.C
 * National Renewable Energy Laboratory
 * Solar Radiation Research Laboratory
 * June 2003
 *
 *                              NOTICE
 *  Copyright © 2008-2011 Alliance for Sustainable Energy, LLC, All Rights Reserved
 *  
 *  The Solar Position Algorithm ("Software") is code in development 
 *  prepared by employees of the Alliance for Sustainable Energy, LLC, 
 *  (hereinafter the "Contractor"), under Contract No. DE-AC36-08GO28308 
 *  ("Contract") with the U.S. Department of Energy (the "DOE"). The 
 *  United States Government has been granted for itself and others acting 
 *  on its behalf a paid-up, non-exclusive, irrevocable, worldwide license 
 *  in the Software to reproduce, prepare derivative works, and perform 
 *  publicly and display publicly. Beginning five (5) years after the date 
 *  permission to assert copyright is obtained from the DOE, and subject to 
 *  any subsequent five (5) year renewals, the United States Government is 
 *  granted for itself and others acting on its behalf a paid-up, non-exclusive, 
 *  irrevocable, worldwide license in the Software to reproduce, prepare 
 *  derivative works, distribute copies to the public, perform publicly and 
 *  display publicly, and to permit others to do so. If the Contractor ceases 
 *  to make this computer software available, it may be obtained from DOE's 
 *  Office of Scientific and Technical Information's Energy Science and 
 *  Technology Software Center (ESTSC) at P.O. Box 1020, Oak Ridge, TN 
 *  37831-1020. 
 *  THIS SOFTWARE IS PROVIDED BY THE CONTRACTOR "AS IS" AND ANY EXPRESS 
 *  OR IMPLIED WARRANTIES, INCLUDING BUT NOT LIMITED TO, THE IMPLIED 
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE CONTRACTOR OR THE U.S. GOVERNMENT 
 *  BE LIABLE FOR ANY SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY 
 *  DAMAGES WHATSOEVER, INCLUDING BUT NOT LIMITED TO CLAIMS ASSOCIATED 
 *  WITH THE LOSS OF DATA OR PROFITS, WHICH MAY RESULT FROM AN ACTION IN 
 *  CONTRACT, NEGLIGENCE OR OTHER TORTIOUS CLAIM THAT ARISES OUT OF OR IN 
 *  CONNECTION WITH THE ACCESS, USE OR PERFORMANCE OF THIS SOFTWARE.
 *  
 *  The Software is being provided for internal, noncommercial purposes 
 *  only and shall not be re-distributed. Please contact Doreen Molk in 
 *  the NREL Commercialization and Technology Transfer Office for information 
 *  concerning a commercial license to use the Software.
 *  As a condition of using the Software in an application, the developer 
 *  of the application agrees to reference the use of the Software and 
 *  make this Notice readily accessible to any end-user in a Help|About 
 *  screen or equivalent manner. 
 *  
 */
define(['tests/sun/SolarData'],
    function (SolarData) {
        "use strict";
        // Orginal header extracted from C source code in PDF:
        //////////////////////////////////////////////
        // Solar Position Algorithm (SPA)           //
        // for                                      //
        // Solar Radiation Application              //
        //                                          //
        // May 12, 2003                             //
        //                                          //
        // Filename: SPA.C                          //
        //                                          //
        // Afshin Michael Andreas                   //
        // afshin_andreas@nrel.gov (303)384-6383    //
        //                                          //
        // Measurement & Instrumentation Team       //
        // Solar Radiation Research Laboratory      //
        // National Renewable Energy Laboratory     //
        // 1617 Cole Blvd, Golden, CO 80401         //
        //////////////////////////////////////////////
        //////////////////////////////////////////////
        // See the SPA.H header file for usage      //
        //                                          //
        // This code is based on the NREL           //
        // technical report "Solar Position         //
        // Algorithm for Solar Radiation            //
        // Application" by I. Reda & A. Andreas     //
        //////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////
        //
        // NOTICE
        //
        //This solar position algorithm for solar radiation applications (the "data") was produced by
        //the National Renewable Energy Laboratory ("NREL"), which is operated by the Midwest Research
        //Institute ("MRI") under Contract No. DE-AC36-99-GO10337 with the U.S. Department of Energy
        //(the "Government").
        //
        //Reference herein, directly or indirectly to any specific commercial product, process, or
        //service by trade name, trademark, manufacturer, or otherwise, does not constitute or imply
        //its endorsement, recommendation, or favoring by the Government, MRI or NREL.
        //
        //THESE DATA ARE PROVIDED "AS IS" AND NEITHER THE GOVERNMENT, MRI, NREL NOR ANY OF THEIR
        //EMPLOYEES, MAKES ANY WARRANTY, EXPRESS OR IMPLIED, INCLUDING THE WARRANTIES OF MERCHANTABILITY
        //AND FITNESS FOR A PARTICULAR PURPOSE, OR ASSUMES ANY LEGAL LIABILITY OR RESPONSIBILITY FOR THE
        //ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY SUCH INFORMATION DISCLOSED IN THE ALGORITHM, OR
        //OF ANY APPARATUS, PRODUCT, OR PROCESS DISCLOSED, OR REPRESENTS THAT ITS USE WOULD NOT INFRINGE
        //PRIVATELY OWNED RIGHTS.
        //
        ///////////////////////////////////////////////////////////////////////////////////////////////
        var SPA = {
            L_COUNT: 6,
            B_COUNT: 2,
            R_COUNT: 5,
            Y_COUNT: 63,
            l_subcount: [64, 34, 20, 7, 3, 1],
            b_subcount: [5, 2],
            r_subcount: [40, 10, 6, 2, 1],
            // Array indices
            TERM_A: 0,
            TERM_B: 1,
            TERM_C: 2,
            TERM_COUNT: 3,
            // Array indices
            TERM_X0: 0,
            TERM_X1: 1,
            TERM_X2: 2,
            TERM_X3: 3,
            TERM_X4: 4,
            TERM_X_COUNT: 5,
            TERM_Y_COUNT: 5,
            // Array indices
            TERM_PSI_A: 0,
            TERM_PSI_B: 1,
            TERM_EPS_C: 2,
            TERM_EPS_D: 3,
            TERM_PE_COUNT: 4,
            // Julian array indices
            JD_MINUS: 0,
            JD_ZERO: 1,
            JD_PLUS: 2,
            JD_COUNT: 3,
            // Sun array indices
            SUN_TRANSIT: 0,
            SUN_RISE: 1,
            SUN_SET: 2,
            SUN_COUNT: 3,
            SUN_RADIUS: 0.26667,
            ///////////////////////////////////////////////////
            /// Earth Periodic Terms
            ///////////////////////////////////////////////////
            L_TERMS: [
                [[175347046.0, 0, 0],
                    [3341656.0, 4.6692568, 6283.07585],
                    [34894.0, 4.6261, 12566.1517],
                    [3497.0, 2.7441, 5753.3849],
                    [3418.0, 2.8289, 3.5231],
                    [3136.0, 3.6277, 77713.7715],
                    [2676.0, 4.4181, 7860.4194],
                    [2343.0, 6.1352, 3930.2097],
                    [1324.0, 0.7425, 11506.7698],
                    [1273.0, 2.0371, 529.691],
                    [1199.0, 1.1096, 1577.3435],
                    [990, 5.233, 5884.927],
                    [902, 2.045, 26.298],
                    [857, 3.508, 398.149],
                    [780, 1.179, 5223.694],
                    [753, 2.533, 5507.553],
                    [505, 4.583, 18849.228],
                    [492, 4.205, 775.523],
                    [357, 2.92, 0.067],
                    [317, 5.849, 11790.629],
                    [284, 1.899, 796.298],
                    [271, 0.315, 10977.079],
                    [243, 0.345, 5486.778],
                    [206, 4.806, 2544.314],
                    [205, 1.869, 5573.143],
                    [202, 2.458, 6069.777],
                    [156, 0.833, 213.299],
                    [132, 3.411, 2942.463],
                    [126, 1.083, 20.775],
                    [115, 0.645, 0.98],
                    [103, 0.636, 4694.003],
                    [102, 0.976, 15720.839],
                    [102, 4.267, 7.114],
                    [99, 6.21, 2146.17],
                    [98, 0.68, 155.42],
                    [86, 5.98, 161000.69],
                    [85, 1.3, 6275.96],
                    [85, 3.67, 71430.7],
                    [80, 1.81, 17260.15],
                    [79, 3.04, 12036.46],
                    [75, 1.76, 5088.63],
                    [74, 3.5, 3154.69],
                    [74, 4.68, 801.82],
                    [70, 0.83, 9437.76],
                    [62, 3.98, 8827.39],
                    [61, 1.82, 7084.9],
                    [57, 2.78, 6286.6],
                    [56, 4.39, 14143.5],
                    [56, 3.47, 6279.55],
                    [52, 0.19, 12139.55],
                    [52, 1.33, 1748.02],
                    [51, 0.28, 5856.48],
                    [49, 0.49, 1194.45],
                    [41, 5.37, 8429.24],
                    [41, 2.4, 19651.05],
                    [39, 6.17, 10447.39],
                    [37, 6.04, 10213.29],
                    [37, 2.57, 1059.38],
                    [36, 1.71, 2352.87],
                    [36, 1.78, 6812.77],
                    [33, 0.59, 17789.85],
                    [30, 0.44, 83996.85],
                    [30, 2.74, 1349.87],
                    [25, 3.16, 4690.48]],
                [[628331966747.0, 0, 0],
                    [206059.0, 2.678235, 6283.07585],
                    [4303.0, 2.6351, 12566.1517],
                    [425.0, 1.59, 3.523],
                    [119.0, 5.796, 26.298],
                    [109.0, 2.966, 1577.344],
                    [93, 2.59, 18849.23],
                    [72, 1.14, 529.69],
                    [68, 1.87, 398.15],
                    [67, 4.41, 5507.55],
                    [59, 2.89, 5223.69],
                    [56, 2.17, 155.42],
                    [45, 0.4, 796.3],
                    [36, 0.47, 775.52],
                    [29, 2.65, 7.11],
                    [21, 5.34, 0.98],
                    [19, 1.85, 5486.78],
                    [19, 4.97, 213.3],
                    [17, 2.99, 6275.96],
                    [16, 0.03, 2544.31],
                    [16, 1.43, 2146.17],
                    [15, 1.21, 10977.08],
                    [12, 2.83, 1748.02],
                    [12, 3.26, 5088.63],
                    [12, 5.27, 1194.45],
                    [12, 2.08, 4694],
                    [11, 0.77, 553.57],
                    [10, 1.3, 6286.6],
                    [10, 4.24, 1349.87],
                    [9, 2.7, 242.73],
                    [9, 5.64, 951.72],
                    [8, 5.3, 2352.87],
                    [6, 2.65, 9437.76],
                    [6, 4.67, 4690.48]],
                [[52919.0, 0, 0],
                    [8720.0, 1.0721, 6283.0758],
                    [309.0, 0.867, 12566.152],
                    [27, 0.05, 3.52],
                    [16, 5.19, 26.3],
                    [16, 3.68, 155.42],
                    [10, 0.76, 18849.23],
                    [9, 2.06, 77713.77],
                    [7, 0.83, 775.52],
                    [5, 4.66, 1577.34],
                    [4, 1.03, 7.11],
                    [4, 3.44, 5573.14],
                    [3, 5.14, 796.3],
                    [3, 6.05, 5507.55],
                    [3, 1.19, 242.73],
                    [3, 6.12, 529.69],
                    [3, 0.31, 398.15],
                    [3, 2.28, 553.57],
                    [2, 4.38, 5223.69],
                    [2, 3.75, 0.98]],
                [[289.0, 5.844, 6283.076],
                    [35, 0, 0],
                    [17, 5.49, 12566.15],
                    [3, 5.2, 155.42],
                    [1, 4.72, 3.52],
                    [1, 5.3, 18849.23],
                    [1, 5.97, 242.73]],
                [[114.0, 3.142, 0],
                    [8, 4.13, 6283.08],
                    [1, 3.84, 12566.15]],
                [[1, 3.14, 0]]],
            B_TERMS: [
                [[280.0, 3.199, 84334.662],
                    [102.0, 5.422, 5507.553],
                    [80, 3.88, 5223.69],
                    [44, 3.7, 2352.87],
                    [32, 4, 1577.34]],
                [[9, 3.9, 5507.55],
                    [6, 1.73, 5223.69]]],
            R_TERMS: [
                [[100013989.0, 0, 0],
                    [1670700.0, 3.0984635, 6283.07585],
                    [13956.0, 3.05525, 12566.1517],
                    [3084.0, 5.1985, 77713.7715],
                    [1628.0, 1.1739, 5753.3849],
                    [1576.0, 2.8469, 7860.4194],
                    [925.0, 5.453, 11506.77],
                    [542.0, 4.564, 3930.21],
                    [472.0, 3.661, 5884.927],
                    [346.0, 0.964, 5507.553],
                    [329.0, 5.9, 5223.694],
                    [307.0, 0.299, 5573.143],
                    [243.0, 4.273, 11790.629],
                    [212.0, 5.847, 1577.344],
                    [186.0, 5.022, 10977.079],
                    [175.0, 3.012, 18849.228],
                    [110.0, 5.055, 5486.778],
                    [98, 0.89, 6069.78],
                    [86, 5.69, 15720.84],
                    [86, 1.27, 161000.69],
                    [65, 0.27, 17260.15],
                    [63, 0.92, 529.69],
                    [57, 2.01, 83996.85],
                    [56, 5.24, 71430.7],
                    [49, 3.25, 2544.31],
                    [47, 2.58, 775.52],
                    [45, 5.54, 9437.76],
                    [43, 6.01, 6275.96],
                    [39, 5.36, 4694],
                    [38, 2.39, 8827.39],
                    [37, 0.83, 19651.05],
                    [37, 4.9, 12139.55],
                    [36, 1.67, 12036.46],
                    [35, 1.84, 2942.46],
                    [33, 0.24, 7084.9],
                    [32, 0.18, 5088.63],
                    [32, 1.78, 398.15],
                    [28, 1.21, 6286.6],
                    [28, 1.9, 6279.55],
                    [26, 4.59, 10447.39]],
                [[103019.0, 1.10749, 6283.07585],
                    [1721.0, 1.0644, 12566.1517],
                    [702.0, 3.142, 0],
                    [32, 1.02, 18849.23],
                    [31, 2.84, 5507.55],
                    [25, 1.32, 5223.69],
                    [18, 1.42, 1577.34],
                    [10, 5.91, 10977.08],
                    [9, 1.42, 6275.96],
                    [9, 0.27, 5486.78]],
                [[4359.0, 5.7846, 6283.0758],
                    [124.0, 5.579, 12566.152],
                    [12, 3.14, 0],
                    [9, 3.63, 77713.77],
                    [6, 1.87, 5573.14],
                    [3, 5.47, 18849.23]],
                [[145.0, 4.273, 6283.076],
                    [7, 3.92, 12566.15]],
                [[4, 2.56, 6283.08]]],
            ////////////////////////////////////////////////////////////////
            /// Periodic Terms for the nutation in longitude and obliquity
            ////////////////////////////////////////////////////////////////
            Y_TERMS: [
                [0, 0, 0, 0, 1],
                [-2, 0, 0, 2, 2],
                [0, 0, 0, 2, 2],
                [0, 0, 0, 0, 2],
                [0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0],
                [-2, 1, 0, 2, 2],
                [0, 0, 0, 2, 1],
                [0, 0, 1, 2, 2],
                [-2, -1, 0, 2, 2],
                [-2, 0, 1, 0, 0],
                [-2, 0, 0, 2, 1],
                [0, 0, -1, 2, 2],
                [2, 0, 0, 0, 0],
                [0, 0, 1, 0, 1],
                [2, 0, -1, 2, 2],
                [0, 0, -1, 0, 1],
                [0, 0, 1, 2, 1],
                [-2, 0, 2, 0, 0],
                [0, 0, -2, 2, 1],
                [2, 0, 0, 2, 2],
                [0, 0, 2, 2, 2],
                [0, 0, 2, 0, 0],
                [-2, 0, 1, 2, 2],
                [0, 0, 0, 2, 0],
                [-2, 0, 0, 2, 0],
                [0, 0, -1, 2, 1],
                [0, 2, 0, 0, 0],
                [2, 0, -1, 0, 1],
                [-2, 2, 0, 2, 2],
                [0, 1, 0, 0, 1],
                [-2, 0, 1, 0, 1],
                [0, -1, 0, 0, 1],
                [0, 0, 2, -2, 0],
                [2, 0, -1, 2, 1],
                [2, 0, 1, 2, 2],
                [0, 1, 0, 2, 2],
                [-2, 1, 1, 0, 0],
                [0, -1, 0, 2, 2],
                [2, 0, 0, 2, 1],
                [2, 0, 1, 0, 0],
                [-2, 0, 2, 2, 2],
                [-2, 0, 1, 2, 1],
                [2, 0, -2, 0, 1],
                [2, 0, 0, 0, 1],
                [0, -1, 1, 0, 0],
                [-2, -1, 0, 2, 1],
                [-2, 0, 0, 0, 1],
                [0, 0, 2, 2, 1],
                [-2, 0, 2, 0, 1],
                [-2, 1, 0, 2, 1],
                [0, 0, 1, -2, 0],
                [-1, 0, 1, 0, 0],
                [-2, 1, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [0, 0, 1, 2, 0],
                [0, 0, -2, 2, 2],
                [-1, -1, 1, 0, 0],
                [0, 1, 1, 0, 0],
                [0, -1, 1, 2, 2],
                [2, -1, -1, 2, 2],
                [0, 0, 3, 2, 2],
                [2, -1, 0, 2, 2]],
            PE_TERMS: [
                [-171996, -174.2, 92025, 8.9],
                [-13187, -1.6, 5736, -3.1],
                [-2274, -0.2, 977, -0.5],
                [2062, 0.2, -895, 0.5],
                [1426, -3.4, 54, -0.1],
                [712, 0.1, -7, 0],
                [-517, 1.2, 224, -0.6],
                [-386, -0.4, 200, 0],
                [-301, 0, 129, -0.1],
                [217, -0.5, -95, 0.3],
                [-158, 0, 0, 0],
                [129, 0.1, -70, 0],
                [123, 0, -53, 0],
                [63, 0, 0, 0],
                [63, 0.1, -33, 0],
                [-59, 0, 26, 0],
                [-58, -0.1, 32, 0],
                [-51, 0, 27, 0],
                [48, 0, 0, 0],
                [46, 0, -24, 0],
                [-38, 0, 16, 0],
                [-31, 0, 13, 0],
                [29, 0, 0, 0],
                [29, 0, -12, 0],
                [26, 0, 0, 0],
                [-22, 0, 0, 0],
                [21, 0, -10, 0],
                [17, -0.1, 0, 0],
                [16, 0, -8, 0],
                [-16, 0.1, 7, 0],
                [-15, 0, 9, 0],
                [-13, 0, 7, 0],
                [-12, 0, 6, 0],
                [11, 0, 0, 0],
                [-10, 0, 5, 0],
                [-8, 0, 3, 0],
                [7, 0, -3, 0],
                [-7, 0, 0, 0],
                [-7, 0, 3, 0],
                [-7, 0, 3, 0],
                [6, 0, 0, 0],
                [6, 0, -3, 0],
                [6, 0, -3, 0],
                [-6, 0, 3, 0],
                [-6, 0, 3, 0],
                [5, 0, 0, 0],
                [-5, 0, 3, 0],
                [-5, 0, 3, 0],
                [-5, 0, 3, 0],
                [4, 0, 0, 0],
                [4, 0, 0, 0],
                [4, 0, 0, 0],
                [-4, 0, 0, 0],
                [-4, 0, 0, 0],
                [-4, 0, 0, 0],
                [3, 0, 0, 0],
                [-3, 0, 0, 0],
                [-3, 0, 0, 0],
                [-3, 0, 0, 0],
                [-3, 0, 0, 0],
                [-3, 0, 0, 0],
                [-3, 0, 0, 0],
                [-3, 0, 0, 0]],
            /*
             * Converts from degrees to radians.
             * @param {Number} degrees
             * @returns {Number} Radians.
             */
            toRadians: function (degrees) {
                return degrees * Math.PI / 180;
            },
            /**
             * Converts from radians to degrees.
             * @param {Number} radians
             * @returns {Number} Degrees.
             */
            toDegrees: function (radians) {
                return radians * 180 / Math.PI;
            },
            /**
             * Returns degrees limited to between 0 and 360.
             * @param {Number} degrees
             * @returns {Number} Degrees between 0 and 360.
             */
            limit_degrees: function (degrees) {
                var limited;
                degrees /= 360.0;
                limited = 360.0 * (degrees - Math.floor(degrees));
                if (limited < 0) {
                    limited += 360.0;
                }
                return limited;
            },
            /**
             * Returns degrees limited to between -180 and +180.
             * @param {Number} degrees
             * @returns {Number} Degrees between +/-180.
             * 
             */
            limit_degrees180pm: function (degrees) {
                var limited;
                degrees /= 360.0;
                limited = 360.0 * (degrees - Math.floor(degrees));
                if (limited < -180.0) {
                    limited += 360.0;
                } else if (limited > 180.0) {
                    limited -= 360.0;
                }
                return limited;
            },
            /**
             * Returns degrees limited to between 0 and +180.
             * @param {Number} degrees
             * @returns {Number} Degrees between 0 and 180.
             */
            limit_degrees180: function (degrees) {
                var limited;
                degrees /= 180.0;
                limited = 180.0 * (degrees - Math.floor(degrees));
                if (limited < 0) {
                    limited += 180.0;
                }
                return limited;
            },
            /**
             * Returns a value limited to its fractional component between 0 and 1.
             * @param {Number} value
             * @returns {Number}
             */
            limit_zero2one: function (value) {
                var limited;
                // XXX Suspect code! Not sure what the intention is for negative
                // numbers. The limited var will never be negative.
                limited = value - Math.floor(value);
                if (limited < 0) {
                    limited += 1.0;
                }
                return limited;
            },
            /**
             * Returns minutes limited to +/-1420.
             * @param {Number} minutes
             * @returns {Number}
             */
            limit_minutes: function (minutes) {
                var limited = minutes;
                if (limited < -20.0) {
                    limited += 1440.0;
                } else if (limited > 20.0) {
                    limited -= 1440.0;
                }
                return limited;
            },
            /**
             * Returns the local hour.
             * @param {Number} dayfrac
             * @param {Number} timezone
             * @returns {Number}
             */
            dayfrac_to_local_hr: function (dayfrac, timezone) {
                return 24.0 * this.limit_zero2one(dayfrac + timezone / 24.0);
            },
            /**
             * Returns a third order polynomial computed from the input params.
             * @param {Number} a
             * @param {Number} b
             * @param {Number} c
             * @param {Number} d
             * @param {Number} x
             * @returns {Number}
             */
            third_order_polynomial: function (a, b, c, d, x) {
                return ((a * x + b) * x + c) * x + d;
            },
            /**
             * Returns the Julian day computed from the input params.
             * @param {Number} year
             * @param {Number} month
             * @param {Number} day
             * @param {Number} hour
             * @param {Number} minute
             * @param {Number} second
             * @param {Number} tz
             * @returns {Number} The Julian day.
             */
            julian_day: function (year, month, day, hour, minute, second, tz) {
                var day_decimal, julian_day, a;
                day_decimal = day + (hour - tz + (minute + second / 60.0) / 60.0) / 24.0;
                if (month < 3) {
                    month += 12;
                    year--;
                }
                julian_day = Math.floor(365.25 * (year + 4716.0)) + Math.floor(30.6001 * (month + 1)) + day_decimal - 1524.5;
                if (julian_day > 2299160.0) {
                    a = Math.floor(year / 100);
                    julian_day += (2 - a + Math.floor(a / 4));
                }
                return julian_day;
            },
            /**
             * Returns the Julian centure from the Julian day.
             * @param {Number} jd Julian day.
             * @returns {Number} Julian century.
             */
            julian_century: function (jd) {
                return (jd - 2451545.0) / 36525.0;
            },
            /**
             * Returns the Julian ephemeris day from the Julian day and delta_t, 
             * the difference between earth rotation time and terrestrial time.
             * @param {Number} jd Julian day.
             * @param {Number} delta_t Difference between earth rotation time and terrestrial time.
             * @returns {Number} Julian ephemeris day.
             */
            julian_ephemeris_day: function (jd, delta_t) {
                return jd + delta_t / 86400.0;
            },
            /**
             * Returns the Julian ephemeris century for the 2000 standard epoch from 
             * the Julian ephemeris day.
             * @param {Number} jde Julian ephemeris day.
             * @returns {Number} Julian ephemeris century.
             */
            julian_ephemeris_century: function (jde) {
                return (jde - 2451545.0) / 36525.0;
            },
            /**
             * Returns the Julian ephemeris millennium for the 2000 standard epoch 
             * from the Julian ephemeris century.
             * @param {Number} jce Julian ephemeris day.
             * @returns {Number} Julian ephemeris century.
             */
            julian_ephemeris_millennium: function (jce) {
                return (jce / 10.0);
            },
            /**
             * Returns sum of earth periodic terms.
             * @param {Array} terms Array of periodic terms.
             * @param {Number} count Subcount of terms.
             * @param {Number} jme Julian ephermis millennium.
             * @returns {Number} Sum.
             */
            earth_periodic_term_summation: function (terms, count, jme) {
                var sum = 0;
                for (var i = 0; i < count; i++) {
                    sum += terms[i][this.TERM_A] * Math.cos(terms[i][this.TERM_B]
                        + terms[i][this.TERM_C] * jme);
                }
                return sum;
            },
            /**
             * Returns the earth values computed from the earth periodic terms.
             * @param {Number} term_sum Sum of the periodic terms.
             * @param {Number} count Count of terms.
             * @param {Number} jme Julian ephemeris millennium.
             * @returns {Number} Earth values
             */
            earth_values: function (term_sum, count, jme) {
                var sum = 0;
                for (var i = 0; i < count; i++) {
                    sum += term_sum[i] * Math.pow(jme, i);
                }
                sum /= 1.0e8;
                return sum;
            },
            /**
             * Returns the earth's heliocentric longitude on the celestial
             * sphere [degrees]. “Heliocentric” means that the Earth position 
             * is calculated with respect to the center of the sun.  
             * @param {Number} jme Julian ephemeris millennium.
             * @returns {Number} Heliocentic longitude [degrees].
             */
            earth_heliocentric_longitude: function (jme) {
                var sum = new Array(this.L_COUNT);
                for (var i = 0; i < this.L_COUNT; i++) {
                    sum[i] = this.earth_periodic_term_summation(this.L_TERMS[i], this.l_subcount[i], jme);
                }
                return this.limit_degrees(this.toDegrees(this.earth_values(sum, this.L_COUNT, jme)));
            },
            /**
             * Returns the earth's heliocentric latitude on the celestial
             * sphere [degrees]. “Heliocentric” means that the Earth position 
             * is calculated with respect to the center of the sun.  
             * @param {Number} jme Julian ephemeris millennium.
             * @returns {Number} Heliocentic latitude [degrees].
             */
            earth_heliocentric_latitude: function (jme) {
                var sum = new Array(this.B_COUNT);
                for (var i = 0; i < this.B_COUNT; i++) {
                    sum[i] = this.earth_periodic_term_summation(this.B_TERMS[i], this.b_subcount[i], jme);
                }
                return this.toDegrees(this.earth_values(sum, this.B_COUNT, jme));
            },
            /**
             * Returns the earth radius vector [Astronomical Units; AU] 
             * @param {Number} jme Julian ephemeris millennium.
             * @returns {Number} Earth radius vector [AU].
             */
            earth_radius_vector: function (jme) {
                var sum = new Array(this.R_COUNT);
                for (var i = 0; i < this.R_COUNT; i++) {
                    sum[i] = this.earth_periodic_term_summation(this.R_TERMS[i], this.r_subcount[i], jme);
                }
                return this.earth_values(sum, this.R_COUNT, jme);
            },
            /**
             * Returns the geocentric longitude: the sun position calculated 
             * with respect to the Earth center. 
             * @param {Number} l Earth heliocentric longitude.
             * @returns {Number} Earth geocentric longitude.
             */
            geocentric_longitude: function (l) {
                var theta = l + 180.0;
                if (theta >= 360.0) {
                    theta -= 360.0;
                }
                return theta;
            },
            /**
             * Returns the geocentric latitude: the sun position calculated 
             * with respect to the Earth center. 
             * @param {Number} b Earth heliocentric latitude.
             * @returns {Number} Earth geocentric latitude.
             */
            geocentric_latitude: function (b) {
                return -b;
            },
            /**
             * 
             * @param {Number} jce
             * @returns {Number}
             */
            mean_elongation_moon_sun: function (jce) {
                return this.third_order_polynomial(1.0 / 189474.0, -0.0019142, 445267.11148, 297.85036, jce);
            },
            /**
             * 
             * @param {Number} jce
             * @returns {Number}
             */
            mean_anomaly_sun: function (jce) {
                return this.third_order_polynomial(-1.0 / 300000.0, -0.0001603, 35999.05034, 357.52772, jce);
            },
            /**
             * 
             * @param {Number} jce
             * @returns {Number}
             */
            mean_anomaly_moon: function (jce) {
                return this.third_order_polynomial(1.0 / 56250.0, 0.0086972, 477198.867398, 134.96298, jce);
            },
            /**
             * 
             * @param {Number} jce
             * @returns {Number}
             */
            argument_latitude_moon: function (jce) {
                return this.third_order_polynomial(1.0 / 327270.0, -0.0036825, 483202.017538, 93.27191, jce);
            },
            /**
             * 
             * @param {Number} jce
             * @returns {Number}
             */
            ascending_longitude_moon: function (jce) {
                return this.third_order_polynomial(1.0 / 450000.0, 0.0020708, -1934.136261, 125.04452, jce);
            },
            /**
             * 
             * @param {Number} i
             * @param {Number} x
             * @returns {Number}
             */
            xy_term_summation: function (i, x) {
                var sum = 0;
                for (var j = 0; j < this.TERM_Y_COUNT; j++) {
                    sum += x[j] * this.Y_TERMS[i][j];
                }
                return sum;
            },
            /**
             *
             * @param {Number} jce Julian ephemeris millennium
             * @param {Array} x [mean_elongation_moon_sun, mean_anomaly_sun, mean_anomaly_moon,
             * argument_latitude_moon, ascending_longitude_moon]
             * @return {Array} {nutation longitude, nutation obliquity} [degrees]
             */
            nutation_longitude_and_obliquity: function (jce, x) {
                var xy_term_sum, sum_psi = 0, sum_epsilon = 0;
                for (var i = 0; i < this.Y_COUNT; i++) {
                    xy_term_sum = this.toRadians(this.xy_term_summation(i, x));
                    sum_psi += (this.PE_TERMS[i][this.TERM_PSI_A] + jce * this.PE_TERMS[i][this.TERM_PSI_B]) * Math.sin(xy_term_sum);
                    sum_epsilon += (this.PE_TERMS[i][this.TERM_EPS_C] + jce * this.PE_TERMS[i][this.TERM_EPS_D]) * Math.cos(xy_term_sum);
                }
                var del_psi = sum_psi / 36000000.0;          // nutation longitude [degrees]         
                var del_epsilon = sum_epsilon / 36000000.0;  // nutation obliquity [degrees] 
                return [del_psi, del_epsilon];
            },
            /**
             * 
             * @param {Number} jme
             * @returns {Number}
             */
            ecliptic_mean_obliquity: function (jme) {
                var u = jme / 10.0;
                return 84381.448 + u * (-4680.96 + u * (-1.55 + u * (1999.25 + u * (-51.38 + u * (-249.67
                    + u * (-39.05 + u * (7.12 + u * (27.87 + u * (5.79 + u * 2.45)))))))));
            },
            /**
             * 
             * @param {Number} delta_epsilon
             * @param {Number} epsilon0
             * @returns {Number}
             */
            ecliptic_true_obliquity: function (delta_epsilon, epsilon0) {
                return delta_epsilon + epsilon0 / 3600.0;
            },
            /**
             * 
             * @param {Number} r
             * @returns {Number}
             */
            aberration_correction: function (r) {
                return -20.4898 / (3600.0 * r);
            },
            /** 
             * Calculate the apparent sun longitude, lamda [in degrees]. 
             * @param {Number} theta
             * @param {Number} delta_psi
             * @param {Number} delta_tau
             * @returns {Number}
             */
            apparent_sun_longitude: function (theta, delta_psi, delta_tau) {
                return theta + delta_psi + delta_tau;
            },
            /**
             * 
             * @param {Number} jd
             * @param {Number} jc
             * @returns {Number}
             */
            greenwich_mean_sidereal_time: function (jd, jc) {
                return this.limit_degrees(280.46061837 + 360.98564736629 * (jd - 2451545.0)
                    + jc * jc * (0.000387933 - jc / 38710000.0));
            },
            /**
             * 
             * @param {Number} nu0
             * @param {Number} delta_psi
             * @param {Number} epsilon
             * @returns {Number}
             */
            greenwich_sidereal_time: function (nu0, delta_psi, epsilon) {
                return nu0 + delta_psi * Math.cos(this.toRadians(epsilon));
            },
            /**
             * 
             * @param {Number} lamda
             * @param {Number} epsilon
             * @param {Number} beta
             * @returns {Number}
             */
            geocentric_sun_right_ascension: function (lamda, epsilon, beta) {
                var lamda_rad = this.toRadians(lamda);
                var epsilon_rad = this.toRadians(epsilon);
                return this.limit_degrees(this.toDegrees(Math.atan2(Math.sin(lamda_rad) * Math.cos(epsilon_rad)
                    - Math.tan(this.toRadians(beta)) * Math.sin(epsilon_rad), Math.cos(lamda_rad))));
            },
            /**
             * 
             * @param {Number} beta
             * @param {Number} epsilon
             * @param {Number} lamda
             * @returns {Number}
             */
            geocentric_sun_declination: function (beta, epsilon, lamda) {
                var beta_rad = this.toRadians(beta);
                var epsilon_rad = this.toRadians(epsilon);
                return this.toDegrees(Math.asin(Math.sin(beta_rad) * Math.cos(epsilon_rad)
                    + Math.cos(beta_rad) * Math.sin(epsilon_rad) * Math.sin(this.toRadians(lamda))));
            },
            /**
             * 
             * @param {Number} nu
             * @param {Number} longitude
             * @param {Number} alpha_deg
             * @returns {Number}
             */
            observer_hour_angle: function (nu, longitude, alpha_deg) {
                return this.limit_degrees(nu + longitude - alpha_deg);
            },
            /**
             * 
             * @param {Number} r
             * @returns {Number}
             */
            sun_equatorial_horizontal_parallax: function (r) {
                return 8.794 / (3600.0 * r);
            },
            /**
             * 
             * @param {Number} latitude
             * @param {Number} elevation
             * @param {Number} xi
             * @param {Number} h
             * @param {Number} delta
             * @returns {Array}
             */
            sun_right_ascension_parallax_and_topocentric_dec: function (latitude, elevation,
                xi, h, delta) {
                var lat_rad = this.toRadians(latitude);
                var xi_rad = this.toRadians(xi);
                var h_rad = this.toRadians(h);
                var delta_rad = this.toRadians(delta);
                var u = Math.atan(0.99664719 * Math.tan(lat_rad));
                var y = 0.99664719 * Math.sin(u) + elevation * Math.sin(lat_rad) / 6378140.0;
                var x = Math.cos(u) + elevation * Math.cos(lat_rad) / 6378140.0;
                var delta_alpha_rad = Math.atan2(-x * Math.sin(xi_rad) * Math.sin(h_rad),
                    Math.cos(delta_rad) - x * Math.sin(xi_rad) * Math.cos(h_rad));
                var delta_prime = this.toDegrees(Math.atan2((Math.sin(delta_rad) - y * Math.sin(xi_rad)) * Math.cos(delta_alpha_rad),
                    Math.cos(delta_rad) - x * Math.sin(xi_rad) * Math.cos(h_rad)));
                var delta_alpha = this.toDegrees(delta_alpha_rad);
                return [delta_alpha, delta_prime];
            },
            /**
             * 
             * @param {Number} alpha_deg
             * @param {Number} delta_alpha
             * @returns {Number}
             */
            topocentric_sun_right_ascension: function (alpha_deg, delta_alpha) {
                return alpha_deg + delta_alpha;
            },
            /**
             * 
             * @param {Number} h
             * @param {Number} delta_alpha
             * @returns {Number}
             */
            topocentric_local_hour_angle: function (h, delta_alpha) {
                return h - delta_alpha;
            },
            /**
             * 
             * @param {Number} latitude
             * @param {Number} delta_prime
             * @param {Number} h_prime
             * @returns {Number}
             */
            topocentric_elevation_angle: function (latitude, delta_prime, h_prime) {
                var lat_rad = this.toRadians(latitude);
                var delta_prime_rad = this.toRadians(delta_prime);
                return this.toDegrees(Math.asin(Math.sin(lat_rad) * Math.sin(delta_prime_rad)
                    + Math.cos(lat_rad) * Math.cos(delta_prime_rad) * Math.cos(this.toRadians(h_prime))));
            },
            /**
             * 
             * @param {Number} pressure
             * @param {Number} temperature
             * @param {Number} atmos_refract
             * @param {Number} e0
             * @returns {Number}
             */
            atmospheric_refraction_correction: function (pressure, temperature,
                atmos_refract, e0) {
                var del_e = 0;
                if (e0 >= -1 * (this.SUN_RADIUS + atmos_refract)) {
                    del_e = (pressure / 1010.0) * (283.0 / (273.0 + temperature))
                        * 1.02 / (60.0 * Math.tan(this.toRadians(e0 + 10.3 / (e0 + 5.11))));
                }
                return del_e;
            },
            /**
             * 
             * @param {Number} e0
             * @param {Number} delta_e
             * @returns {Number}
             */
            topocentric_elevation_angle_corrected: function (e0, delta_e) {
                return e0 + delta_e;
            },
            /**
             * 
             * @param {Number} e
             * @returns {Number}
             */
            topocentric_zenith_angle: function (e) {
                return 90.0 - e;
            },
            /**
             * 
             * @param {Number} h_prime
             * @param {Number} latitude
             * @param {Number} delta_prime
             * @returns {Number}
             */
            topocentric_azimuth_angle_neg180_180: function (h_prime, latitude, delta_prime) {
                var h_prime_rad = this.toRadians(h_prime);
                var lat_rad = this.toRadians(latitude);
                return this.toDegrees(Math.atan2(Math.sin(h_prime_rad),
                    Math.cos(h_prime_rad) * Math.sin(lat_rad)
                    - Math.tan(this.toRadians(delta_prime)) * Math.cos(lat_rad)));
            },
            /**
             * 
             * @param {Number} azimuth180
             * @returns {Number}
             */
            topocentric_azimuth_angle_zero_360: function (azimuth180) {
                return azimuth180 + 180.0;
            },
            /**
             * 
             * @param {Number} zenith
             * @param {Number} azimuth180
             * @param {Number} azm_rotation
             * @param {Number} slope
             * @returns {Number}
             */
            surface_incidence_angle: function (zenith, azimuth180, azm_rotation, slope) {
                var zenith_rad = this.toRadians(zenith);
                var slope_rad = this.toRadians(slope);
                return this.toDegrees(Math.acos(Math.cos(zenith_rad) * Math.cos(slope_rad)
                    + Math.sin(slope_rad)
                    * Math.sin(zenith_rad) * Math.cos(this.toRadians(azimuth180 - azm_rotation))));
            },
            /**
             * 
             * @param {Number} jme
             * @returns {Number}
             */
            sun_mean_longitude: function (jme) {
                return this.limit_degrees(280.4664567 + jme * (360007.6982779 + jme * (0.03032028
                    + jme * (1 / 49931.0 + jme * (-1 / 15300.0 + jme * (-1 / 2000000.0))))));
            },
            /**
             * 
             * @param {Number} m
             * @param {Number} alpha
             * @param {Number} del_psi
             * @param {Number} epsilon
             * @returns {Number}
             */
            eot: function (m, alpha, del_psi, epsilon) {
                return this.limit_minutes(4.0 * (m - 0.0057183 - alpha + del_psi * Math.cos(this.toRadians(epsilon))));
            },
            /**
             * 
             * @param {Number} alpha_zero
             * @param {Number} longitude
             * @param {Number} nu
             * @returns {Number}
             */
            approx_sun_transit_time: function (alpha_zero, longitude, nu) {
                return (alpha_zero - longitude - nu) / 360.0;
            },
            /**
             * 
             * @param {Number} latitude
             * @param {Number} delta_zero
             * @param {Number} h0_prime
             * @returns {Number}
             */
            sun_hour_angle_at_rise_set: function (latitude, delta_zero, h0_prime) {
                var h0 = -99999;
                var latitude_rad = this.toRadians(latitude);
                var delta_zero_rad = this.toRadians(delta_zero);
                var argument = (Math.sin(this.toRadians(h0_prime)) - Math.sin(latitude_rad) * Math.sin(delta_zero_rad))
                    / (Math.cos(latitude_rad) * Math.cos(delta_zero_rad));
                if (Math.abs(argument) <= 1) {
                    h0 = this.limit_degrees180(this.toDegrees(Math.acos(argument)));
                }
                return h0;
            },
            /**
             * 
             * @param {Number} m_rts
             * @param {Number} h0
             * @returns {Number}
             */
            approx_sun_rise_and_set: function (m_rts, h0) {
                var h0_dfrac = h0 / 360.0;
                m_rts[this.SUN_RISE] = this.limit_zero2one(m_rts[this.SUN_TRANSIT] - h0_dfrac);
                m_rts[this.SUN_SET] = this.limit_zero2one(m_rts[this.SUN_TRANSIT] + h0_dfrac);
                m_rts[this.SUN_TRANSIT] = this.limit_zero2one(m_rts[this.SUN_TRANSIT]);
            },
            /**
             * 
             * @param {Number} ad
             * @param {Number} n
             * @returns {Number}
             */
            rts_alpha_delta_prime: function (ad, n) {
                var a = ad[this.JD_ZERO] - ad[this.JD_MINUS];
                var b = ad[this.JD_PLUS] - ad[this.JD_ZERO];
                if (Math.abs(a) >= 2.0) {
                    a = this.limit_zero2one(a);
                }
                if (Math.abs(b) >= 2.0) {
                    b = this.limit_zero2one(b);
                }
                return ad[this.JD_ZERO] + n * (a + b + (b - a) * n) / 2.0;
            },
            /**
             * 
             * @param {Number} latitude
             * @param {Number} delta_prime
             * @param {Number} h_prime
             * @returns {Number}
             */
            rts_sun_altitude: function (latitude, delta_prime, h_prime) {
                var latitude_rad = this.toRadians(latitude);
                var delta_prime_rad = this.toRadians(delta_prime);
                return this.toDegrees(Math.asin(Math.sin(latitude_rad) * Math.sin(delta_prime_rad)
                    + Math.cos(latitude_rad) * Math.cos(delta_prime_rad) * Math.cos(this.toRadians(h_prime))));
            },
            /**
             * 
             * @param {Number} m_rts
             * @param {Number} h_rts
             * @param {Number} delta_prime
             * @param {Number} latitude
             * @param {Number} h_prime
             * @param {Number} h0_prime
             * @param {Number} sun
             * @returns {Number}
             */
            sun_rise_and_set: function (m_rts, h_rts, delta_prime, latitude,
                h_prime, h0_prime, sun) {
                return m_rts[sun] + (h_rts[sun] - h0_prime)
                    / (360.0 * Math.cos(this.toRadians(delta_prime[sun])) * Math.cos(this.toRadians(latitude))
                    * Math.sin(this.toRadians(h_prime[sun])));
            },
            /**
             * Calculate required SolarPositionAlgorithms parameters to get the right ascension (alpha) and declination (delta).
             *
             * Precondition: JD must be already calculated and in structure.
             * @param {SolarData} spa
             * @returns {SolarData}
             */
            calculate_geocentric_sun_right_ascension_and_declination: function (spa) {
                var x = new Array(this.TERM_X_COUNT);

                spa.jc = this.julian_century(spa.jd);
                spa.jde = this.julian_ephemeris_day(spa.jd, spa.delta_t);
                spa.jce = this.julian_ephemeris_century(spa.jde);
                spa.jme = this.julian_ephemeris_millennium(spa.jce);
                spa.l = this.earth_heliocentric_longitude(spa.jme);
                spa.b = this.earth_heliocentric_latitude(spa.jme);
                spa.r = this.earth_radius_vector(spa.jme);
                spa.theta = this.geocentric_longitude(spa.l);
                spa.beta = this.geocentric_latitude(spa.b);
                x[this.TERM_X0] = spa.x0 = this.mean_elongation_moon_sun(spa.jce);
                x[this.TERM_X1] = spa.x1 = this.mean_anomaly_sun(spa.jce);
                x[this.TERM_X2] = spa.x2 = this.mean_anomaly_moon(spa.jce);
                x[this.TERM_X3] = spa.x3 = this.argument_latitude_moon(spa.jce);
                x[this.TERM_X4] = spa.x4 = this.ascending_longitude_moon(spa.jce);
                var result = this.nutation_longitude_and_obliquity(spa.jce, x);
                spa.del_psi = result[0];
                spa.del_epsilon = result[1];
                spa.epsilon0 = this.ecliptic_mean_obliquity(spa.jme);
                spa.epsilon = this.ecliptic_true_obliquity(spa.del_epsilon, spa.epsilon0);
                spa.del_tau = this.aberration_correction(spa.r);
                spa.lamda = this.apparent_sun_longitude(spa.theta, spa.del_psi, spa.del_tau);
                spa.nu0 = this.greenwich_mean_sidereal_time(spa.jd, spa.jc);
                spa.nu = this.greenwich_sidereal_time(spa.nu0, spa.del_psi, spa.epsilon);
                spa.alpha = this.geocentric_sun_right_ascension(spa.lamda, spa.epsilon, spa.beta);
                spa.delta = this.geocentric_sun_declination(spa.beta, spa.epsilon, spa.lamda);

                return spa;
            },
            /**
             * Calculate Equation of Time (EOT) and Sun Rise, Transit, & Set (RTS)
             * 
             * @param {SolarData} spa
             * @returns {SolarData}
             */
            calculate_eot_and_sun_rise_transit_set: function (spa) {
                var sun_rts = new SolarData().copy(spa);
                var nu, m, h0, n;
                var alpha = new Array(this.JD_COUNT);
                var delta = new Array(this.JD_COUNT);
                var m_rts = new Array(this.SUN_COUNT);
                var nu_rts = new Array(this.SUN_COUNT);
                var h_rts = new Array(this.SUN_COUNT);
                var alpha_prime = new Array(this.SUN_COUNT);
                var delta_prime = new Array(this.SUN_COUNT);
                var h_prime = new Array(this.SUN_COUNT);
                var h0_prime = -1 * (this.SUN_RADIUS + spa.atmos_refract);

                m = this.sun_mean_longitude(spa.jme);
                spa.eot = this.eot(m, spa.alpha, spa.del_psi, spa.epsilon);

                sun_rts.hour = sun_rts.minute = sun_rts.second = 0;
                sun_rts.timezone = 0.0;
                sun_rts.jd = this.julian_day(sun_rts.year, sun_rts.month, sun_rts.day,
                    sun_rts.hour, sun_rts.minute, sun_rts.second, sun_rts.timezone);
                this.calculate_geocentric_sun_right_ascension_and_declination(sun_rts);
                nu = sun_rts.nu;
                sun_rts.delta_t = 0;
                sun_rts.jd--;
                for (var i = 0; i < this.JD_COUNT; i++) {
                    this.calculate_geocentric_sun_right_ascension_and_declination(sun_rts);
                    alpha[i] = sun_rts.alpha;
                    delta[i] = sun_rts.delta;
                    sun_rts.jd++;
                }
                m_rts[this.SUN_TRANSIT] = this.approx_sun_transit_time(alpha[this.JD_ZERO], spa.longitude, nu);
                h0 = this.sun_hour_angle_at_rise_set(spa.latitude, delta[this.JD_ZERO], h0_prime);
                if (h0 >= 0) {
                    this.approx_sun_rise_and_set(m_rts, h0);
                    for (var j = 0; j < this.SUN_COUNT; j++) {
                        nu_rts[j] = nu + 360.985647 * m_rts[j];
                        n = m_rts[j] + spa.delta_t / 86400.0;
                        alpha_prime[j] = this.rts_alpha_delta_prime(alpha, n);
                        delta_prime[j] = this.rts_alpha_delta_prime(delta, n);
                        h_prime[j] = this.limit_degrees180pm(nu_rts[j] + spa.longitude - alpha_prime[j]);
                        h_rts[j] = this.rts_sun_altitude(spa.latitude, delta_prime[j], h_prime[j]);
                    }
                    spa.srha = h_prime[this.SUN_RISE];
                    spa.ssha = h_prime[this.SUN_SET];
                    spa.sta = h_rts[this.SUN_TRANSIT];
                    spa.suntransit = this.dayfrac_to_local_hr(m_rts[this.SUN_TRANSIT] - h_prime[this.SUN_TRANSIT] / 360.0,
                        spa.timezone);
                    spa.sunrise = this.dayfrac_to_local_hr(
                        this.sun_rise_and_set(m_rts, h_rts, delta_prime, spa.latitude, h_prime, h0_prime, this.SUN_RISE),
                        spa.timezone);
                    spa.sunset = this.dayfrac_to_local_hr(
                        this.sun_rise_and_set(m_rts, h_rts, delta_prime, spa.latitude, h_prime, h0_prime, this.SUN_SET),
                        spa.timezone);
                } else {
                    spa.srha = spa.ssha = spa.sta = spa.suntransit = spa.sunrise = spa.sunset = -99999;
                }
            },
            /**
             * Calculate all SolarPositionAlgorithms parameters and put into structure.
             *
             * Prerequisite: All inputs values (listed in header file) must already be in structure.
             * 
             * @param {SolarData} spa
             * @returns {SolarData}
             */
            calculate: function (spa) {
                //validate_inputs();
                spa.jd = this.julian_day(spa.year, spa.month, spa.day,
                    spa.hour, spa.minute, spa.second, spa.timezone);
                this.calculate_geocentric_sun_right_ascension_and_declination(spa);
                spa.h = this.observer_hour_angle(spa.nu, spa.longitude, spa.alpha);
                spa.xi = this.sun_equatorial_horizontal_parallax(spa.r);
                var result = this.sun_right_ascension_parallax_and_topocentric_dec(
                    spa.latitude, spa.elevation, spa.xi, spa.h, spa.delta);
                spa.del_alpha = result[0];
                spa.delta_prime = result[1];
                spa.alpha_prime = this.topocentric_sun_right_ascension(spa.alpha, spa.del_alpha);
                spa.h_prime = this.topocentric_local_hour_angle(spa.h, spa.del_alpha);
                spa.e0 = this.topocentric_elevation_angle(spa.latitude, spa.delta_prime, spa.h_prime);
                spa.del_e = this.atmospheric_refraction_correction(spa.pressure, spa.temperature, spa.atmos_refract, spa.e0);
                spa.e = this.topocentric_elevation_angle_corrected(spa.e0, spa.del_e);
                spa.zenith = this.topocentric_zenith_angle(spa.e);
                spa.azimuth180 = this.topocentric_azimuth_angle_neg180_180(spa.h_prime, spa.latitude, spa.delta_prime);
                spa.azimuth = this.topocentric_azimuth_angle_zero_360(spa.azimuth180);

//        if ((this.function == SPA_ZA_INC) || (this.function == SPA_ALL)) {
                spa.incidence = this.surface_incidence_angle(spa.zenith, spa.azimuth180, spa.azm_rotation, spa.slope);
//        }
//        if ((this.function == SPA_ZA_RTS) || (this.function == SPA_ALL)) {
                this.calculate_eot_and_sun_rise_transit_set(spa);
//        }
                return spa;
            }

        };
        // Make this object immutable to prevent corruption of terms and inputs.
        Object.freeze(SPA);

        return SPA;
    }
);
