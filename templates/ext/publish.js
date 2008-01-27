function publish(symbolGroup) {
                    
    var outDir = (typeof(JSDOC.opt.d) != 'undefined') ? JSDOC.opt.d : SYS.pwd() + "../out/jsdox/";
	publish.conf = {  // trailing slash expected for dirs
		ext: ".html",
		outDir: outDir + "/",
		//templatesDir: SYS.pwd()+"../templates/",
        templatesDir: SYS.pwd() + "../" + JSDOC.opt.t + '/',
		symbolsDir: "symbols/",
		srcDir: "src/"
	};	 
        	
    // build template directory structure
    buildTemplate();    
        
	// used to check the details of things being linked to
	JSDOC.template.Link.symbolGroup = symbolGroup;
    
    // create XTemplate instances.                          
	try {
        var indexTpl = new Ext.XTemplate(IO.readFile(publish.conf.templatesDir + "index.tmpl"), JSDOC.template.Util).compile();
        var classTpl = new Ext.XTemplate(IO.readFile(publish.conf.templatesDir + "class.tmpl"), JSDOC.template.Util).compile();        
        var filesTpl = new Ext.XTemplate(IO.readFile(publish.conf.templatesDir + "allfiles.tmpl"), JSDOC.template.Util).compile();        
        var classesTpl = new Ext.XTemplate(IO.readFile(publish.conf.templatesDir + "allclasses.tmpl"), JSDOC.template.Util).compile();		
	}
	catch(e) {
		print(e.message);
		quit();
	}
	     
	// filters
	function hasNoParent($) {return ($.memberof == "")}
	function isaFile($) {return ($.is("FILE"))}
	function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace())}
	
	var symbols = symbolGroup.getSymbols();
	var classes = symbols.filter(isaClass).sort(JSDOC.template.Util.makeSortby("alias"));
    
    // create output dir-structure
    var srcDir = publish.conf.outDir + "src/";
	var files = JSDOC.opt.srcFiles;	
 	for (var i = 0, l = files.length; i < l; i++) { 		
 		// DISABLE SRC FILES FOR NOW
        //tplResources.makeSrcFile(files[i], srcDir);
 	}
    
 	       
	//publish.classesIndex = classesTemplate.process(classes);
	print ("num classes: " + classes.length);
    
    // create data hash for index.tmpl
    var treeData = {    
        "id": "apidocs",
        "text": "API Documentation",
        "iconCls": "icon-docs",        
        "singleClickExpand": true,
        "children": []
    };    
    
    var packages = {};
    var list = [];
    
    // build package hash and list of classes.
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
        print('symbol: ' + symbol.get('name') + ', isa: ' + symbol.get('isa'));
        
        var path = symbol.get('name').split('.');
        var className = path.pop(); // <-- remove last item Namespace.package.ClassName *pop*
        var parent = path.join('.');         
        if (path.length) {
            
            // check if this package name has been registerd in hash already.
            var name = path.join('.');                                    
            ns = path.shift();                       // <-- Namespace exists?
            if (typeof(packages[name]) == 'undefined') { // Namespace.package                
                if (typeof(packages[ns]) == 'undefined') {
                    packages[ns] = 'root'; // <-- parent ('Apollo' : 'root'
                }
                for (var n = 0, len = path.length; n < len; n++) {
                    if (typeof(packages[ns + '.' + path[n]]) == 'undefined') {
                        packages[ns + '.' + path[n]] = ns; // <-- parent  ('Apollo.order' : 'Apollo')
                    }
                    ns = ns + '.' + path[n]; // <-- ns becomes "Apollo.order" now                
                }
            }            
        }    
        var filename = symbol.get("alias") + publish.conf.ext;
        
        if (symbol.get("alias") != '') { // sometimes a symbol wiht no alias is getting through
            // class tree-node   
            list.push({
                id: 'cls-' + symbol.get('name'),
                parent: parent,
                text: className,
                iconCls: 'icon-cls',
                leaf: true,
                href: 'symbols/' + filename,
                cls: 'cls',
                children: []
            });
            
            // create output for Class.File.html
            var output = classTpl.applyTemplate(symbol);
            //var output = '<h1>Symbol: ' + symbol.get('name') + '</h1>';
        }
        
        
        /*{
            alias: symbol.get('alias'),
            name: symbol.get('name'),            
            pkg: symbol.get('package'),
            srcFile: symbol.get('srcFile'),
            augments: symbol.get('augments'),
            augments_src: 'symbols/' + symbol.get('augments') + publish.conf.ext,
            config: [],
            properties: [],
            methods: symbol.get('methods'),
            events: []
        });
        */
        
        IO.saveFile(publish.conf.outDir + "symbols/", filename, output);
		
		//output = classTemplate.process(symbol);
//		IO.mkPath(publish.conf.symbolsDir.split("/"));
		//IO.saveFile(publish.conf.outDir+"symbols/", symbol.get("alias")+publish.conf.ext, output);
	}
	    
    // build recursive Package tree.
    for (var pkg in packages) {       
        if (packages[pkg] == 'root') {                                     
            treeData.children.push(buildPackage(pkg, packages, list));
        }        
    }         
        
	IO.saveFile(publish.conf.outDir, 'index.html', indexTpl.applyTemplate({
        classData : Ext.encode(treeData)
    }));
    
	//IO.saveFile(publish.conf.outDir, "allclasses-frame"+publish.conf.ext, classesIndex)

	//var filesIndex = filesTemplate.process(files);
	//IO.saveFile(publish.conf.outDir, "allFiles-frame"+publish.conf.ext, filesIndex)

	// handle static files
	if (publish.conf.outDir) {
        // don't copy /static/index.html anymore.
		//IO.copyFile(publish.conf.templatesDir+"/static/index.html", publish.conf.outDir);
	} 
}


/***
 * buildTemplate
 * creates template directories and static files
 */
function buildTemplate() {
    
    IO.makeDir(publish.conf.outDir);
    
    // create base directories.
    IO.makeDir(publish.conf.outDir + "symbols");
    IO.makeDir(publish.conf.outDir + "src");
                       
    // copy entire resources dir (copied from Ext docs
    IO.makeDir(publish.conf.outDir + 'resources');    
    var resources = IO.ls(publish.conf.templatesDir + '/static/resources');
    for (var n=0,len=resources.length;n<len;n++) {
        IO.copyFile(resources[n], publish.conf.outDir + 'resources');    
    }
    
    // copy welcome.html
    IO.copyFile(publish.conf.templatesDir + '/static/welcome.html', publish.conf.outDir);
}
/***
 * buildPackage
 * recursively iteractes package & classlist to build tree nodes.
 * @param {Object} parent
 * @param {Object} packages
 * @param {Object} classes
 * @return {Object} Package
 */
function buildPackage(name, packages, classes) {
    var children = [];
    for (var pkg in packages) {
        if (packages[pkg] == name) {
            children.push(buildPackage(pkg, packages, classes))
        }    
    } 
    for (var n=0,len=classes.length;n<len;n++) {
        if (classes[n].parent == name) {
            children.push(classes[n]);
        }
    }
    return {
        id: 'pkg-' + name,
        text: name.split('.').pop(),        
        iconCls: 'icon-pkg',
        cls: 'package',
        singleClickExpand: true,
        children: children                
    };       
}
