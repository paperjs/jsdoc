/***
 * @overview template-parsing resources
 * @namespace JSDOC.template
 * @desc A collection of handy utilities for use in all templates
 * @author Chris Scott
 */
JSDOC.template = {};


/**
 * @class JSDOC.template.Util
 * @singleton
 * A collection of template functions.  these methods can be included into an Ext.XTemplate constructor like so:
 * var tpl = new Ext.Template('<p>{[this.summarize(values.get("alias"))]}</p>'), JSDOC.template.Util);
 * 
 */
JSDOC.template.Util = function(){
    
    return {
        
        /***
         * getClassName
         * if classname == "Foo.util.Bar", className will be "Bar"
         * @param {Object} v
         */
        getClassName : function(v) {
            return v.split('.').pop();
        },
    
        /***
         * getPackageName    
         * if classname == 'Foo.util.Bar', package name will be Foo.util      
         * @param {String} class/alias
         * @return {String}
         */
        getPackageName : function(v) {
            var path = v.split('.');
            path.pop();
            return path.join('.');    
        },
      
        /** Just the first sentence. */
        summarize : function(desc) {
            if (typeof desc != "undefined") 
                return desc.match(/([\w\W]+?\.)[^a-z0-9]/i) ? RegExp.$1 : desc;
        },
        
        /** make a symbol sorter by some attribute */
        makeSortby : function(attribute){
            return function(a, b){
                if (a.get(attribute) != undefined && b.get(attribute) != undefined) {
                    a = a.get(attribute).toLowerCase();
                    b = b.get(attribute).toLowerCase();
                    if (a < b) 
                        return -1;
                    if (a > b) 
                        return 1;
                    return 0;
                }
            }
        },
        
        include : function(path){
            var path = publish.conf.templatesDir + "jsdoc/" + path;
            return IO.readFile(path);
        },
        
        makeSrcFile : function(path, srcDir, name){
            if (!name) 
                name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
            
            var src = {
                path: path,
                name: name,
                hilited: ""
            };
            
            if (defined(JSDOC.PluginManager)) {
                JSDOC.PluginManager.run("onPublishSrc", src);
            }
            
            if (src.hilited) {
                IO.saveFile(srcDir, name + publish.conf.ext, src.hilited);
            }
        },
        
        makeSignature : function(params){
            if (!params) 
                return "()";
            var signature = "(" +
            params.filter(function($){
                return $.name.indexOf(".") == -1; // don't show config params in signature
            }).map(function($){
                return (($.type) ? "<span class=\"light\">" + (new Link().toSymbol($.type)) + " </span>" : "") +
                $.name;
            }).join(", ") +
            ")";
            return signature;
        },
        
        /** Find symbol {@link ...} strings in text and turn into html links */
        resolveLinks : function(str, from){
            str = str.replace(/\{@link ([^} ]+) ?\}/gi, function(match, symbolName){
                return new Link().toSymbol(symbolName);
            });
            
            return str;
        }
    }
}();

/**
 * @class JSDOC.template.Link
 * A class for creating different kinds of links on a doc.  
 */
JSDOC.template.Link = function() {
    // constructor   
};
JSDOC.template.Link.prototype = {
    
    alias : '',
    src : '',
    file : '',
    text: '',
    targetName : '',
    
    /***
     * target
     * @param {String} targetName
     * @return {Object} this
     */   
    target : function(targetName){
        if (defined(targetName)) 
            this.targetName = targetName;
        return this;
    },
    
    /***
     * withText
     * @param {String} text
     */
    withText : function(text){
        if (defined(text)) 
            this.text = text;
        return this;
    },
    
    /***
     * toSrc
     * @param {String} filename
     * @return {Object} this
     */
    toSrc : function(filename){
        if (defined(filename)) 
            this.src = filename;
        return this;
    },
    
    /***
     * toSymbol
     * @param {String} alias
     * @return {Object} this
     */
    toSymbol : function(alias){
        if (defined(alias)) 
            this.alias = new String(alias);
        return this;
    },
    
    /***
     * toFile     
     * @param {String} file
     * @return {Object} this
     */
    toFile : function(file){
        if (defined(file)) 
            this.file = file;
        return this;
    },
    
    /***
     * toString
     */
    toString : function(){
        var linkString;
        var thisLink = this;
        
        if (this.alias) {
            linkString = this.alias.replace(/(?:^|[^a-z$0-9_])(#[a-z$0-9_#-.]+|[a-z$0-9_#-.]+)\b/gi, function(match, symbolName){
                return thisLink._makeSymbolLink(symbolName);
            });
        }
        else 
            if (this.src) {
                linkString = thisLink._makeSrcLink(this.src);
            }
            else 
                if (this.file) {
                    linkString = thisLink._makeFileLink(this.file);
                }
        return linkString;
    },
    
    /***
     * symbolNameToLinkName
     * @param {String} symbol
     * @return {String}
     */   
    symbolNameToLinkName : function(symbol){
        var linker = "";
        if (symbol.get('isStatic')) 
            linker = ".";
        else 
            if (symbol.get('isInner')) 
                linker = "-";
        
        return linker + symbol.get("name");
    },
    
    /** Create a link to a snother symbol. */
    makeSymbolLink : function(alias){
        var linkBase = Link.base + publish.conf.symbolsDir;
        var linkTo;
        var linkPath;
        var target = (this.targetName) ? " target=\"" + this.targetName + "\"" : "";
        
        // is it an interfile link?
        if (alias.charAt(0) == "#") 
            var linkPath = alias;
        // if there is no symbol by that name just return the name unaltered
        else 
            if (!(linkTo = JSDOC.template.Link.symbolGroup.getSymbol(alias))) 
                return alias;
            // it's a symbol in another file
            else {
                linkPath = escape(linkTo.get('alias')) + publish.conf.ext;
                if (!linkTo.is("CONSTRUCTOR")) { // it's a method or property
                    linkPath = escape(linkTo.get('parentConstructor')) || "_global_";
                    linkPath += publish.conf.ext + "#" + Link.symbolNameToLinkName(linkTo);
                }
                linkPath = linkBase + linkPath
            }
        
        if (!this.text) 
            this.text = alias;
        return "<a href=\"" + linkPath + "\"" + target + ">" + this.text + "</a>";
    },
    
    /** Create a link to a source file. */
    _makeSrcLink : function(srcFilePath){
        var target = (this.targetName) ? " target=\"" + this.targetName + "\"" : "";
        
        // transform filepath into a filename
        var srcFile = srcFilePath.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
        var outFilePath = publish.conf.srcDir + srcFile + publish.conf.ext;
        
        if (!this.text) 
            this.text = JSDOC.Util.fileName(srcFilePath);
        return "<a href=\"" + outFilePath + "\"" + target + ">" + this.text + "</a>";
    },
    
    /** Create a link to a source file. */
    _makeFileLink : function(filePath){
        var target = (this.targetName) ? " target=\"" + this.targetName + "\"" : "";
        
        var outFilePath = Link.base + filePath;
        
        if (!this.text) 
            this.text = filePath;
        return "<a href=\"" + outFilePath + "\"" + target + ">" + this.text + "</a>";
    }
};

/** Appended to the front of relative link paths. */
JSDOC.template.Link.base = "";

/** chris: I saw a ref to this in publish.js.  not sure what it's for */
JSDOC.template.symbolGroup = null;
