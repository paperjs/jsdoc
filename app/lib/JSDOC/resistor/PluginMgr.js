/***
 * @class JSDOC.resistor.PluginMgr
 * @singleton 
 * @desc New event-based plugin manager singleton.  when a plugin is registered to it,
 * the plugin should provide a list of events it wishes to register.  PluginMgr is listening in
 * upon the TokenStream.  A plugin like prototype might specify an event of "Class.create".
 *  
 * @author Chris Scott
 * 
 */
JSDOC.resistor.PluginMgr = function() {
                    
    // create simple observable instance to fireEvents from and add plugins as listeners to.            
    var Antenna = function() {
        this.addEvents({
            
            /***
             * @event commentsrc
             * fires when a new JSDOC.DocComment is created      
             * @param {JSDOC.Doclet} doclet        
             */
            "commentsrc" : true,
            
            /***
             * @event commenttags             
             * fires when a new JSDOC.DocTag is created
             * @param {JSDOC.DocTag} doctag
             */
            "commenttags" : true
        });
    };        
    Ext.extend(Antenna, Ext.util.Observable);
    
    // antenna as in "radio antenna".  plugins can listen-in upon this Observable.  PluginManager will fire events through it.
    var _antenna = new Antenna();
            
    // PluginManager singleton methods....
    return {
                        
        /***
         * register
         * register a plugin with plugin manager.  each plugin will provide a hash of events it wishes to listen-to along
         * with the corresponding handler to call when each occurs.
         * eg: 
         * {
         *     commentsrc : function(param) { print("I want to know when a comment is created"); },
         *     Class.create : function(param) { print ("I want to know when the NAME Class.create is found in token-stream"); }
         * }   
         * NOTE: Ext.Observable doesn't like "." in event-names, so all event names will have "." replaced with "" and lower-cased.
         * eg: Class.create -> classcreate.
         *          
         */
        register : function(plugin, events) {                           
            for (var key in events) {
                var event = key.replace(/\./, '').toLowerCase();    // <-- normalize event-name to please Ext.Observalbe
                                                
                // add error-checking...make sure user-plugin return a valid function
                if (typeof(events[key]) != 'function') {
                    print("JSDOC.resistor.PluginMgr ERROR -- user plugin " + plugin.name + ' did not provide a valid handler for event " ' + key + '"');
                }
                else {
                    // add event-handler to PluginMgr's Observable object.
                    _antenna.addEvents({
                        event: true
                    });
                    
                    // register plugin as a listener on this event.                    
                    _antenna.on(event, events[key], plugin);
                }                                               
            }                                 
        },
        
        /***
         * onTokenStream
         * @param {String} name from token stream
         * @param {JSDOC.TokenStream} ts token stream                  
         */
        onTokenStream : function(name, ts) {                        
            this.fireEvent(name, {                
                name: name,
                ts: ts,                                                
            });
        },
        
        /***
         * onDocCommentSrc
         * @param {JSDOC.Doclet} doclet
         * fire 'doclet' event to give plugin listeners a chance to respond.          
         */
        onDocCommentSrc : function(comment) {
            //print ("PluginMgr::onDocCommentSrc");
            this.fireEvent('commentsrc', comment);                    
        },
        
        /***
         * onDocTag
         * @param {JSDOC.DocTag} doctag
         * fire the 'doctag' event to give plugins listeners a chace to repond.
         */
        onDocCommentTags : function(comment) {
            this.fireEvent('commenttags', comment);            
        },
        
        /***
         * hasListener
         * @desc Check to see if there are any event listeners on this name from TokenStream
         * @private
         * @param {String} name from token stream
         */
        hasListener : function(name) {
            
            // NOTE: Ext.Observable doesn't like Dot.In.Name -> dotinname               
            return _antenna.hasListener(name.replace(/\./, "").toLowerCase())
        },
        
        /***
         * fireEvent
         * fires the specified event after checking if there are any listeners for it.
         * @private
         * @param {Object} hook
         * @param {Boolean}
         */  
        fireEvent : function(name, param) {
            var event = name.replace(/\./, "").toLowerCase();                        
            if (_antenna.hasListener(event)) {
                //print('PluginMgr found listeners for event ' + event);
                _antenna.fireEvent(event, param);                    
            }            
        }                              
    }
}();

// register with existing PluginManager so it can participate with onDocCommentSrc / onDocCommentTags events
JSDOC.PluginManager.registerPlugin('resistor_pluginmgr', JSDOC.resistor.PluginMgr);

/***
 * @namespace JSDOC.plugins
 */
JSDOC.plugins = {};

/***
 * @class JSDOC.plugins.Base
 * Baseclass for all plugins.
 * @param {String} name
 */
JSDOC.plugins.Base = function(name) {    
    this.name = name;   
            
    // register plugin with Manager
    JSDOC.resistor.PluginMgr.register(this, this.initPlugin());               
       
};
JSDOC.plugins.Base.prototype = {
    
    /***
     * @public {String} name
     * this plugin's name
     */
    name : '',
                    
    /***
     * initPlugin
     * @desc Meant to be overridden by plugin extension
     */   
     initPlugin : function() {},
                          
    /***
     * @public execute
     * @deprecated
     * meant to be overridden
     * @param {JSDOC.TokenStream} ts
     * @param {Integer} index, index of name that plugin responded to
     * @param {Object} param, {name, comment}
     * @return JSDOC.Token
     */
     execute : function(ts, index, param) {  
        this.ts = ts;
        this.index = index;
        this.entity = ts.look(index).data;
                  
        // delegate to plugin extension now     
        var token = this.onExecute(param);
        
        if (! token instanceof JSDOC.Token) {
            print ("JSDOC.plugins.Base::execute -- plugin did not return a Token.  creating default Token");
            var token = new JSDOC.Token("", "COMM", "JSDOC");            
        }                      
        return token;                   
    }
};