/**
	@class Provides accessors to a JSDOC TokenStream.
*/
JSDOC.TokenReader = function(opt) {
	this.keepDocs = true;
	this.keepWhite = false;
	this.keepComments = false;
}

JSDOC.TokenReader.prototype.tokenize = function(/**JSDOC.TokenStream*/stream) {
	var tokens = [];
	/**@ignore*/ tokens.last = function() { return tokens[tokens.length-1]; }

	while (!stream.look().eof) {
		if (this.read_mlcomment(stream, tokens)) continue;
		if (this.read_slcomment(stream, tokens)) continue;
		if (this.read_dbquote(stream, tokens)) continue;
		if (this.read_snquote(stream, tokens)) continue;
		if (this.read_regx(stream, tokens)) continue;
		if (this.read_numb(stream, tokens)) continue;
		if (this.read_punc(stream, tokens)) continue;
		if (this.read_space(stream, tokens)) continue;
		if (this.read_newline(stream, tokens)) continue;
		if (this.read_word(stream, tokens)) continue;
		
		tokens.push(new JSDOC.Token(stream.next(), "TOKN", "UNKNOWN_TOKEN")); // This is an error case.
	}
	return tokens;
}

JSDOC.TokenReader.prototype.read_word = function(/**JSDOC.TokenStream*/stream, tokens) {
	var found = "";
	while (!stream.look().eof && JSDOC.Lang.isWordChar(stream.look())) {
		found += stream.next();
	}
	
	if (found === "") {
		return false;
	}
	else {
		var name;
		if ((name = JSDOC.Lang.keyword(found))) tokens.push(new JSDOC.Token(found, "KEYW", name));
		else tokens.push(new JSDOC.Token(found, "NAME", "NAME"));
		return true;
	}
}

JSDOC.TokenReader.prototype.read_punc = function(/**JSDOC.TokenStream*/stream, tokens) {
	var found = "";
	var name;
	while (!stream.look().eof && JSDOC.Lang.punc(found+stream.look())) {
		found += stream.next();
	}
	
	if (found === "") {
		return false;
	}
	else {
		tokens.push(new JSDOC.Token(found, "PUNC", JSDOC.Lang.punc(found)));
		return true;
	}
}

JSDOC.TokenReader.prototype.read_space = function(/**JSDOC.TokenStream*/stream, tokens) {
	var found = "";
	
	while (!stream.look().eof && JSDOC.Lang.isSpace(stream.look())) {
		found += stream.next();
	}
	
	if (found === "") {
		return false;
	}
	else {
		if (this.collapseWhite) found = " ";
		if (this.keepWhite) tokens.push(new JSDOC.Token(found, "WHIT", "SPACE"));
		return true;
	}
}

JSDOC.TokenReader.prototype.read_newline = function(/**JSDOC.TokenStream*/stream, tokens) {
	var found = "";
	
	while (!stream.look().eof && JSDOC.Lang.isNewline(stream.look())) {
		found += stream.next();
	}
	
	if (found === "") {
		return false;
	}
	else {
		if (this.collapseWhite) found = "\n";
		if (this.keepWhite) tokens.push(new JSDOC.Token(found, "WHIT", "NEWLINE"));
		return true;
	}
}

JSDOC.TokenReader.prototype.read_mlcomment = function(/**JSDOC.TokenStream*/stream, tokens) {
	if (stream.look() == "/" && stream.look(1) == "*") {
		var found = stream.next(2);
		
		while (!stream.look().eof && !(stream.look(-1) == "/" && stream.look(-2) == "*")) {
			found += stream.next();
		}
		
		if (/^\/\*\*[^*]/.test(found) && this.keepDocs) tokens.push(new JSDOC.Token(found, "COMM", "JSDOC"));
		else if (this.keepComments) tokens.push(new JSDOC.Token(found, "COMM", "MULTI_LINE_COMM"));
		return true;
	}
	return false;
}

