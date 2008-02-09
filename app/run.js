importClass(java.lang.System);

/** @namespace A collection of information about your system. */
SYS = {
	/** Information about your operating system. */
	os: [
		System.getProperty("os.name"),
		System.getProperty("os.arch"),
		System.getProperty("os.version")
	],
	
	/** Which way does your slash lean. */
	slash: System.getProperty("file.separator")||"/",
	
	/** Java's concept of your home folder. */
	userDir: System.getProperty("user.dir"),
	
	/** Where is Java. */
	javaHome: System.getProperty("java.home"),
	
	/** The path to this script, relative to your cwd. */
	thisScript: undefined,
	
	/** The absolute path to the directory containing this script. */
	pwd: undefined
};

/** @class Manipulate a filepath. */
function FilePath(absPath) {
	this.root = FilePath.separator;
	this.path = [];
	this.file = "";
	
	var parts = absPath.split(/[\\\/]/);
	if (parts) {
		if (parts.length) this.root = parts.shift() + FilePath.separator;
		if (parts.length) this.file =  parts.pop()
		if (parts.length) this.path = parts;
	}
	
	this.path = this.resolvePath();
}
FilePath.separator = SYS.slash;

/** Collapse any .. or . items in a filepath. */
FilePath.prototype.resolvePath = function() {
	var resolvedPath = [];
	for (var i = 0; i < this.path.length; i++) {
		if (this.path[i] == "..") resolvedPath.pop();
		else if (this.path[i] != ".") resolvedPath.push(this.path[i]);
	}
	return resolvedPath;
}

/** Shorten a full filepath to the directory. */
FilePath.prototype.toDir = function(n) {
	if (this.file) this.file = "";
	return this;
}

/** Go up a directory. */
FilePath.prototype.upDir = function(n) {
	this.toDir();
	if (this.path.length) this.path.pop();
	return this;
}

FilePath.prototype.toString = function() {
	return this.root
		+ this.path.join(FilePath.separator)
		+ ((this.path.length > 0)? FilePath.separator : "")
		+ this.file;
}

if (arguments[arguments.length-1].match(/^-j=(.+)/)) {
	SYS.thisScript = RegExp.$1;
	arguments.pop();
}
else {
	print("run with JsRun.");
	quit();
}

SYS.pwd = new FilePath(SYS.userDir + SYS.slash + SYS.thisScript).toDir().toString();

// shortcut
var File = Packages.java.io.File;

/**
	@namespace A collection of functions that deal with reading a writing to disk.
*/
IO = {
	saveFile: function(outDir, fileName, content) {
		var out = new Packages.java.io.PrintWriter(
			new Packages.java.io.OutputStreamWriter(
				new Packages.java.io.FileOutputStream(outDir+SYS.slash+fileName),
				IO.encoding
			)
		);
		out.write(content);
		out.flush();
		out.close();
	},

	readFile: function(path) {
		if (!IO.exists(path)) {
			throw "File doesn't exist there: "+path;
		}
		return readFile(path, IO.encoding);
	},

	copyFile: function(inFile, outDir, fileName) {
		if (fileName == null) fileName = JSDOC.Util.fileName(inFile);
	
		var inFile = new File(inFile);
		var outFile = new File(outDir+SYS.slash+fileName);
		
		var bis = new Packages.java.io.BufferedInputStream(new Packages.java.io.FileInputStream(inFile), 4096);
		var bos = new Packages.java.io.BufferedOutputStream(new Packages.java.io.FileOutputStream(outFile), 4096);
		var theChar;
		while ((theChar = bis.read()) != -1) {
			bos.write(theChar);
		}
		bos.close();
		bis.close();
	},

	mkPath: function(/**Array*/ path) {
		var make = "";
		for (var i = 0, l = path.length; i < l; i++) {
			make += path[i] + SYS.slash;
			if (! IO.exists(make)) {
				IO.makeDir(make);
			}
		}
	},

	makeDir: function(/**string*/ dirName) {
		(new File(dirName)).mkdir();
	},

	ls: function(dir, recurse, allFiles, path) {
		if (path === undefined) { // initially
			var allFiles = [];
			var path = [dir];
		}
		if (path.length == 0) return allFiles;
		if (recurse === undefined) recurse = 1;
		
		dir = new File(dir);
		if (!dir.directory) return [String(dir)];
		var files = dir.list();
		
		for (var f = 0; f < files.length; f++) {
			var file = String(files[f]);
			if (file.match(/^\.[^\.\/\\]/)) continue; // skip dot files
	
			if ((new File(path.join(SYS.slash)+SYS.slash+file)).list()) { // it's a directory
				path.push(file);
				if (path.length-1 < recurse) IO.ls(path.join(SYS.slash), recurse, allFiles, path);
				path.pop();
			}
			else {
				allFiles.push((path.join(SYS.slash)+SYS.slash+file).replace(SYS.slash+SYS.slash, SYS.slash));
			}
		}
	
		return allFiles;
	},

	exists: function(path) {
		file = new File(path);
	
		if (file.isDirectory()){
			return true;
		}
		if (!file.exists()){
			return false;
		}
		if (!file.canRead()){
			return false;
		}
		return true;
	},

	open: function(path, append) {
		var append = true;
		var outFile = new Packages.java.io.File(path);
		var out = new Packages.java.io.PrintWriter(
			new Packages.java.io.OutputStreamWriter(
				new Packages.java.io.FileOutputStream(outFile, append),
				IO.encoding
			)
		);
		return out;
	},

	setEncoding: function(encoding) {
		if (/ISO-8859-([0-9]+)/i.test(encoding)) {
			IO.encoding = "ISO8859_"+RegExp.$1;
		}
		else {
			IO.encoding = encoding;
		}
	},

	/** @default "utf-8"
		@private
	 */
	encoding: "utf-8",
	
	include: function(relativePath) {
		load(SYS.pwd+relativePath);
	},
	
	includeDir: function(path) {
		if (!path) return;
		
		for (var lib = IO.ls(SYS.pwd+path), i = 0; i < lib.length; i++) 
			load(lib[i]);
	}
}

/** @namespace Keep track of messages from the running script. */
LOG = {
	warn: function(msg, e) {
		if (e) msg = e.fileName+", line "+e.lineNumber+": "+msg;
		
		msg = ">> WARNING: "+msg;
		LOG.warnings.push(msg);
		if (LOG.out) LOG.out.write(msg+"\n");
		else print(msg);
	},

	inform: function(msg) {
		msg = " > "+msg;
		if (LOG.out) LOG.out.write(msg+"\n");
		else if (typeof LOG.verbose != "undefined" && LOG.verbose) print(msg);
	}
};
LOG.warnings = [];
LOG.verbose = true
LOG.file = undefined;


IO.include("main.js");