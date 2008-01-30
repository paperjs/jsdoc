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

// include ext-2.0 lib -- DISABLED
//IO.include('lib/JSDOC/resistor/ext-2.0/init.js');

// includes a new Plugin manager.  This plugin Manager is implemented into
// LARGELY DISABLED SINCE I REMOVED EXT
// JSDOC's lib/Parser.js.  a bit hackish, but not too bad.
IO.include("lib/JSDOC/resistor/PluginMgr.js");


