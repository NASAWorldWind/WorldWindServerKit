/*
 
 Colour.js
 
 Objects for handling and processing colours
 
 Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
 the terms of the CC0 1.0 Universal legal code:
 
 http://creativecommons.org/publicdomain/zero/1.0/legalcode
 
 */

/* An abstract Colour implementation. Concrete Colour implementations should use
 * an instance of this function as their prototype, and implement the getRGB and
 * getHSL functions. getRGB should return an object representing the RGB
 * components of this Colour, with the red, green, and blue components in the
 * range [0,255] and the alpha component in the range [0,100]. getHSL should
 * return an object representing the HSL components of this Colour, with the hue
 * component in the range [0,360), the saturation and lightness components in
 * the range [0,100], and the alpha component in the range [0,1].
 */
function Colour() {

    /* Returns an object representing the RGBA components of this Colour. The red,
     * green, and blue components are converted to integers in the range [0,255].
     * The alpha is a value in the range [0,1].
     */
    this.getIntegerRGB = function () {

        // get the RGB components of this colour
        var rgb = this.getRGB();

        // return the integer components
        return {
            'r': Math.round(rgb.r),
            'g': Math.round(rgb.g),
            'b': Math.round(rgb.b),
            'a': rgb.a
        };

    };

    /* Returns an object representing the RGBA components of this Colour. The red,
     * green, and blue components are converted to numbers in the range [0,100].
     * The alpha is a value in the range [0,1].
     */
    this.getPercentageRGB = function () {

        // get the RGB components of this colour
        var rgb = this.getRGB();

        // return the percentage components
        return {
            'r': 100 * rgb.r / 255,
            'g': 100 * rgb.g / 255,
            'b': 100 * rgb.b / 255,
            'a': rgb.a
        };

    };

    /* Returns a string representing this Colour as a CSS hexadecimal RGB colour
     * value - that is, a string of the form #RRGGBB where each of RR, GG, and BB
     * are two-digit hexadecimal numbers.
     */
    this.getCSSHexadecimalRGB = function () {

        // get the integer RGB components
        var rgb = this.getIntegerRGB();

        // determine the hexadecimal equivalents
        var r16 = rgb.r.toString(16);
        var g16 = rgb.g.toString(16);
        var b16 = rgb.b.toString(16);

        // return the CSS RGB colour value
        return '#'
            + (r16.length == 2 ? r16 : '0' + r16)
            + (g16.length == 2 ? g16 : '0' + g16)
            + (b16.length == 2 ? b16 : '0' + b16);

    };

    /* Returns a string representing this Colour as a CSS integer RGB colour
     * value - that is, a string of the form rgb(r,g,b) where each of r, g, and b
     * are integers in the range [0,255].
     */
    this.getCSSIntegerRGB = function () {

        // get the integer RGB components
        var rgb = this.getIntegerRGB();

        // return the CSS RGB colour value
        return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';

    };

    /* Returns a string representing this Colour as a CSS integer RGBA colour
     * value - that is, a string of the form rgba(r,g,b,a) where each of r, g, and
     * b are integers in the range [0,255] and a is in the range [0,1].
     */
    this.getCSSIntegerRGBA = function () {

        // get the integer RGB components
        var rgb = this.getIntegerRGB();

        // return the CSS integer RGBA colour value
        return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + rgb.a + ')';

    };

    /* Returns a string representing this Colour as a CSS percentage RGB colour
     * value - that is, a string of the form rgb(r%,g%,b%) where each of r, g, and
     * b are in the range [0,100].
     */
    this.getCSSPercentageRGB = function () {

        // get the percentage RGB components
        var rgb = this.getPercentageRGB();

        // return the CSS RGB colour value
        return 'rgb(' + rgb.r + '%,' + rgb.g + '%,' + rgb.b + '%)';

    };

    /* Returns a string representing this Colour as a CSS percentage RGBA colour
     * value - that is, a string of the form rgba(r%,g%,b%,a) where each of r, g,
     * and b are in the range [0,100] and a is in the range [0,1].
     */
    this.getCSSPercentageRGBA = function () {

        // get the percentage RGB components
        var rgb = this.getPercentageRGB();

        // return the CSS percentage RGBA colour value
        return 'rgba(' + rgb.r + '%,' + rgb.g + '%,' + rgb.b + '%,' + rgb.a + ')';

    };

    /* Returns a string representing this Colour as a CSS HSL colour value - that
     * is, a string of the form hsl(h,s%,l%) where h is in the range [0,360) and
     * s and l are in the range [0,100].
     */
    this.getCSSHSL = function () {

        // get the HSL components
        var hsl = this.getHSL();

        // return the CSS HSL colour value
        return 'hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)';

    };

    /* Returns a string representing this Colour as a CSS HSLA colour value - that
     * is, a string of the form hsla(h,s%,l%,a) where h is in the range [0,360),
     * s and l are in the range [0,100], and a is in the range [0,1].
     */
    this.getCSSHSLA = function () {

        // get the HSL components
        var hsl = this.getHSL();

        // return the CSS HSL colour value
        return 'hsla(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%,' + hsl.a + ')';

    };

    /* Sets the colour of the specified node to this Colour. This function sets
     * the CSS 'color' property for the node. The parameter is:
     *
     * node - the node whose colour should be set
     */
    this.setNodeColour = function (node) {

        // set the colour of the node
        node.style.color = this.getCSSHexadecimalRGB();

    };

    /* Sets the background colour of the specified node to this Colour. This
     * function sets the CSS 'background-color' property for the node. The
     * parameter is:
     *
     * node - the node whose background colour should be set
     */
    this.setNodeBackgroundColour = function (node) {

        // set the background colour of the node
        node.style.backgroundColor = this.getCSSHexadecimalRGB();

    };

}

