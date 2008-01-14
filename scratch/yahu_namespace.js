/**
 * The DataSource utility provides a common configurable interface for widgets
 * to access a variety of data, from JavaScript arrays to online servers over
 * XHR.
 *
 * @namespace
 * @name YAHOO.util
 * @module datasource
 * @requires yahoo, event
 * @optional connection
 * @title DataSource Utility
 * @beta
 */

/**
 * The DataSource class defines and manages a live set of data for widgets to
 * interact with. Examples of live databases include in-memory
 * local data such as a JavaScript array, a JavaScript function, or JSON, or
 * remote data such as data retrieved through an XHR connection.
 *
 * @class DataSource
 * @uses YAHOO.util.EventProvider
 * @constructor
 * @param oLiveData {Object} Pointer to live database.
 * @param oConfigs {Object} (optional) Object literal of configuration values.
 */
YAHOO.util.DataSource = function(oLiveData, oConfigs) {
    // Set any config params passed in to override defaults
    if(oConfigs && (oConfigs.constructor == Object)) {
        for(var sConfig in oConfigs) {
            if(sConfig) {
                this[sConfig] = oConfigs[sConfig];
            }
        }
    }
}

/////////////////////////////////////////////////////////////////////////////
//
// Public methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Public accessor to the unique name of the DataSource instance.
 *
 * @method toString
 * @return {String} Unique name of the DataSource instance.
 */
YAHOO.util.DataSource.prototype.toString = function() {
    return this._sName;
};
