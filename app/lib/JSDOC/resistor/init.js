/***
* @overview resistor-ext2 initialization
* includes some core Ext2 libs along with a new Plugin Manager.
* @author Chris Scott
*
*/

/***
 * @namespace JSDOC.resistor
 */
JSDOC.resistor = {};

// include ext-2.0 lib
IO.include('lib/JSDOC/resistor/ext-2.0/init.js');

// includes a new Ext-based Plugin manager.  This plugin Manager is implemented into
// JSDOC's lib/Parser.js.  a bit hackish, but not too bad.
IO.include("lib/JSDOC/resistor/PluginMgr.js");

/***
 * Add new valid ISA to JSDOC.Symbol (CONFIG & EVENT)
 */

JSDOC.Symbol.validKinds.push("CONFIG");
JSDOC.Symbol.validKinds.push("EVENT");

//= ["CONSTRUCTOR", "FILE", "VIRTUAL", "FUNCTION", "OBJECT", "VOID"];