/* Creates a colour specified in the RGB colour space, with an optional alpha
 * component. The parameters are:
 *
 * r - the red component, clipped to the range [0,255]
 * g - the green component, clipped to the range [0,255]
 * b - the blue component, clipped to the range [0,255]
 * a - the alpha component, clipped to the range [0,1] - this parameter is
 *     optional and defaults to 1
 */
RGBColour.prototype = new Colour();
function RGBColour(r, g, b, a) {

    // store the alpha component after clipping it if necessary
    var alpha = (a === undefined ? 1 : Math.max(0, Math.min(1, a)));

    // store the RGB components after clipping them if necessary
    var rgb =
        {
            'r': Math.max(0, Math.min(255, r)),
            'g': Math.max(0, Math.min(255, g)),
            'b': Math.max(0, Math.min(255, b))
        };

    // initialise the HSV and HSL components to null
    var hsv = null;
    var hsl = null;

    /* Returns the HSV or HSL hue component of this RGBColour. The hue is in the
     * range [0,360). The parameters are:
     *
     * maximum - the maximum of the RGB component values
     * range   - the range of the RGB component values
     */
    function getHue(maximum, range) {

        // check whether the range is zero
        if (range == 0) {

            // set the hue to zero (any hue is acceptable as the colour is grey)
            var hue = 0;

        } else {

            // determine which of the components has the highest value and set the hue
            switch (maximum) {

                // red has the highest value
                case rgb.r:
                    var hue = (rgb.g - rgb.b) / range * 60;
                    if (hue < 0)
                        hue += 360;
                    break;

                    // green has the highest value
                case rgb.g:
                    var hue = (rgb.b - rgb.r) / range * 60 + 120;
                    break;

                    // blue has the highest value
                case rgb.b:
                    var hue = (rgb.r - rgb.g) / range * 60 + 240;
                    break;

            }

        }

        // return the hue
        return hue;

    }

    /* Calculates and stores the HSV components of this RGBColour so that they can
     * be returned be the getHSV function.
     */
    function calculateHSV() {

        // get the maximum and range of the RGB component values
        var maximum = Math.max(rgb.r, rgb.g, rgb.b);
        var range = maximum - Math.min(rgb.r, rgb.g, rgb.b);

        // store the HSV components
        hsv =
            {
                'h': getHue(maximum, range),
                's': (maximum == 0 ? 0 : 100 * range / maximum),
                'v': maximum / 2.55
            };

    }

    /* Calculates and stores the HSL components of this RGBColour so that they can
     * be returned be the getHSL function.
     */
    function calculateHSL() {

        // get the maximum and range of the RGB component values
        var maximum = Math.max(rgb.r, rgb.g, rgb.b);
        var range = maximum - Math.min(rgb.r, rgb.g, rgb.b);

        // determine the lightness in the range [0,1]
        var l = maximum / 255 - range / 510;

        // store the HSL components
        hsl =
            {
                'h': getHue(maximum, range),
                's': (range == 0 ? 0 : range / 2.55 / (l < 0.5 ? l * 2 : 2 - l * 2)),
                'l': 100 * l
            };

    }

    /* Returns the RGB and alpha components of this RGBColour as an object with r,
     * g, b, and a properties. r, g, and b are in the range [0,255] and a is in
     * the range [0,1].
     */
    this.getRGB = function () {

        // return the RGB components
        return {
            'r': rgb.r,
            'g': rgb.g,
            'b': rgb.b,
            'a': alpha
        };

    };

    /* Returns the HSV and alpha components of this RGBColour as an object with h,
     * s, v, and a properties. h is in the range [0,360), s and v are in the range
     * [0,100], and a is in the range [0,1].
     */
    this.getHSV = function () {

        // calculate the HSV components if necessary
        if (hsv == null)
            calculateHSV();

        // return the HSV components
        return {
            'h': hsv.h,
            's': hsv.s,
            'v': hsv.v,
            'a': alpha
        };

    };

    /* Returns the HSL and alpha components of this RGBColour as an object with h,
     * s, l, and a properties. h is in the range [0,360), s and l are in the range
     * [0,100], and a is in the range [0,1].
     */
    this.getHSL = function () {

        // calculate the HSV components if necessary
        if (hsl == null)
            calculateHSL();

        // return the HSL components
        return {
            'h': hsl.h,
            's': hsl.s,
            'l': hsl.l,
            'a': alpha
        };

    };

}

