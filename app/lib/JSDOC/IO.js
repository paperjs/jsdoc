/**
	@namespace
*/
JSDOC.IO = {
}

// shortcuts
var FileWriter = Packages.java.io.FileWriter;
var File = Packages.java.io.File;
var FileSeparator = Packages.java.io.File.separator;

JSDOC.IO.saveFile = function(outDir, fileName, content) {
	var out = new Packages.java.io.PrintWriter(
		new Packages.java.io.OutputStreamWriter(
			new Packages.java.io.FileOutputStream(outDir+FileSeparator+fileName),
			JSDOC.IO.encoding
		)
	);
	out.write(content);
	out.flush();
	out.close();
}

JSDOC.IO.readFile = function(path) {
	if (!JSDOC.IO.exists(path)) {
		throw new java.io.FileNotFoundException("File doesn't exist there: "+path);
	}
	return readFile(path, JSDOC.IO.encoding);
}

JSDOC.IO.copyFile = function(inFile, outDir, fileName) {
	if (fileName == null) fileName = JSDOC.Util.fileName(inFile);

	var inFile = new File(inFile);
	var outFile = new File(outDir+FileSeparator+fileName);
	
	var bis = new Packages.java.io.BufferedInputStream(new Packages.java.io.FileInputStream(inFile), 4096);
	var bos = new Packages.java.io.BufferedOutputStream(new Packages.java.io.FileOutputStream(outFile), 4096);
	var theChar;
	while ((theChar = bis.read()) != -1) {
		bos.write(theChar);
	}
	bos.close();
	bis.close();
}

JSDOC.IO.mkPath  = function(/**Array*/ path) {
	var make = "";
	for (var i = 0, l = path.length; i < l; i++) {
		make += path[i]+"/";
		if (! JSDOC.IO.exists(make)) {
			JSDOC.IO.makeDir(make);
		}
	}
}

JSDOC.IO.makeDir = function(dirName) {
	(new File(dirName)).mkdir();
}

JSDOC.IO.ls = function(dir, recurse, allFiles, path) {
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

		if ((new File(path.join("/")+"/"+file)).list()) { // it's a directory
			path.push(file);
			if (path.length-1 < recurse) JSDOC.IO.ls(path.join("/"), recurse, allFiles, path);
			path.pop();
		}
		else {
			allFiles.push((path.join("/")+"/"+file).replace("//", "/"));
		}
	}

	return allFiles;
}

JSDOC.IO.exists = function(path) {
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
}

JSDOC.IO.open = function(path, append) {
	var append = true;
	var outFile = new Packages.java.io.File(path);
	var out = new Packages.java.io.PrintWriter(
		new Packages.java.io.OutputStreamWriter(
			new Packages.java.io.FileOutputStream(outFile, append),
			JSDOC.IO.encoding
		)
	);
	return out;
}

JSDOC.IO.setEncoding = function(encoding) {
	if (/ISO-8859-([0-9]+)/i.test(encoding)) {
		JSDOC.IO.encoding = "ISO8859_"+RegExp.$1;
	}
	else {
		JSDOC.IO.encoding = encoding;
	}
}

/** @default "utf-8"
	@private
 */
JSDOC.IO.encoding = "utf-8";
