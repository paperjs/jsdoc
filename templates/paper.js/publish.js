/** Called automatically by JsDoc Toolkit. */
load(JSDOC.opt.t + 'src/Symbol.js');
load(JSDOC.opt.t + 'src/Utils.js');
load(JSDOC.opt.t + 'src/Operator.js');
load(JSDOC.opt.t + 'src/Render.js');

function publish(symbolSet) {
	var renderMode = JSDOC.opt.D.renderMode;
	var serverdocs = renderMode == 'serverdocs';
	var extension = serverdocs ? '.txt' : '.html';
	var templateDir = JSDOC.opt.t || SYS.pwd + '../templates/jsdoc/';
	var outDir = JSDOC.opt.d || SYS.pwd + '../dist/docs/';

	publish.conf = {  // trailing slash expected for dirs
		// Use no extensions in links for serverdocs
		ext: serverdocs ? '' : extension,
		outDir: outDir,
		templateDir: templateDir,
		staticDir: templateDir + 'static/',
		classesDir: outDir + (serverdocs ? '' : 'classes/'),
		symbolsDir: serverdocs ? 'reference/' : 'classes/',
		srcDir: 'symbols/src/',
		renderMode: renderMode,
		globalName: 'Global Scope'
	};
	
	Link.base = serverdocs ? '/' : '../';

	if (renderMode == 'docs') {
		// Copy over the static files
		Utils.copyDirectory(
			new java.io.File(publish.conf.staticDir),
			new java.io.File(publish.conf.outDir)
		);
	} else {
		Utils.deleteFiles(new File(publish.conf.outDir));
	}
	// Create the classes directory
	new java.io.File(publish.conf.classesDir).mkdirs();

	// used to allow Link to check the details of things being linked to
	Link.symbolSet = symbolSet;

	// get an array version of the symbolset, useful for filtering
	var symbols = symbolSet.toArray(),
		files = JSDOC.opt.srcFiles,
		aliasSort = Utils.makeSortby('alias'),
 		classes = symbols.filter(Utils.isaClass).sort(aliasSort);
	
	// Create a filemap in which outfiles must be to be named uniquely, ignoring
	// case since we want lowercase links for serverdocs, we always use this
	Link.filemap = {};
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		if (!symbol.isVisible())
			continue;
		var alias = symbol.alias,
			lcAlias = alias.toLowerCase();
		// Use lowercase links for serverdocs
		var linkAlias = serverdocs ? lcAlias : alias;
		// Rename _global_.html to global.html
		if (linkAlias == '_global_')
			linkAlias = 'global';
		Link.filemap[alias] = linkAlias;
	}

	// create each of the class pages
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		if (!symbol.isVisible())
			continue;
		symbol.events = symbol.getEvents();   // 1 order matters
		symbol.methods = symbol.getMethods(); // 2
		
		Link.currentSymbol = symbol;
		var html = Render._class(symbol);
		var classDir = publish.conf.classesDir;
		var name = symbol.alias;
		if (serverdocs) {
			if (name == '_global_')
				name = 'global';
			classDir += name + '/';
			new java.io.File(classDir).mkdirs();
			name = 'class';
		} else {
			name = Link.filemap[name];
			html = Render.html({
				content: html,
				title: symbol.alias
			});
		}
		IO.saveFile(classDir, name + extension, html);
	}
	if (serverdocs) {
		IO.saveFile(publish.conf.outDir, 'classes.txt', Render.classes());
	} else {
		IO.saveFile(publish.conf.classesDir, 'index.html', Render.index());
	}
}