/* Creates a colour specified in the HSV colour space, with an optional alpha
 * component. The parameters are:
 *
 * h - the hue component, wrapped to the range [0,360)
 * s - the saturation component, clipped to the range [0,100]
 * v - the value component, clipped to the range [0,100]
 * a - the alpha component, clipped to the range [0,1] - this parameter is
 *     optional and defaults to 1
 */
HSVColour.prototype = new Colour();
function HSVColour(h, s, v, a) {

    // store the alpha component after clipping it if necessary
    var alpha = (a === undefined ? 1 : Math.max(0, Math.min(1, a)));

    // store the HSV components after clipping or wrapping them if necessary
    var hsv =
        {
            'h': (h % 360 + 360) % 360,
            's': Math.max(0, Math.min(100, s)),
            'v': Math.max(0, Math.min(100, v))
        };

    // initialise the RGB and HSL components to null
    var rgb = null;
    var hsl = null;

    /* Calculates and stores the RGB components of this HSVColour so that they can
     * be returned be the getRGB function.
     */
    function calculateRGB() {

        // check whether the saturation is zero
        if (hsv.s == 0) {

            // set the colour to the appropriate shade of grey
            var r = hsv.v;
            var g = hsv.v;
            var b = hsv.v;

        } else {

            // set some temporary values
            var f = hsv.h / 60 - Math.floor(hsv.h / 60);
            var p = hsv.v * (1 - hsv.s / 100);
            var q = hsv.v * (1 - hsv.s / 100 * f);
            var t = hsv.v * (1 - hsv.s / 100 * (1 - f));

            // set the RGB colour components to their temporary values
            switch (Math.floor(hsv.h / 60)) {
                case 0:
                    var r = hsv.v;
                    var g = t;
                    var b = p;
                    break;
                case 1:
                    var r = q;
                    var g = hsv.v;
                    var b = p;
                    break;
                case 2:
                    var r = p;
                    var g = hsv.v;
                    var b = t;
                    break;
                case 3:
                    var r = p;
                    var g = q;
                    var b = hsv.v;
                    break;
                case 4:
                    var r = t;
                    var g = p;
                    var b = hsv.v;
                    break;
                case 5:
                    var r = hsv.v;
                    var g = p;
                    var b = q;
                    break;
            }

        }

        // store the RGB components
        rgb =
            {
                'r': r * 2.55,
                'g': g * 2.55,
                'b': b * 2.55
            };

    }

    /* Calculates and stores the HSL components of this HSVColour so that they can
     * be returned be the getHSL function.
     */
    function calculateHSL() {

        // determine the lightness in the range [0,100]
        var l = (2 - hsv.s / 100) * hsv.v / 2;

        // store the HSL components
        hsl =
            {
                'h': hsv.h,
                's': hsv.s * hsv.v / (l < 50 ? l * 2 : 200 - l * 2),
                'l': l
            };

        // correct a division-by-zero error
        if (isNaN(hsl.s))
            hsl.s = 0;

    }

    /* Returns the RGB and alpha components of this HSVColour as an object with r,
     * g, b, and a properties. r, g, and b are in the range [0,255] and a is in
     * the range [0,1].
     */
    this.getRGB = function () {

        // calculate the RGB components if necessary
        if (rgb == null)
            calculateRGB();

        // return the RGB components
        return {
            'r': rgb.r,
            'g': rgb.g,
            'b': rgb.b,
            'a': alpha
        };

    };

    /* Returns the HSV and alpha components of this HSVColour as an object with h,
     * s, v, and a properties. h is in the range [0,360), s and v are in the range
     * [0,100], and a is in the range [0,1].
     */
    this.getHSV = function () {

        // return the HSV components
        return {
            'h': hsv.h,
            's': hsv.s,
            'v': hsv.v,
            'a': alpha
        };

    };

    /* Returns the HSL and alpha components of this HSVColour as an object with h,
     * s, l, and a properties. h is in the range [0,360), s and l are in the range
     * [0,100], and a is in the range [0,1].
     */
    this.getHSL = function () {

        // calculate the HSL components if necessary
        if (hsl == null)
            calculateHSL();

        // return the HSL components
        return {
            'h': hsl.h,
            's': hsl.s,
            'l': hsl.l,
            'a': alpha
        };

    };

}

