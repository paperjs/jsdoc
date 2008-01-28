print ('Plugin Ext installed');

/***
 * @class JSDOC.plugins.Ext
 * @param {String} name
 */
JSDOC.plugins.Ext = Ext.extend(JSDOC.plugins.Base, {
    
    /***
     * initPlugin
     */    
    initPlugin : function() {
        var events = {     
            fnbody : {
                'this.addEvents' : this.onAddEvents    
            },
            tokens : {
                // Ext inheritance
                'Ext.extend' : this.onExtend,              
                            
                // Ext inheritance
                'Ext.override' : this.onOverride   
            },                                     
            comments: {                
                // comment src
                'commentsrc' : this.onCommentSrc,
            
                // comment tag                
                'commenttags' : this.onCommentTags
            }                               
        };
        return events;        
    },
    
    /***
     * onAddEvents
     * this.addEvents({
     *     ***
     *     * @event onfoo
     *     * @param {Object} this
     *     *         
     * });
     * @param {Object} param
     */
    onAddEvents : function(param) {
        //print ("---- Ext plugin found this.addEvents " + param.nspace);   
        
        var object = param.nspace.split('#').shift();
        
        //print ('object : ' + object);
        
        // create a new Stream and hunt for @event comments.                        
        var block = new JSDOC.TokenStream(param.ts.balance("LEFT_CURLY"));
        while (block.look()) {
            if (!block.look().is("VOID") && block.look().is("JSDOC")) {               		                        
                // we need to discover the scope of this event and add a @scope tag to this comment.
                // after doing so, we'll create a new Symbol.
                
                var comment = new JSDOC.DocComment(block.look().data);                                                
                var ename = comment.getTag('event').toString().split("\n").shift();                                                                                                                                              
                var event = new JSDOC.Symbol().init(object + "#" + ename, [], "FUNCTION", comment);
                                
                JSDOC.Parser.symbols.push(event);
                
            }
            if (!block.next()) break;
        }                            
        
         
    },
    
    /***
     * onCommentSrc
     * @param {Object} param
     */        
    onCommentSrc : function(param) {
        //print ('Ext::onCommentSrc ' + param.nspace);  
    },
    
    /***
     * onCommentTags
     * @param {Object} param
     */
    onCommentTags : function(param) {
        //print ('Ext::onCommentTags ' + param);      
    },
    
    /***
     * onSymbol
     * @param {Object} symbol
     */
    onSymbol: function(symbol) {
        //print ('Ext::onSymbol');                    
    },
    
    /***
     * onSymbol
     * @param {Object} param
     */
    onOverride : function(param) {
        //print ('Ext::onOverride ' + param);
    },
    
    /***
     * onExtend
     * @param {Object} param
     */
    onExtend : function(param) {
        var ts = param.ts;
        var x = param.x;
        
        //print ('Ext::onExtend ' + param.name);
        //print ('look-1: ' + ts.look(x).data);
                       
        var doc = '';
        if (ts.look(-1).is("JSDOC")) doc = ts.look(-1).data;
		else if (ts.look(-1).is("VAR") && ts.look(-2).is("JSDOC")) doc = ts.look(-2).data;
        
        // case 1: Foo = Ext.extend(Bar, {});                                
        if (ts.look(x-1).is("ASSIGN") && ts.look(x+1).data == '(') {
            
            extClass = ts.look(x-2).data;                    
            extSuper = ts.look(x+2).data;
            
            //print ("--- found case 1: class: " + extClass + ', super: ' + extSuper);
            
        }
        // case 2: Ext.extend(Foo, Bar, {});     
        else {
            extClass = ts.look(x+2).data;
            extSuper = ts.look(x+4).data;
            
            //print ("--- found case 2: class: " + extClass + ', super: ' + extSuper);
                         
        }
        
        var pkg = extClass.split('.');
        var alias = pkg.pop(); 
            
        var insert = doc+"/**\n"; 
        if (!insert.match(/@package/)) {                                       
            insert += "@package " + pkg.join('.') + "\n";
        }                  
        if (!insert.match(/@class/)) {                    
            insert += "@class " + extClass + "\n";
        }     
        if (!insert.match(/@alias/)) {
            insert += "@alias " + extClass + "\n";
        }                           
        if (!insert.match(/@constructor/)) {
            insert += "@constructor\n";
        }
        if (!insert.match(/@extends/)) {
            insert += "@augments " + extSuper + "\n";                    
        }  
        if (!insert.match(/@scope/)) {
            insert += "@scope " + extClass + ".prototype\n";
        }                                                            
        insert += '*/';    			
		insert = insert.replace(/\*\/\/\*\*/g, "\n");    			
	    token.data = insert;                                
                
        var c = new JSDOC.Token("", "COMM", "JSDOC");
	    c.data = insert;
		ts.insertAhead(c);
                                                                               
        // pop off initially created Symbol so we can create a new one.  not sure how hackish this is but it works.
        original = JSDOC.Parser.symbols.pop();
                                        
        // push new symbol
        JSDOC.Parser.symbols.push(new JSDOC.Symbol().init(extClass, [], "CONSTRUCTOR", new JSDOC.DocComment(insert)));                                                                                           
    }       
});

/***
 * instantiate Ext plugin.  
 *  plugins automatically register themselves with JSDOC.resistor.PluginMgr
 */
new JSDOC.plugins.Ext('ext');

