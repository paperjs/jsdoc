/***
 * @overview include Ext core libraries
 * @author Chris Scott
 * 
 */

/***  
 * create some dummy objects to satisfy Ext.js
 * @author Chris Scott 
 */

var window = {
    
};
var navigator = {
    userAgent : 'linux'
};

var document = {
    compatMode: '',
    location: {
        href: 'localhost'
    }
};

/***
 * include core Ext libs.
 */

IO.include("lib/JSDOC/resistor/ext-2.0/Ext.js");
IO.include("lib/JSDOC/resistor/ext-2.0/Format.js");
IO.include("lib/JSDOC/resistor/ext-2.0/Template.js");
IO.include("lib/JSDOC/resistor/ext-2.0/XTemplate.js");
IO.include("lib/JSDOC/resistor/ext-2.0/JSON.js");
IO.include("lib/JSDOC/resistor/ext-2.0/Observable.js");
