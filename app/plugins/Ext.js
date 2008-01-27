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
        return {     
                  
            // Ext inheritance
            'Ext.extend' : this.onExtend,              
                        
            // Ext inheritance
            'Ext.override' : this.onOverride,
                            
            // comment src
            'commentsrc' : this.onCommentSrc,
            
            // comment tag                
            'commenttags' : this.onCommentTags,                               
        };
    },
    
    /***
     * onCommentSrc
     * @param {Object} param
     */        
    onCommentSrc : function(param) {
        //print ('Ext::onCommentSrc ' + param);  
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
        //print ('Ext::onExtend ' + param);
        
        var ts = param.ts;
        if (ts.look(-1).is("ASSIGN") && ts.look(1).data == '(') {
            
            extClass = ts.look(-2).data;                    
            extSuper = ts.look(2).data;
            
            //print ("--- found case 1: class: " + extClass + ', super: ' + extSuper);
            
        }
        else {
            extClass = ts.look(2).data;
            extSuper = ts.look(4).data;
            
            //print ("--- found case 2: class: " + extClass + ', super: ' + extSuper);
                         
        }
        // pop off initially created Symbol so we can create a new one.  not sure how hackish this is but it works.
        original = JSDOC.Parser.symbols.pop();
                                        
        JSDOC.Parser.symbols.push(new JSDOC.Symbol().init(extClass, [], "CONSTRUCTOR", new JSDOC.DocComment('')));                                                
    },
    
    /***
     * onExecute
     * implements JSDOC.plugins.Base::execute
     * @param {String} entity, the name which caused this plugin to react.    
     * @return JSDOC.Token     
     */
    onExecute : function(param) {
        print ("Ext.onExecute: " + this.entity);
                                               
        var mode = 0;
                                                                
        switch (this.entity) {
            case 'Ext.extend':
                var token = new JSDOC.Token("", "COMM", "JSDOC");
                                
                var extClass = '';
                var extSuper = '';
                var name = '';
                var comment = '';                            
                                
                // case 1: Foo = Ext.extend(Bar, {});                                                                                                                                                             
                if (this.ts.look(this.index -1).is("ASSIGN") && this.ts.look(this.index + 1).data == '(') {                                                                           
                    comment = param.comment;                                  
                    extClass = this.ts.look(this.index - 2).data;                    
                    extSuper = this.ts.look(this.index + 2).data;                                             			      			                                                                                  
                }                
                else { // case 2: Ext.extend(Foo, Bar, {});                    
                    extClass = this.ts.look(this.index + 2).data;
                     extSuper = this.ts.look(this.index + 4).data;                     
                                                            
                    // This is a special case with Ext, where the constructor and comment have been defined and we're currently
                    // processing the Ext.extend(Child, Parent, {}) part.  A symbol for this name has already been added, so
                    // we're going to look for it and remove it.  this method is going to add a new one.  if we don't remove it,
                    // we'll have duplicate entries for this class. 
                                                                    
                    constructor = JSDOC.Parser.symbols.pop();                                           
                    comment = "/***\n" + constructor.get('comment') + "*/"; // <-- need to re-wrap comment because DocComment provides no accessors.                                                                                                                                                                                                                                                                
                }
                               
                var pkg = extClass.split('.');
                var alias = pkg.pop(); 
                    
                var insert = comment+"/**\n"; 
                if (!insert.match(/@package/)) {                                       
                    insert += "@package " + pkg.join('.') + "\n";
                }                  
                if (!insert.match(/@class/)) {                    
                    insert += "@class " + extClass + "\n";
                }     
                if (!insert.match(/@alias/)) {
                    insert += "@alias " + alias + "\n";
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
                
                // push new symbol
                JSDOC.Parser.symbols.push(new JSDOC.Symbol().init(extClass, [], "CONSTRUCTOR", new JSDOC.DocComment(insert)));
                                
                return token;
                                     
                break;
        }
                
    }       
});

/***
 * instantiate Ext plugin.  
 *  plugins automatically register themselves with JSDOC.resistor.PluginMgr
 */
new JSDOC.plugins.Ext('ext');