/* Creates a colour specified in the HSL colour space, with an optional alpha
 * component. The parameters are:
 *
 * h - the hue component, wrapped to the range [0,360)
 * s - the saturation component, clipped to the range [0,100]
 * l - the lightness component, clipped to the range [0,100]
 * a - the alpha component, clipped to the range [0,1] - this parameter is
 *     optional and defaults to 1
 */
HSLColour.prototype = new Colour();
function HSLColour(h, s, l, a) {

    // store the alpha component after clipping it if necessary
    var alpha = (a === undefined ? 1 : Math.max(0, Math.min(1, a)));

    // store the HSL components after clipping or wrapping them if necessary
    var hsl =
        {
            'h': (h % 360 + 360) % 360,
            's': Math.max(0, Math.min(100, s)),
            'l': Math.max(0, Math.min(100, l))
        };

    // initialise the RGB and HSV components to null
    var rgb = null;
    var hsv = null;

    /* Calculates and stores the RGB components of this HSLColour so that they can
     * be returned be the getRGB function.
     */
    function calculateRGB() {

        // check whether the saturation is zero
        if (hsl.s == 0) {

            // store the RGB components representing the appropriate shade of grey
            rgb =
                {
                    'r': hsl.l * 2.55,
                    'g': hsl.l * 2.55,
                    'b': hsl.l * 2.55
                };

        } else {

            // set some temporary values
            var p = hsl.l < 50
                ? hsl.l * (1 + hsl.s / 100)
                : hsl.l + hsl.s - hsl.l * hsl.s / 100;
            var q = 2 * hsl.l - p;

            // initialise the RGB components
            rgb =
                {
                    'r': (h + 120) / 60 % 6,
                    'g': h / 60,
                    'b': (h + 240) / 60 % 6
                };

            // loop over the RGB components
            for (var key in rgb) {

                // ensure that the property is not inherited from the root object
                if (rgb.hasOwnProperty(key)) {

                    // set the component to its value in the range [0,100]
                    if (rgb[key] < 1) {
                        rgb[key] = q + (p - q) * rgb[key];
                    } else if (rgb[key] < 3) {
                        rgb[key] = p;
                    } else if (rgb[key] < 4) {
                        rgb[key] = q + (p - q) * (4 - rgb[key]);
                    } else {
                        rgb[key] = q;
                    }

                    // set the component to its value in the range [0,255]
                    rgb[key] *= 2.55;

                }

            }

        }

    }

    /* Calculates and stores the HSV components of this HSLColour so that they can
     * be returned be the getHSL function.
     */
    function calculateHSV() {

        // set a temporary value
        var t = hsl.s * (hsl.l < 50 ? hsl.l : 100 - hsl.l) / 100;

        // store the HSV components
        hsv =
            {
                'h': hsl.h,
                's': 200 * t / (hsl.l + t),
                'v': t + hsl.l
            };

        // correct a division-by-zero error
        if (isNaN(hsv.s))
            hsv.s = 0;

    }

    /* Returns the RGB and alpha components of this HSLColour as an object with r,
     * g, b, and a properties. r, g, and b are in the range [0,255] and a is in
     * the range [0,1].
     */
    this.getRGB = function () {

        // calculate the RGB components if necessary
        if (rgb == null)
            calculateRGB();

        // return the RGB components
        return {
            'r': rgb.r,
            'g': rgb.g,
            'b': rgb.b,
            'a': alpha
        };

    };

    /* Returns the HSV and alpha components of this HSLColour as an object with h,
     * s, v, and a properties. h is in the range [0,360), s and v are in the range
     * [0,100], and a is in the range [0,1].
     */
    this.getHSV = function () {

        // calculate the HSV components if necessary
        if (hsv == null)
            calculateHSV();

        // return the HSV components
        return {
            'h': hsv.h,
            's': hsv.s,
            'v': hsv.v,
            'a': alpha
        };

    };

    /* Returns the HSL and alpha components of this HSLColour as an object with h,
     * s, l, and a properties. h is in the range [0,360), s and l are in the range
     * [0,100], and a is in the range [0,1].
     */
    this.getHSL = function () {

        // return the HSL components
        return {
            'h': hsl.h,
            's': hsl.s,
            'l': hsl.l,
            'a': alpha
        };

    };

}
