/**
 * This publishes raw symbols datas to a file which will later be proceeded by
 * another script (see typescript-definition-generator.js).
 */
function publish(symbolSet) {
	// Filter and organize JSDOC parsed data.
	var symbols = symbolSet.toArray().sort(makeSortby('alias'));
	var classes = symbols.filter(isClass).filter(isVisible);
	var global = symbols.filter(isGlobal)[0];

	// Build a data object which will be used by next script.
	var result = {
		classes: classes,
		global: global,
		version: JSDOC.opt.D.version,
		date: JSDOC.opt.D.date
	};

	// Write it in a file.
	var file = JSDOC.opt.D.file;
	var directory = FilePath.dir(JSDOC.opt.D.file);
	IO.mkPath(directory);
	IO.saveFile(directory, FilePath.fileName(file), JSON.stringify(result));


	// Utility methods

	function isClass(_) {
		return ((_.is('CONSTRUCTOR') || _.isNamespace) && (_.alias != '_global_'));
	}

	function isGlobal(_) {
		return _.isNamespace && _.alias == '_global_' && _.properties.length > 0;
	}

	function isVisible(_) {
		return _.isVisible();
	}

	function makeSortby(attribute) {
		return function(a, b) {
			if (a[attribute] != undefined && b[attribute] != undefined) {
				a = a[attribute].toLowerCase();
				b = b[attribute].toLowerCase();
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			}
		};
	}
}