JSDOC.TokenReader.prototype.read_slcomment = function(/**JSDOC.TokenStream*/stream, tokens) {
	var found;
	if (
		(stream.look() == "/" && stream.look(1) == "/" && (found=stream.next(2)))
		|| 
		(stream.look() == "<" && stream.look(1) == "!" && stream.look(2) == "-" && stream.look(3) == "-" && (found=stream.next(4)))
	) {
		
		while (!stream.look().eof && !JSDOC.Lang.isNewline(stream.look())) {
			found += stream.next();
		}
		
		if (this.keepComments) {
			tokens.push(new JSDOC.Token(found, "COMM", "SINGLE_LINE_COMM"));
		}
		return true;
	}
	return false;
}

JSDOC.TokenReader.prototype.read_dbquote = function(/**JSDOC.TokenStream*/stream, tokens) {
	if (stream.look() == "\"") {
		// find terminator
		var string = stream.next();
		
		while (!stream.look().eof) {
			if (stream.look() == "\\") {
				if (JSDOC.Lang.isNewline(stream.look(1))) {
					do {
						stream.next();
					} while (!stream.look().eof && JSDOC.Lang.isNewline(stream.look()));
					string += "\\\n";
				}
				else {
					string += stream.next(2);
				}
			}
			else if (stream.look() == "\"") {
				string += stream.next();
				tokens.push(new JSDOC.Token(string, "STRN", "DOUBLE_QUOTE"));
				return true;
			}
			else {
				string += stream.next();
			}
		}
	}
	return false; // error! unterminated string
}

JSDOC.TokenReader.prototype.read_snquote = function(/**JSDOC.TokenStream*/stream, tokens) {
	if (stream.look() == "'") {
		// find terminator
		var string = stream.next();
		
		while (!stream.look().eof) {
			if (stream.look() == "\\") { // escape sequence
				string += stream.next(2);
			}
			else if (stream.look() == "'") {
				string += stream.next();
				tokens.push(new JSDOC.Token(string, "STRN", "SINGLE_QUOTE"));
				return true;
			}
			else {
				string += stream.next();
			}
		}
	}
	return false; // error! unterminated string
}

JSDOC.TokenReader.prototype.read_numb = function(/**JSDOC.TokenStream*/stream, tokens) {
	if (stream.look() === "0" && stream.look(1) == "x") {
		return JSDOC.Lang.read_hex(stream, tokens);
	}
	
	var found = "";
	
	while (!stream.look().eof && JSDOC.Lang.isNumber(found+stream.look())){
		found += stream.next();
	}
	
	if (found === "") {
		return false;
	}
	else {
		if (/^0[0-7]/.test(found)) tokens.push(new JSDOC.Token(found, "NUMB", "OCTAL"));
		else tokens.push(new JSDOC.Token(found, "NUMB", "DECIMAL"));
		return true;
	}
}

/**
	@returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_hex = function(/**JSDOC.TokenStream*/stream, tokens) {
	var found = stream.next(2);
	
	while (!stream.look().eof) {
		if (JSDOC.Lang.isHexDec(found) && !JSDOC.Lang.isHexDec(found+stream.look())) { // done
			tokens.push(new JSDOC.Token(found, "NUMB", "HEX_DEC"));
			return true;
		}
		else {
			found += stream.next();
		}
	}
	return false;
}

/**
	@returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_regx = function(/**JSDOC.TokenStream*/stream, tokens) {
	if (
		stream.look() == "/"
		&& 
		(
			!tokens.last()
			||
			(
				!tokens.last().is("NUMB")
				&& !tokens.last().is("NAME")
				&& !tokens.last().is("RIGHT_PAREN")
				&& !tokens.last().is("RIGHT_BRACKET")
			)
		)
	) {
		var regex = stream.next();
		
		while (!stream.look().eof) {
			if (stream.look() == "\\") { // escape sequence
				regex += stream.next(2);
			}
			else if (stream.look() == "/") {
				regex += stream.next();
				
				while (/[gmi]/.test(stream.look())) {
					regex += stream.next();
				}
				
				tokens.push(new JSDOC.Token(regex, "REGX", "REGX"));
				return true;
			}
			else {
				regex += stream.next();
			}
		}
		// error: unterminated regex
	}
	return false;
}
